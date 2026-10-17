import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { buildBrain, lobeActivation, pickLit, type BrainLobe } from '../../lib/tokenBrain'

const NEURONS = 5200
const LOBES: BrainLobe[] = ['claude', 'codex', 'antigravity']

function readColor(el: HTMLElement, name: string): THREE.Color {
  return new THREE.Color(getComputedStyle(el).getPropertyValue(name).trim() || '#888888')
}

function isLight(el: HTMLElement): boolean {
  const match = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g)
  if (!match || match.length < 3) return false
  const [r, g, b] = match.map(Number)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55
}

/**
 * The brain itself. A lobe lights up in proportion to the tokens that agent spent; a lobe without a
 * reading stays dark instead of being simulated. Rendering stops when the stage is off screen, the
 * window is hidden, or the user asked for reduced motion.
 */
export function TokenBiomeScene({
  totals,
  className,
}: {
  totals: Record<BrainLobe, number | null>
  className?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const light = isLight(host)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.domElement.style.touchAction = 'none'
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.1, 50)
    camera.position.set(0, 0.2, 5.2)
    const group = new THREE.Group()
    scene.add(group)

    const colors: Record<BrainLobe, THREE.Color> = {
      claude: readColor(host, '--agent-claude'),
      codex: readColor(host, '--agent-codex'),
      antigravity: readColor(host, '--agent-antigravity'),
    }
    const dim = readColor(host, '--border')

    const points = buildBrain(NEURONS)
    const activation = {
      claude: lobeActivation(totals.claude),
      codex: lobeActivation(totals.codex),
      antigravity: lobeActivation(totals.antigravity),
    }
    const lit = pickLit(points, activation)

    const position = new Float32Array(NEURONS * 3)
    const color = new Float32Array(NEURONS * 3)
    const phase = new Float32Array(NEURONS)
    const speed = new Float32Array(NEURONS)
    const size = new Float32Array(NEURONS)
    const litByLobe: Record<BrainLobe, number[]> = { claude: [], codex: [], antigravity: [] }
    points.forEach((point, i) => {
      position.set([point.x, point.y, point.z], i * 3)
      const c = lit[i] ? colors[point.lobe] : dim
      color.set([c.r, c.g, c.b], i * 3)
      phase[i] = (i * 2.399) % 6.283
      speed[i] = 0.6 + ((i * 7) % 16) / 10 + (point.lobe === 'codex' ? 1.2 : 0)
      size[i] = lit[i] ? 2.6 : 1.3
      if (lit[i]) litByLobe[point.lobe].push(i)
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(color, 3))
    geometry.setAttribute('ph', new THREE.BufferAttribute(phase, 1))
    geometry.setAttribute('sp', new THREE.BufferAttribute(speed, 1))
    geometry.setAttribute('sz', new THREE.BufferAttribute(size, 1))
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms: { t: { value: 0 }, px: { value: renderer.getPixelRatio() } },
      vertexShader: `attribute vec3 color; attribute float ph; attribute float sp; attribute float sz;
        uniform float t; uniform float px; varying vec3 vc; varying float va;
        void main(){ vc = color; va = .55 + .45 * sin(t * sp + ph);
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          gl_PointSize = sz * px * (5.2 / -mv.z) * (.8 + .4 * va);
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vc; varying float va;
        void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard;
          gl_FragColor = vec4(vc, (1. - d * 2.) * va); }`,
    })
    group.add(new THREE.Points(geometry, material))

    // Synapses join each lit neuron to a close lit neighbour of the same lobe.
    const lineGeometries: THREE.BufferGeometry[] = []
    const lineMaterials: THREE.LineBasicMaterial[] = []
    for (const lobe of LOBES) {
      const ids = litByLobe[lobe]
      if (ids.length < 2) continue
      const segments: number[] = []
      for (let k = 0; k < Math.min(ids.length, 260); k++) {
        const a = points[ids[(k * 7919) % ids.length]]
        let best: (typeof points)[number] | null = null
        let bestDistance = 0.28
        for (let n = 1; n <= 14; n++) {
          const b = points[ids[(k * 104729 + n * 6571) % ids.length]]
          const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
          if (d > 0.05 && d < bestDistance) {
            bestDistance = d
            best = b
          }
        }
        if (best) segments.push(a.x, a.y, a.z, best.x, best.y, best.z)
      }
      const lineGeometry = new THREE.BufferGeometry()
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3))
      const lineMaterial = new THREE.LineBasicMaterial({
        color: colors[lobe],
        transparent: true,
        opacity: light ? 0.35 : 0.22,
        blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: false,
      })
      lineGeometries.push(lineGeometry)
      lineMaterials.push(lineMaterial)
      group.add(new THREE.LineSegments(lineGeometry, lineMaterial))
    }

    let rotX = 0.1
    let rotY = 0.5
    let drag: [number, number] | null = null
    let visible = true
    let frame = 0

    const draw = (ms: number) => {
      material.uniforms.t.value = reduce ? 0 : ms / 1000
      group.rotation.set(rotX, rotY, 0)
      renderer.render(scene, camera)
    }
    const loop = () => {
      frame = 0
      if (!visible || document.hidden || reduce) return
      if (!drag) rotY += 0.0016
      draw(performance.now())
      frame = requestAnimationFrame(loop)
    }
    const start = () => {
      if (!frame) frame = requestAnimationFrame(loop)
    }

    const dom = renderer.domElement
    const onDown = (e: PointerEvent) => {
      drag = [e.clientX, e.clientY]
      dom.setPointerCapture(e.pointerId)
    }
    const onUp = () => {
      drag = null
    }
    const onMove = (e: PointerEvent) => {
      if (!drag) return
      rotY += (e.clientX - drag[0]) * 0.008
      rotX += (e.clientY - drag[1]) * 0.006
      drag = [e.clientX, e.clientY]
      draw(performance.now())
    }
    dom.addEventListener('pointerdown', onDown)
    dom.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    const resize = new ResizeObserver(() => {
      renderer.setSize(host.clientWidth, host.clientHeight)
      camera.aspect = host.clientWidth / Math.max(1, host.clientHeight)
      camera.updateProjectionMatrix()
      draw(performance.now())
    })
    resize.observe(host)
    const intersect = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      if (visible) start()
    })
    intersect.observe(host)
    document.addEventListener('visibilitychange', start)

    draw(0)
    start()

    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      intersect.disconnect()
      document.removeEventListener('visibilitychange', start)
      window.removeEventListener('pointerup', onUp)
      dom.removeEventListener('pointerdown', onDown)
      dom.removeEventListener('pointermove', onMove)
      geometry.dispose()
      material.dispose()
      lineGeometries.forEach((g) => g.dispose())
      lineMaterials.forEach((m) => m.dispose())
      renderer.dispose()
      dom.remove()
    }
  }, [totals.claude, totals.codex, totals.antigravity])

  return <div ref={hostRef} className={className} />
}
