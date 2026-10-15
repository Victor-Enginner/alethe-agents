// Generates the provider-connection diagram for draw.io and Excalidraw from one spec,
// so both files always match. Run: node docs/fork/diagramas/gerar.mjs
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// x, y, w, h in px; color = fill
const nodes = [
  { id: 'title', text: 'Conexões de provedores — alvo do Bloco 1', x: 40, y: 10, w: 760, h: 30, color: 'none', title: true },

  { id: 'g-clients', text: 'CLIENTES (quem pede)', x: 40, y: 60, w: 240, h: 380, color: '#f5f5f5', group: true },
  { id: 'alethe', text: 'Alethe\n(planejador + workers)', x: 60, y: 100, w: 200, h: 60, color: '#dae8fc' },
  { id: 'cli', text: 'Claude Code · Codex\nOpenCode · Antigravity', x: 60, y: 180, w: 200, h: 60, color: '#dae8fc' },
  { id: 'free', text: 'Freebuff\n(grátis, tarefas simples)', x: 60, y: 260, w: 200, h: 60, color: '#fff2cc' },
  { id: 'auto', text: 'Hermes · OpenClaw\n(só em sandbox Docker)', x: 60, y: 340, w: 200, h: 60, color: '#f8cecc' },

  { id: 'gw', text: '9router :20128\nGATEWAY ÚNICO\nfallback · tradução de formato\n(embutido no Alethe)', x: 340, y: 190, w: 200, h: 100, color: '#d5e8d4' },
  { id: 'omni', text: 'OmniRoute\n🧪 teste de compressão (3º passo)', x: 340, y: 330, w: 200, h: 60, color: '#fff2cc', dashed: true },

  { id: 'g-prov', text: 'PROVEDORES (quem responde)', x: 600, y: 60, w: 220, h: 380, color: '#f5f5f5', group: true },
  { id: 'anth', text: 'Anthropic (Claude)', x: 620, y: 100, w: 180, h: 44, color: '#ffffff' },
  { id: 'oai', text: 'OpenAI (Codex/GPT)', x: 620, y: 160, w: 180, h: 44, color: '#ffffff' },
  { id: 'goog', text: 'Google (Gemini)', x: 620, y: 220, w: 180, h: 44, color: '#ffffff' },
  { id: 'ds', text: 'DeepSeek · outros', x: 620, y: 280, w: 180, h: 44, color: '#ffffff' },
  { id: 'ollama', text: 'Ollama local :11434\nO:\\data\\ollama', x: 620, y: 350, w: 180, h: 60, color: '#e1d5e7' },

  { id: 'no', text: '❌ AirLLM: fora (lento para agentes)\n⚠️ LiteLLM :41000: decidir após o teste', x: 340, y: 450, w: 480, h: 50, color: '#ffffff', dashed: true },
]

const edges = [
  ['alethe', 'gw'], ['cli', 'gw'], ['free', 'gw'], ['auto', 'gw'],
  ['gw', 'anth'], ['gw', 'oai'], ['gw', 'goog'], ['gw', 'ds'], ['gw', 'ollama'],
  ['gw', 'omni', true],
]

// ---------- draw.io ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '&#xa;')
const cells = nodes.map((n) => {
  const style = n.title
    ? 'text;fontSize=16;fontStyle=1;align=left;'
    : n.group
      ? `rounded=1;whiteSpace=wrap;html=1;fillColor=${n.color};strokeColor=#999999;verticalAlign=top;fontStyle=1;arcSize=4;`
      : `rounded=1;whiteSpace=wrap;html=1;fillColor=${n.color};strokeColor=#333333;${n.dashed ? 'dashed=1;' : ''}`
  return `<mxCell id="${n.id}" value="${esc(n.text)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" as="geometry"/></mxCell>`
})
edges.forEach(([s, t, dashed], i) => {
  cells.push(`<mxCell id="e${i}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;${dashed ? 'dashed=1;' : ''}" edge="1" parent="1" source="${s}" target="${t}"><mxGeometry relative="1" as="geometry"/></mxCell>`)
})
const drawio = `<mxfile host="gerar.mjs"><diagram name="Conexões de provedores"><mxGraphModel grid="1" gridSize="10"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}</root></mxGraphModel></diagram></mxfile>\n`
writeFileSync(join(here, 'conexoes-provedores.drawio'), drawio)

// ---------- Excalidraw ----------
let seed = 1
const base = () => ({ angle: 0, strokeColor: '#1e1e1e', fillStyle: 'solid', strokeWidth: 1, roughness: 1, opacity: 100, groupIds: [], seed: seed++, version: 1, versionNonce: seed, isDeleted: false, boundElements: [], updated: 1, link: null, locked: false })
const elements = []
const center = (n) => [n.x + n.w / 2, n.y + n.h / 2]
for (const n of nodes) {
  if (!n.title) {
    elements.push({ ...base(), id: n.id, type: 'rectangle', x: n.x, y: n.y, width: n.w, height: n.h, backgroundColor: n.color, strokeStyle: n.dashed ? 'dashed' : 'solid', roundness: { type: 3 } })
  }
  const lines = n.text.split('\n')
  const fontSize = n.title ? 20 : 14
  const th = lines.length * fontSize * 1.25
  elements.push({ ...base(), id: `${n.id}-t`, type: 'text', x: n.x + 8, y: n.group ? n.y + 8 : n.title ? n.y : n.y + (n.h - th) / 2, width: n.w - 16, height: th, backgroundColor: 'transparent', strokeStyle: 'solid', roundness: null, text: n.text, originalText: n.text, fontSize, fontFamily: 1, textAlign: n.group || n.title ? 'left' : 'center', verticalAlign: 'top', containerId: null, lineHeight: 1.25, autoResize: false })
}
const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
edges.forEach(([s, t, dashed], i) => {
  const a = byId[s], b = byId[t]
  const [ax, ay] = center(a), [bx, by] = center(b)
  const sx = b.x > a.x + a.w ? a.x + a.w : ax, sy = b.x > a.x + a.w ? ay : a.y + a.h
  const ex = b.x > a.x + a.w ? b.x : bx, ey = b.x > a.x + a.w ? by : b.y
  elements.push({ ...base(), id: `e${i}`, type: 'arrow', x: sx, y: sy, width: ex - sx, height: ey - sy, backgroundColor: 'transparent', strokeStyle: dashed ? 'dashed' : 'solid', roundness: { type: 2 }, points: [[0, 0], [ex - sx, ey - sy]], startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: 'arrow' })
})
const excalidraw = { type: 'excalidraw', version: 2, source: 'gerar.mjs', elements, appState: { viewBackgroundColor: '#ffffff', gridSize: null }, files: {} }
writeFileSync(join(here, 'conexoes-provedores.excalidraw'), JSON.stringify(excalidraw, null, 2) + '\n')

console.log(`ok: ${nodes.length} nós, ${edges.length} conexões → .drawio + .excalidraw`)
