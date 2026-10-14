import type { AsciiEffectProps } from '../ui/ascii-effect'
import homeBackground from '../../assets/home-bg-right.png'
import slideA from '../../assets/home-bg/slide-a.mp4'
import slideB from '../../assets/home-bg/slide-b.mp4'
import slideC from '../../assets/home-bg/slide-c.mp4'
import starryVideo from '../../assets/home-bg/starry-nights.mp4'
import starryPoster from '../../assets/home-bg/starry-nights.webp'

/**
 * Slides do fundo da home, a partir das recipes de https://21st.dev/community/ascii.
 * - `recipe`: foto convertida em ASCII em tempo real pelo AsciiEffect.
 * - `video`: arte já renderizada pelo 21st (loop em MP4), tocada localmente, já que a
 *   CSP do app bloqueia mídia remota.
 * Vinheta, grão, bloom e tint são camadas CSS sobre o slide: ver `overlay`.
 * Fotos e vídeo em src/assets/home-bg/. A foto do Robot + Human ainda é provisória.
 */
export type AsciiSlide = AsciiRecipe | AsciiVideo

export interface AsciiOverlay {
  /** 0-100, escurece as bordas */
  vignette?: number
  /** 0-100, ruído de filme */
  grain?: number
  /** 0-100, brilho difuso */
  bloom?: number
  /** cor + opacidade 0-100, misturada em soft-light */
  tint?: { color: string; opacity: number }
}

export interface AsciiVideo {
  kind: 'video'
  id: string
  name: string
  src: string
  poster: string
  overlay: AsciiOverlay
}

export interface AsciiRecipe {
  kind?: 'recipe'
  id: string
  name: string
  image: string
  effect: Omit<AsciiEffectProps, 'imageSrc'>
  overlay: AsciiOverlay
}

export const ASCII_RECIPES: AsciiSlide[] = [
  {
    // recipe "Robot + Human": characters, grayscale, contrast 128, shimmer 60, vignette 58, grain 32
    id: 'robot-human',
    name: 'Robot + Human',
    image: homeBackground,
    effect: {
      variant: 'shimmer',
      renderMode: 'characters',
      chars: ' .:-=+*#%@',
      fontSize: 10,
      contrast: 1.28,
      brightnessBoost: 2.2,
      threshold: 0.03,
      shimmerIntensity: 0.6,
      colorMode: 'gradient',
      colors: ['#1b2633', '#9fb3c8', '#3ca6ff'],
    },
    overlay: { vignette: 58, grain: 32 },
  },
  {
    // recipe "Mosaic": blocos 16px, cor da foto, brilho +12, contrast 115, wave 60, bloom 25, vignette 38
    id: 'mosaic',
    name: 'Mosaic',
    image: homeBackground,
    effect: {
      variant: 'flow',
      renderMode: 'mosaic',
      fontSize: 16,
      contrast: 1.15,
      brightnessBoost: 2.4,
      threshold: 0.03,
      flowSpeed: 0.2,
      flowStrength: 10,
      colorMode: 'source',
    },
    overlay: { vignette: 38, bloom: 25 },
  },
  {
    // recipe "Vapor Halftone Portrait": dither/halftone 10px, shimmer 60, bloom 60, vignette 38, tint #ff8a3d 25% soft-light
    id: 'vapor-halftone',
    name: 'Vapor Halftone',
    image: homeBackground,
    effect: {
      variant: 'shimmer',
      renderMode: 'dots',
      fontSize: 10,
      contrast: 1.15,
      brightnessBoost: 2.2,
      threshold: 0.03,
      shimmerIntensity: 0.6,
      colorMode: 'source',
    },
    overlay: { vignette: 38, bloom: 60, tint: { color: '#ff8a3d', opacity: 25 } },
  },
]

/**
 * Carrossel ativo da home: exports em vídeo do 21st (arte idêntica à da galeria).
 * As receitas acima ficam disponíveis para efeitos ao vivo, mas fora do carrossel.
 */
export const ASCII_SLIDES: AsciiSlide[] = [
  { kind: 'video', id: 'slide-a', name: 'Slide A', src: slideA, poster: '', overlay: {} },
  { kind: 'video', id: 'slide-b', name: 'Slide B', src: slideB, poster: '', overlay: {} },
  { kind: 'video', id: 'slide-c', name: 'Slide C', src: slideC, poster: '', overlay: {} },
  {
    // "starry nights" (Van Gogh)
    // https://21st.dev/community/ascii/editor?from=7ad845c6-760e-459d-b294-96ed22fe439e
    kind: 'video',
    id: 'starry-nights',
    name: 'Starry Nights',
    src: starryVideo,
    poster: starryPoster,
    overlay: {},
  },
]

/** tempo de cada slide antes de trocar */
export const ASCII_SLIDE_MS = 12_000
/** duração do cross-fade entre slides */
export const ASCII_FADE_MS = 1_200
