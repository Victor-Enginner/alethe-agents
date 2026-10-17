/** Geometry and activation rules for the Token Biome brain. Pure, so it can be tested without WebGL. */

export type BrainLobe = 'claude' | 'codex' | 'antigravity'

export interface BrainPoint {
  x: number
  y: number
  z: number
  lobe: BrainLobe
}

/** Deterministic generator: the same seed always grows the same brain. */
function seeded(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/**
 * Two folded hemispheres. The back of the brain belongs to Antigravity, the left front to Claude
 * and the right front to Codex.
 */
export function buildBrain(count: number, seed = 7): BrainPoint[] {
  const rnd = seeded(seed)
  const points: BrainPoint[] = []
  while (points.length < count) {
    const hemisphere = rnd() < 0.5 ? -1 : 1
    const u = rnd() * 2 - 1
    const theta = rnd() * Math.PI * 2
    const q = Math.sqrt(1 - u * u)
    const x = q * Math.cos(theta)
    const y = u
    const z = q * Math.sin(theta)
    const fold =
      1 + 0.07 * Math.sin(x * 9 + z * 7) + 0.05 * Math.sin(y * 11 - z * 5) + 0.04 * Math.sin(z * 13 + x * 3)
    const shell = rnd() < 0.82 ? 1 : 0.55 + rnd() * 0.4
    const px = hemisphere * 0.58 + x * 0.82 * fold * shell
    const py = y * 0.95 * fold * shell
    const pz = z * 1.5 * fold * shell
    const lobe: BrainLobe = pz < -0.55 ? 'antigravity' : px < 0 ? 'claude' : 'codex'
    points.push({ x: px, y: py, z: pz, lobe })
  }
  return points
}

/** Share of a lobe's neurons that light up: one order of magnitude of tokens per tenth, capped at 1. */
export function lobeActivation(totalTokens: number | null | undefined): number {
  if (!totalTokens || totalTokens <= 0) return 0
  return Math.min(1, Math.log10(totalTokens) / 10)
}

/** Picks which neurons of each lobe are lit, deterministically. */
export function pickLit(
  points: BrainPoint[],
  activation: Record<BrainLobe, number>,
  seed = 11,
): boolean[] {
  const rnd = seeded(seed)
  return points.map((point) => rnd() < activation[point.lobe])
}

/** Share of input-side tokens served from cache, 0..1; null when nothing was read. */
export function cacheShare(t: { input: number; cache_read: number; cache_write: number }): number | null {
  const total = t.input + t.cache_read + t.cache_write
  return total > 0 ? t.cache_read / total : null
}
