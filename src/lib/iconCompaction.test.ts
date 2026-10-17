import { describe, expect, it } from 'vitest'

import {
  collectOversizedIcons,
  isOversizedIconDataUrl,
  MAX_ICON_DATA_URL_CHARS,
  replaceIcons,
} from './iconCompaction'
import type { Group, Project, WorkspaceTab } from './types'

const big = `data:image/png;base64,${'A'.repeat(MAX_ICON_DATA_URL_CHARS)}`
const small = 'data:image/png;base64,AAAA'

const project = (id: string, iconUrl?: string) => ({ id, iconUrl }) as unknown as Project
const group = (id: string, iconUrl?: string) => ({ id, iconUrl }) as unknown as Group
const tab = (id: string, iconUrl?: string) => ({ id, iconUrl }) as unknown as WorkspaceTab

describe('icon compaction', () => {
  it('flags only large image data URLs', () => {
    expect(isOversizedIconDataUrl(big)).toBe(true)
    expect(isOversizedIconDataUrl(small)).toBe(false)
    expect(isOversizedIconDataUrl(`https://x/${'a'.repeat(MAX_ICON_DATA_URL_CHARS)}`)).toBe(false)
    expect(isOversizedIconDataUrl(undefined)).toBe(false)
  })

  it('collects each oversized icon once across projects, groups and tab copies', () => {
    const doc = {
      projects: [project('p1', big), project('p2', small)],
      groups: [group('g1', big)],
      workspace: { tabs: [tab('t1', big)], closedTabs: [tab('t2', big), tab('t3')] },
    }
    expect([...collectOversizedIcons(doc)]).toEqual([big])
  })

  it('replaces every copy and keeps untouched arrays by identity', () => {
    const doc = {
      projects: [project('p1', big)],
      groups: [group('g1', small)],
      workspace: { tabs: [tab('t1', small)], closedTabs: [tab('t2', big)] },
    }
    const next = replaceIcons(doc, new Map([[big, small]]))
    expect(next.projects[0].iconUrl).toBe(small)
    expect(next.workspace.closedTabs?.[0].iconUrl).toBe(small)
    expect(next.groups).toBe(doc.groups)
    expect(next.workspace.tabs).toBe(doc.workspace.tabs)
  })
})
