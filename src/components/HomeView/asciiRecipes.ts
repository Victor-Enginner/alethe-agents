import type { AsciiEffectProps } from '../ui/ascii-effect'
import homeBackground from '../../assets/home-bg-right.png'

/**
 * Receitas do fundo da home, adaptadas das recipes de https://21st.dev/community/ascii.
 * Cada uma vira um slide do carrossel (HomeBackdropCarousel).
 *
 * `image` é provisória (home-bg-right.png) enquanto as fotos de origem não entram em
 * src/assets/home-bg/. Os efeitos pós-processamento (vinheta, grão, bloom, tint) são
 * camadas CSS sobre o canvas: ver `overlay`.
 */
export interface AsciiRecipe {
  id: string
  name: string
  image: string
  effect: Omit<AsciiEffectProps, 'imageSrc'>
  overlay: {
    /** 0-100, escurece as bordas */
    vignette?: number
    /** 0-100, ruído de filme */
    grain?: number
    /** 0-100, brilho difuso */
    bloom?: number
    /** cor + opacidade 0-100, misturada em soft-light */
    tint?: { color: string; opacity: number }
  }
}

export const ASCII_RECIPES: AsciiRecipe[] = [
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

/** tempo de cada slide antes de trocar */
export const ASCII_SLIDE_MS = 12_000
/** duração do cross-fade entre slides */
export const ASCII_FADE_MS = 1_200
