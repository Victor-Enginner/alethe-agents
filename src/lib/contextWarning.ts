import type { ContextWarningPreferences } from './types'

export type ContextLevel = 'ok' | 'warn' | 'critical'

export const CONTEXT_THRESHOLD_MIN = 10_000
export const CONTEXT_THRESHOLD_MAX = 2_000_000

export const RESUME_FILE_NAME = 'RETOMADA.md'

/** Where a terminal stands against the user's context thresholds. */
export function contextLevel(
  tokens: number | null | undefined,
  thresholds: ContextWarningPreferences,
): ContextLevel {
  if (!thresholds.enabled || tokens == null || !Number.isFinite(tokens)) return 'ok'
  if (tokens >= thresholds.criticalTokens) return 'critical'
  if (tokens >= thresholds.warnTokens) return 'warn'
  return 'ok'
}

/** Clamps stored thresholds and keeps `warn` strictly below `critical`. */
export function normalizeContextWarning(
  raw: Partial<ContextWarningPreferences> | undefined,
  defaults: ContextWarningPreferences,
): ContextWarningPreferences {
  const clamp = (value: unknown, fallback: number) => {
    const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback
    return Math.round(Math.min(CONTEXT_THRESHOLD_MAX, Math.max(CONTEXT_THRESHOLD_MIN, number)))
  }
  const criticalTokens = clamp(raw?.criticalTokens, defaults.criticalTokens)
  const warnTokens = Math.min(clamp(raw?.warnTokens, defaults.warnTokens), criticalTokens - 1)
  return {
    enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : defaults.enabled,
    warnTokens,
    criticalTokens,
  }
}

/** Joins the resume file onto a terminal cwd using that cwd's own separator. */
export function resumeFilePath(cwd: string): string {
  const trimmed = cwd.trim().replace(/[\\/]+$/, '')
  const separator = trimmed.includes('\\') && !trimmed.includes('/') ? '\\' : '/'
  return `${trimmed}${separator}${RESUME_FILE_NAME}`
}
