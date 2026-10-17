import { useEffect } from 'react'
import { create } from 'zustand'

import { getActiveSessions } from '../lib/sessionResume'
import { getSessionCost, type SessionCost } from '../lib/tauri'
import { useTerminalsStore } from './terminalsStore'

export type AgentCostEntry = {
  ptyId: string
  agent: string
  sessionId: string
  cwd: string
  cost: SessionCost | null

  updatedAt: number
}

type AgentCostState = {
  byPtyId: Record<string, AgentCostEntry>

  refresh: () => Promise<void>
}

function liveAgentSessions(): Array<{
  ptyId: string
  agent: string
  sessionId: string
  cwd: string
}> {
  const sessions = getActiveSessions()
  const alive = useTerminalsStore.getState().byPtyId
  const out: Array<{ ptyId: string; agent: string; sessionId: string; cwd: string }> = []
  for (const [ptyId, s] of Object.entries(sessions)) {
    if (!alive[ptyId]?.alive) continue
    const sessionId =
      s.agent === 'codex'
        ? s.codexSessionId
        : s.agent === 'opencode'
          ? s.opencodeSessionId
          : s.claudeSessionId
    if (!sessionId) continue
    if (s.agent !== 'claude' && s.agent !== 'codex' && s.agent !== 'opencode') continue
    out.push({ ptyId, agent: s.agent, sessionId, cwd: s.cwd })
  }
  return out
}

export const useAgentCostStore = create<AgentCostState>((set) => ({
  byPtyId: {},

  refresh: async () => {
    const live = liveAgentSessions()
    const liveIds = new Set(live.map((s) => s.ptyId))

    const results = await Promise.all(
      live.map(async (s) => {
        try {
          const cost = await getSessionCost(s.agent, s.cwd, s.sessionId)
          return { ...s, cost, updatedAt: Date.now() } as AgentCostEntry
        } catch {
          return null
        }
      }),
    )

    set((state) => {
      const next: Record<string, AgentCostEntry> = {}

      let changed = Object.keys(state.byPtyId).length !== live.length
      for (const s of live) {
        const fresh = results.find((r) => r && r.ptyId === s.ptyId) ?? null
        const previous = state.byPtyId[s.ptyId]
        // Keep the old object when nothing moved, so subscribers skip a re-render.
        if (fresh && previous && sameCost(previous.cost, fresh.cost)) {
          next[s.ptyId] = previous
          continue
        }
        changed = true
        next[s.ptyId] = fresh ??
          state.byPtyId[s.ptyId] ?? {
            ptyId: s.ptyId,
            agent: s.agent,
            sessionId: s.sessionId,
            cwd: s.cwd,
            cost: null,
            updatedAt: 0,
          }
      }
      // Drops PTYs that died.
      void liveIds
      return changed ? { byPtyId: next } : state
    })
  },
}))

function sameCost(a: SessionCost | null, b: SessionCost | null): boolean {
  if (!a || !b) return a === b
  return (
    a.total_tokens === b.total_tokens &&
    a.cost_usd === b.cost_usd &&
    a.model === b.model &&
    (a.context_tokens ?? null) === (b.context_tokens ?? null)
  )
}

export const CONTEXT_POLL_MS = 15_000

/** App-wide, low-frequency refresh that feeds the per-terminal context badge. */
export function useAgentCostPolling(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const refresh = () => void useAgentCostStore.getState().refresh()
    refresh()
    const timer = window.setInterval(refresh, CONTEXT_POLL_MS)
    return () => window.clearInterval(timer)
  }, [enabled])
}

export function selectCostTotals(state: AgentCostState): {
  costUsd: number
  totalTokens: number
  agents: number
} {
  let costUsd = 0
  let totalTokens = 0
  let agents = 0
  for (const entry of Object.values(state.byPtyId)) {
    agents += 1
    if (entry.cost) {
      totalTokens += entry.cost.total_tokens
      if (entry.cost.cost_usd != null) costUsd += entry.cost.cost_usd
    }
  }
  return { costUsd, totalTokens, agents }
}
