import { describe, expect, it } from 'vitest'
import { buildBrain, cacheShare, lobeActivation, pickLit } from './tokenBrain'

describe('tokenBrain', () => {
  it('grows the same brain for the same seed and splits it into three lobes', () => {
    const a = buildBrain(600)
    expect(buildBrain(600)).toEqual(a)
    expect(a).toHaveLength(600)
    const lobes = new Set(a.map((p) => p.lobe))
    expect(lobes).toEqual(new Set(['claude', 'codex', 'antigravity']))
  })

  it('maps tokens to activation by order of magnitude and never invents it', () => {
    expect(lobeActivation(null)).toBe(0)
    expect(lobeActivation(0)).toBe(0)
    expect(lobeActivation(1e5)).toBeCloseTo(0.5)
    expect(lobeActivation(1e12)).toBe(1)
  })

  it('lights nothing in a lobe without data', () => {
    const points = buildBrain(400)
    const lit = pickLit(points, { claude: 1, codex: 0.5, antigravity: 0 })
    expect(points.every((p, i) => p.lobe !== 'antigravity' || !lit[i])).toBe(true)
    expect(points.every((p, i) => p.lobe !== 'claude' || lit[i])).toBe(true)
  })

  it('computes the cache share of input-side tokens', () => {
    expect(cacheShare({ input: 1, cache_read: 98, cache_write: 1 })).toBeCloseTo(0.98)
    expect(cacheShare({ input: 0, cache_read: 0, cache_write: 0 })).toBeNull()
  })
})
