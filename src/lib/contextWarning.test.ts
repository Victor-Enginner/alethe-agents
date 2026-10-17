import { describe, expect, it } from 'vitest'

import { contextLevel, normalizeContextWarning, resumeFilePath } from './contextWarning'
import { DEFAULT_PREFERENCES } from './types'

const defaults = DEFAULT_PREFERENCES.contextWarning

describe('contextLevel', () => {
  it('defaults to yellow from 200k and red from 300k', () => {
    expect(defaults).toEqual({ enabled: true, warnTokens: 200_000, criticalTokens: 300_000 })
    expect(contextLevel(199_999, defaults)).toBe('ok')
    expect(contextLevel(200_000, defaults)).toBe('warn')
    expect(contextLevel(299_999, defaults)).toBe('warn')
    expect(contextLevel(300_000, defaults)).toBe('critical')
  })

  it('stays quiet when disabled or when the context is unknown', () => {
    expect(contextLevel(900_000, { ...defaults, enabled: false })).toBe('ok')
    expect(contextLevel(null, defaults)).toBe('ok')
    expect(contextLevel(undefined, defaults)).toBe('ok')
  })
})

describe('normalizeContextWarning', () => {
  it('backfills missing preferences', () => {
    expect(normalizeContextWarning(undefined, defaults)).toEqual(defaults)
  })

  it('clamps values and keeps the warning below the critical threshold', () => {
    expect(
      normalizeContextWarning({ warnTokens: 500_000, criticalTokens: 400_000 }, defaults),
    ).toEqual({ enabled: true, warnTokens: 399_999, criticalTokens: 400_000 })
    expect(normalizeContextWarning({ warnTokens: -5, criticalTokens: 9e9 }, defaults)).toEqual({
      enabled: true,
      warnTokens: 10_000,
      criticalTokens: 2_000_000,
    })
  })
})

describe('resumeFilePath', () => {
  it('uses the separator of the terminal cwd', () => {
    expect(resumeFilePath('O:\\DEV\\A JORNADA\\')).toBe('O:\\DEV\\A JORNADA\\RETOMADA.md')
    expect(resumeFilePath('/home/me/proj')).toBe('/home/me/proj/RETOMADA.md')
  })
})
