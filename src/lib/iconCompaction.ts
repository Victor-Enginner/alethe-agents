import type { Group, Project, WorkspaceTab } from './types'

/** Icons render at ~20-44 px; anything bigger than this is wasted bytes in projects.json. */
export const MAX_ICON_DATA_URL_CHARS = 96_000
export const ICON_MAX_EDGE_PX = 128

type IconDocument = {
  projects: Project[]
  groups: Group[]
  workspace: { tabs: WorkspaceTab[]; closedTabs?: WorkspaceTab[] }
}

export function isOversizedIconDataUrl(value: string | undefined): value is string {
  return Boolean(value && value.startsWith('data:image/') && value.length > MAX_ICON_DATA_URL_CHARS)
}

/** Unique oversized data URLs in the persisted document (projects, groups and tab copies). */
export function collectOversizedIcons(doc: IconDocument): Set<string> {
  const found = new Set<string>()
  const visit = (item: { iconUrl?: string }) => {
    if (isOversizedIconDataUrl(item.iconUrl)) found.add(item.iconUrl)
  }
  doc.projects.forEach(visit)
  doc.groups.forEach(visit)
  doc.workspace.tabs.forEach(visit)
  doc.workspace.closedTabs?.forEach(visit)
  return found
}

function replaceIn<T extends { iconUrl?: string }>(items: T[], map: Map<string, string>): T[] {
  let changed = false
  const next = items.map((item) => {
    const replacement = item.iconUrl ? map.get(item.iconUrl) : undefined
    if (replacement === undefined || replacement === item.iconUrl) return item
    changed = true
    return { ...item, iconUrl: replacement }
  })
  return changed ? next : items
}

/** Swaps icon URLs through `map`, keeping the original array identity where nothing changed. */
export function replaceIcons<D extends IconDocument>(
  doc: D,
  map: Map<string, string>,
): Pick<D, 'projects' | 'groups' | 'workspace'> {
  const tabs = replaceIn(doc.workspace.tabs, map)
  const closedTabs = doc.workspace.closedTabs ? replaceIn(doc.workspace.closedTabs, map) : undefined
  const workspace =
    tabs === doc.workspace.tabs && closedTabs === doc.workspace.closedTabs
      ? doc.workspace
      : { ...doc.workspace, tabs, ...(closedTabs ? { closedTabs } : {}) }
  return {
    projects: replaceIn(doc.projects, map),
    groups: replaceIn(doc.groups, map),
    workspace,
  }
}

/**
 * Re-encodes an image data URL so its longest edge is at most `maxEdge` px.
 * Small inputs come back untouched; failures return the original value.
 */
export async function shrinkImageDataUrl(
  dataUrl: string,
  maxEdge = ICON_MAX_EDGE_PX,
): Promise<string> {
  if (!isOversizedIconDataUrl(dataUrl)) return dataUrl
  try {
    const image = new Image()
    image.src = dataUrl
    await image.decode()
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return dataUrl
    context.drawImage(image, 0, 0, width, height)
    const webp = canvas.toDataURL('image/webp', 0.9)
    const shrunk = webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png')
    return shrunk.length < dataUrl.length ? shrunk : dataUrl
  } catch {
    return dataUrl
  }
}
