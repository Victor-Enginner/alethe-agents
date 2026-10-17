import { isMarkdownFilePath, isVideoFilePath } from '../XTermView/terminalLinks'

export type LinkViewerMode = 'video' | 'markdown' | 'web' | 'unsupported'

const WEB_URL_PATTERN = /^https?:\/\//i

/**
 * Decides how the link viewer renders a target. Local files must never fall
 * through to the iframe: a filesystem path there renders a blank page.
 */
export function linkViewerMode(target: string): LinkViewerMode {
  const value = target.trim()
  const web = WEB_URL_PATTERN.test(value)
  if (isVideoFilePath(value)) return 'video'
  if (!web && isMarkdownFilePath(value)) return 'markdown'
  return web ? 'web' : 'unsupported'
}
