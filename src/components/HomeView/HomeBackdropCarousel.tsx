import { type CSSProperties, useEffect, useState } from 'react'

import { AsciiEffect } from '../ui/ascii-effect'
import { ASCII_FADE_MS, ASCII_SLIDE_MS, ASCII_SLIDES, type AsciiSlide } from './asciiRecipes'
import styles from './HomeBackdropCarousel.module.css'

interface Props {
  reducedMotion: boolean
  recipes?: AsciiSlide[]
}

/**
 * Fundo da home: alterna as receitas ASCII com cross-fade.
 * Só o slide atual e o anterior (durante o fade) ficam montados, então só um ou dois
 * canvases animam por vez. Com movimento reduzido, fica parado no primeiro.
 */
export function HomeBackdropCarousel({ reducedMotion, recipes = ASCII_SLIDES }: Props) {
  const [index, setIndex] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)

  useEffect(() => {
    if (reducedMotion || recipes.length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => {
        setPrevious(current)
        return (current + 1) % recipes.length
      })
    }, ASCII_SLIDE_MS)
    return () => window.clearInterval(timer)
  }, [reducedMotion, recipes.length])

  useEffect(() => {
    if (previous === null) return
    const timer = window.setTimeout(() => setPrevious(null), ASCII_FADE_MS)
    return () => window.clearTimeout(timer)
  }, [previous])

  if (!recipes.length) return null

  return (
    <div className={styles.carousel} style={{ '--fade-ms': `${ASCII_FADE_MS}ms` } as CSSProperties}>
      {[previous, index].map((slide) => {
        if (slide === null) return null
        const recipe = recipes[slide]
        const { vignette = 0, grain = 0, bloom = 0, tint } = recipe.overlay
        return (
          <div
            key={`${recipe.id}-${slide}`}
            className={`${styles.slide} ${slide === index ? styles.entering : styles.leaving}`}
            data-recipe={recipe.id}
            style={
              {
                '--vignette': vignette / 100,
                '--grain': grain / 100,
                '--bloom': bloom / 100,
                '--tint': tint?.color ?? 'transparent',
                '--tint-opacity': (tint?.opacity ?? 0) / 100,
              } as CSSProperties
            }
          >
            {recipe.kind === 'video' ? (
              <video
                className={styles.video}
                src={recipe.src}
                poster={recipe.poster || undefined}
                autoPlay={!reducedMotion}
                loop
                muted
                playsInline
              />
            ) : (
              <AsciiEffect
                imageSrc={recipe.image}
                alt=""
                fit="cover"
                scale={1}
                backgroundColor="transparent"
                reducedMotion={reducedMotion}
                {...recipe.effect}
              />
            )}
            {bloom > 0 && <div className={styles.bloom} />}
            {tint && <div className={styles.tint} />}
            {grain > 0 && <div className={styles.grain} />}
            {vignette > 0 && <div className={styles.vignette} />}
          </div>
        )
      })}
    </div>
  )
}
