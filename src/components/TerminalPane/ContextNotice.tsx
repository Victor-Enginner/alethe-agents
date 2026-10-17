import { useState } from 'react'

import { contextLevel, RESUME_FILE_NAME, resumeFilePath } from '../../lib/contextWarning'
import { fmtTokens } from '../../lib/costFormat'
import { useT } from '../../lib/i18n'
import { readTextFile, writePty } from '../../lib/tauri'
import { AGENT_TYPE_LABELS, type AgentType, type BuiltinAgentType } from '../../lib/types'
import { useAgentCostStore } from '../../stores/agentCostStore'
import { useProjectsStore } from '../../stores/projectsStore'
import { useUiStore } from '../../stores/uiStore'
import styles from './ContextNotice.module.css'

const RESUME_WAIT_MS = 180_000
const RESUME_POLL_MS = 3_000
const SUBMIT_DELAY_MS = 150

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

function useContextTokens(ptyId: string | undefined): number | null {
  return useAgentCostStore((s) => (ptyId ? (s.byPtyId[ptyId]?.cost?.context_tokens ?? null) : null))
}

/** Compact "212k ctx" chip in the pane header; yellow/red past the user's thresholds. */
export function ContextBadge({ ptyId }: { ptyId: string | undefined }) {
  const t = useT()
  const tokens = useContextTokens(ptyId)
  const thresholds = useProjectsStore((s) => s.preferences.contextWarning)
  if (tokens == null || !thresholds.enabled) return null
  const level = contextLevel(tokens, thresholds)
  const label = t('context.badgeTitle', { tokens: tokens.toLocaleString() })
  return (
    <span
      className={`${styles.badge} ${level === 'ok' ? '' : styles[level]}`}
      title={label}
      aria-label={label}
    >
      {t('context.badge', { tokens: fmtTokens(tokens) })}
    </span>
  )
}

type ContextBannerProps = {
  ptyId: string | undefined
  projectId: string
  agent: AgentType
  cwd: string
  extraArgs?: string[]
}

/**
 * Red strip shown past the critical threshold. Its action asks the running
 * agent to refresh RETOMADA.md, waits for the file to change, then opens a
 * fresh session of the same agent that starts from it.
 */
export function ContextBanner({ ptyId, projectId, agent, cwd, extraArgs }: ContextBannerProps) {
  const t = useT()
  const tokens = useContextTokens(ptyId)
  const thresholds = useProjectsStore((s) => s.preferences.contextWarning)
  const [busy, setBusy] = useState(false)
  if (!ptyId || !cwd || contextLevel(tokens, thresholds) !== 'critical') return null

  const startFromResume = async () => {
    setBusy(true)
    const ui = useUiStore.getState()
    try {
      const path = resumeFilePath(cwd)
      const before = await readTextFile(path).catch(() => null)
      await writePty(ptyId, t('context.resumeUpdatePrompt', { file: RESUME_FILE_NAME }))
      await sleep(SUBMIT_DELAY_MS)
      await writePty(ptyId, '\r')

      let updated = false
      for (let waited = 0; waited < RESUME_WAIT_MS; waited += RESUME_POLL_MS) {
        await sleep(RESUME_POLL_MS)
        const now = await readTextFile(path).catch(() => null)
        if (now !== null && now !== before) {
          updated = true
          // Give the agent a moment to finish writing before the new session reads it.
          await sleep(RESUME_POLL_MS)
          break
        }
      }
      if (!updated) ui.pushToast({ title: t('context.resumeTimeout'), body: path })

      const label = AGENT_TYPE_LABELS[agent as BuiltinAgentType] ?? agent
      const created = useProjectsStore.getState().createTerminal(projectId, {
        name: t('context.resumePaneName', { agent: label }),
        cwd,
        firstTab: {
          type: agent,
          cwd,
          extraArgs: extraArgs ?? [],
          initialInput: t('context.resumeBootstrapPrompt', { file: RESUME_FILE_NAME }),
        },
      })
      ui.setActiveTerminal(projectId, created.id)
      ui.requestPaneFocus(created.id)
    } catch (error) {
      ui.pushToast({ title: t('context.resumeFailed'), body: String(error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.banner} role="status">
      <span className={styles.bannerText}>
        {t('context.highTitle', { file: RESUME_FILE_NAME })}
      </span>
      <button
        type="button"
        className={styles.bannerAction}
        onClick={() => void startFromResume()}
        disabled={busy}
      >
        {busy
          ? t('context.resumeUpdating', { file: RESUME_FILE_NAME })
          : t('context.resumeAction', { file: RESUME_FILE_NAME })}
      </button>
    </div>
  )
}
