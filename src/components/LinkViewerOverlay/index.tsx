import { ExternalLink, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'

import { useOnEscape } from '../../hooks/useOnEscape'
import { useT } from '../../lib/i18n'
import { openInBrowser, readTextFile } from '../../lib/tauri'
import { useProjectsStore } from '../../stores/projectsStore'
import { useUiStore } from '../../stores/uiStore'
import { VideoPreview } from '../VideoPreview'

const MarkdownRenderer = lazy(() =>
  import('../MarkdownPane/MarkdownRenderer').then((m) => ({ default: m.MarkdownRenderer })),
)
import { linkViewerMode } from './linkViewerMode'
import styles from './LinkViewerOverlay.module.css'

type MarkdownState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; content: string }

export function LinkViewerOverlay() {
  const t = useT()
  const url = useUiStore((s) => s.linkViewerUrl)
  const close = useUiStore((s) => s.closeLinkViewer)
  const dark = useProjectsStore(
    (s) => s.preferences.uiTheme !== 'light' && s.preferences.uiTheme !== 'min-light',
  )
  const [markdown, setMarkdown] = useState<MarkdownState>({ status: 'loading' })
  const mode = url ? linkViewerMode(url) : null
  const markdownFile = mode === 'markdown'

  useOnEscape(
    (e) => {
      e.preventDefault()
      close()
    },
    Boolean(url),
    { capture: true },
  )

  useEffect(() => {
    if (!markdownFile || !url) return
    let cancelled = false
    setMarkdown({ status: 'loading' })
    void readTextFile(url)
      .then((content) => {
        if (!cancelled) setMarkdown({ status: 'ready', content })
      })
      .catch(() => {
        if (!cancelled) setMarkdown({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [markdownFile, url])

  if (!url) return null

  return (
    <div className={styles.backdrop} onClick={close}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <span className={styles.url} title={url}>
            {url}
          </span>
          <button
            type="button"
            className={styles.headBtn}
            onClick={() => void openInBrowser(url)}
            title={t('xterm.openInBrowser')}
            aria-label={t('xterm.openInBrowser')}
          >
            <ExternalLink size={15} />
          </button>
          <button
            type="button"
            className={styles.headBtn}
            onClick={close}
            title={t('common.close')}
            aria-label={t('common.close')}
          >
            <X size={15} />
          </button>
        </div>
        <div className={styles.body}>
          {mode === 'video' ? (
            <VideoPreview path={url} className={styles.video} />
          ) : mode === 'markdown' ? (
            markdown.status === 'ready' ? (
              <div className={styles.markdown}>
                <Suspense fallback={<span>{t('ui.markdown.loading')}</span>}>
                  <MarkdownRenderer content={markdown.content} dark={dark} />
                </Suspense>
              </div>
            ) : (
              <div
                className={styles.message}
                role={markdown.status === 'error' ? 'alert' : undefined}
              >
                {markdown.status === 'error'
                  ? t('ui.markdown.loadError', { path: url })
                  : t('ui.markdown.loading')}
              </div>
            )
          ) : mode === 'web' ? (
            <iframe
              key={url}
              src={url}
              className={styles.frame}
              title={url}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={styles.message} role="alert">
              {t('ui.markdown.loadError', { path: url })}
            </div>
          )}
        </div>
        {mode === 'web' ? <div className={styles.hint}>{t('linkViewer.embedHint')}</div> : null}
      </div>
    </div>
  )
}
