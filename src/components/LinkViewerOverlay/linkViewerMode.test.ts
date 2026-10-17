import { describe, expect, it } from 'vitest'

import { linkViewerMode } from './linkViewerMode'

describe('linkViewerMode', () => {
  it('renders local Markdown files with the Markdown renderer, never as a web page', () => {
    expect(linkViewerMode('O:\\DEV\\A JORNADA\\tools\\PROMPT-ALETHE-MELHORIAS.md')).toBe('markdown')
    expect(linkViewerMode('/home/me/NORTE.md:12')).toBe('markdown')
  })

  it('embeds only http(s) addresses', () => {
    expect(linkViewerMode('https://example.com/docs')).toBe('web')
    expect(linkViewerMode('https://github.com/x/y/blob/main/README.md')).toBe('web')
  })

  it('plays videos and refuses other local files instead of a blank iframe', () => {
    expect(linkViewerMode('C:\\clips\\demo.mp4')).toBe('video')
    expect(linkViewerMode('C:\\notes\\todo.txt')).toBe('unsupported')
  })
})
