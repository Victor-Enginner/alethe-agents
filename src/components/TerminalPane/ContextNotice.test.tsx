import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const tauri = vi.hoisted(() => ({ readTextFile: vi.fn(), writePty: vi.fn() }))
vi.mock('../../lib/tauri', () => tauri)

const state = vi.hoisted(() => ({
  contextTokens: 0 as number | null,
  createTerminal: vi.fn(() => ({ id: 'term-new' })),
  setActiveTerminal: vi.fn(),
  requestPaneFocus: vi.fn(),
  pushToast: vi.fn(),
}))

vi.mock('../../stores/agentCostStore', () => ({
  useAgentCostStore: (selector: (s: unknown) => unknown) =>
    selector({ byPtyId: { 'pty-1': { cost: { context_tokens: state.contextTokens } } } }),
}))

vi.mock('../../stores/projectsStore', () => {
  const store = {
    preferences: {
      language: 'en',
      contextWarning: { enabled: true, warnTokens: 200_000, criticalTokens: 300_000 },
    },
    createTerminal: state.createTerminal,
  }
  const useProjectsStore = (selector: (s: unknown) => unknown) => selector(store)
  useProjectsStore.getState = () => store
  return { useProjectsStore }
})

vi.mock('../../stores/uiStore', () => ({
  useUiStore: {
    getState: () => ({
      setActiveTerminal: state.setActiveTerminal,
      requestPaneFocus: state.requestPaneFocus,
      pushToast: state.pushToast,
    }),
  },
}))

import { ContextBadge, ContextBanner } from './ContextNotice'

beforeEach(() => {
  vi.useFakeTimers()
  tauri.readTextFile.mockReset()
  tauri.writePty.mockReset().mockResolvedValue(undefined)
  state.createTerminal.mockClear()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('ContextBadge', () => {
  it('shows the last-turn context and turns yellow, then red', () => {
    state.contextTokens = 150_000
    const { rerender } = render(<ContextBadge ptyId="pty-1" />)
    expect(screen.getByText('150.0k ctx').className).not.toMatch(/warn|critical/)

    state.contextTokens = 210_000
    rerender(<ContextBadge ptyId="pty-1" />)
    expect(screen.getByText('210.0k ctx').className).toMatch(/warn/)

    state.contextTokens = 320_000
    rerender(<ContextBadge ptyId="pty-1" />)
    expect(screen.getByText('320.0k ctx').className).toMatch(/critical/)
  })

  it('renders nothing when the agent reports no context', () => {
    state.contextTokens = null
    const { container } = render(<ContextBadge ptyId="pty-1" />)
    expect(container.firstChild).toBeNull()
  })
})

describe('ContextBanner', () => {
  const props = { ptyId: 'pty-1', projectId: 'p1', agent: 'claude', cwd: '/repo' } as const

  it('stays hidden below the red threshold', () => {
    state.contextTokens = 250_000
    const { container } = render(<ContextBanner {...props} />)
    expect(container.firstChild).toBeNull()
  })

  it('asks the agent to update RETOMADA.md, waits for it, then opens a new session', async () => {
    state.contextTokens = 310_000
    tauri.readTextFile
      .mockResolvedValueOnce('old')
      .mockResolvedValueOnce('old')
      .mockResolvedValue('new')
    render(<ContextBanner {...props} />)
    expect(screen.getByText(/High context: open a new session from RETOMADA.md/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000)
    })

    expect(tauri.readTextFile).toHaveBeenCalledWith('/repo/RETOMADA.md')
    expect(tauri.writePty.mock.calls[0][1]).toMatch(/^Update RETOMADA.md in this folder/)
    expect(tauri.writePty).toHaveBeenLastCalledWith('pty-1', '\r')
    expect(state.createTerminal).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        cwd: '/repo',
        firstTab: expect.objectContaining({
          type: 'claude',
          initialInput: expect.stringMatching(/^Read RETOMADA.md/),
        }),
      }),
    )
    expect(state.pushToast).not.toHaveBeenCalled()
  })
})
