import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useT } from '../../lib/i18n'
import { getTokenBreakdown, type TokenBreakdown, type TokenTotals } from '../../lib/tauri'
import { cacheShare } from '../../lib/tokenBrain'
import { useUiStore } from '../../stores/uiStore'
import { Modal } from './Modal'
import styles from './TokenBiomeModal.module.css'

const DAYS = 14

const TokenBiomeScene = lazy(() =>
  import('./TokenBiomeScene').then((module) => ({ default: module.TokenBiomeScene })),
)

const sum = (t: TokenTotals) => t.input + t.cache_read + t.cache_write + t.output + t.reasoning

function compact(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 2 }).format(n)
}

export function TokenBiomeModal() {
  const t = useT()
  const open = useUiStore((s) => s.openModal === 'tokenBiome')
  const closeModal = useUiStore((s) => s.closeModal)
  const [data, setData] = useState<TokenBreakdown | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setFailed(false)
    getTokenBreakdown(DAYS).then(
      (result) => !cancelled && setData(result),
      () => !cancelled && setFailed(true),
    )
    return () => {
      cancelled = true
    }
  }, [open])

  const totals = useMemo(
    () => ({
      claude: data && sum(data.claude) > 0 ? sum(data.claude) : null,
      codex: data && sum(data.codex) > 0 ? sum(data.codex) : null,
      antigravity: null,
    }),
    [data],
  )
  const locale = navigator.language || 'en'

  const lobes = [
    { id: 'claude', name: 'Claude Code', color: 'var(--agent-claude)', stats: data?.claude },
    { id: 'codex', name: 'Codex', color: 'var(--agent-codex)', stats: data?.codex },
    { id: 'antigravity', name: 'Antigravity', color: 'var(--agent-antigravity)', stats: undefined },
  ] as const

  return (
    <Modal open={open} onClose={closeModal} title={t('tokenBiome.title')} width={980}>
      <p className={styles.description}>
        {t('tokenBiome.description')} · {t('tokenBiome.period', { days: DAYS })}
      </p>
      <div className={styles.stage}>
        {data ? (
          <Suspense fallback={null}>
            <TokenBiomeScene totals={totals} className={styles.scene} />
          </Suspense>
        ) : (
          <div className={styles.status}>{failed ? t('tokenBiome.error') : t('tokenBiome.loading')}</div>
        )}
      </div>
      <div className={styles.lobes}>
        {lobes.map((lobe) => {
          const total = lobe.stats ? sum(lobe.stats) : 0
          const share = lobe.stats ? cacheShare(lobe.stats) : null
          return (
            <div key={lobe.id} className={styles.lobe}>
              <span className={styles.lobeName}>
                <i className={styles.dot} style={{ background: lobe.color }} />
                {lobe.name}
              </span>
              {lobe.stats && total > 0 ? (
                <dl className={styles.stats}>
                  <div>
                    <dt>{t('tokenBiome.total')}</dt>
                    <dd>{compact(total, locale)}</dd>
                  </div>
                  <div>
                    <dt>{t('tokenBiome.cacheShare')}</dt>
                    <dd>{share === null ? '—' : `${(share * 100).toFixed(1)}%`}</dd>
                  </div>
                  <div>
                    <dt>{t('tokenBiome.output')}</dt>
                    <dd>{compact(lobe.stats.output, locale)}</dd>
                  </div>
                  {lobe.stats.reasoning > 0 ? (
                    <div>
                      <dt>{t('tokenBiome.reasoning')}</dt>
                      <dd>{compact(lobe.stats.reasoning, locale)}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <span className={styles.empty}>{t('tokenBiome.noData')}</span>
              )}
            </div>
          )
        })}
      </div>
      <p className={styles.note}>{t('tokenBiome.note')}</p>
    </Modal>
  )
}
