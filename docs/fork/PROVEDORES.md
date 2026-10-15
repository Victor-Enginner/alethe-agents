# Provedores, gateways e orquestradores

Pesquisa de 15/10/2026. Para cada ferramenta: o que é, o que faz, se serve para nós e em que ordem entra (ordem, não prazo).
Números marcados como *autodeclarados* vêm do próprio projeto e ainda precisam do nosso teste.

## Vocabulário em 1 minuto

| Termo | O que é | Analogia |
|---|---|---|
| **Provedor** | Quem tem o modelo: Anthropic (Claude), OpenAI, Google, DeepSeek, Ollama local | A cozinha que faz o prato |
| **Gateway / roteador** | Um endereço único (`localhost:porta`) na frente de vários provedores. Troca de provedor quando um esgota a cota | A central de pedidos que distribui entre várias cozinhas |
| **Compressão de tokens** | Encurta o que vai para o modelo (logs, saídas de ferramentas) antes de enviar | Resumir o pedido sem mudar o prato |
| **Agente / CLI** | Programa que usa um modelo para agir: Claude Code, Codex, OpenCode, Freebuff | O cozinheiro |
| **Orquestrador** | Coordena vários agentes: divide tarefas, distribui, junta resultados | O chefe de cozinha |
| **MCP** | Protocolo padrão para dar ferramentas a um agente | Os utensílios que o cozinheiro pode usar |

## Ferramentas avaliadas

| Ferramenta | Categoria | O que faz | Veredito | Ordem |
|---|---|---|---|---|
| **9router** | Gateway | Endpoint compatível com OpenAI/Anthropic, traduz entre formatos, fallback entre provedores, dashboard. Porta padrão 20128. MIT | ✅ **Usar primeiro**: já é **embutido no Alethe** (`src-tauri/src/router9.rs`, versão fixada 0.5.59, instala e liga só com clique) | 1º |
| **OmniRoute** | Gateway + compressão | Mesmo papel do 9router, com motor de compressão (RTK + "Caveman"), *autodeclarado* 15-95% de economia. MIT | 🧪 **Testar contra o 9router.** Redundante como gateway; só vale se a compressão provar ganho real | 3º |
| **LiteLLM** | Gateway | Já instalado em `tools/litellm`, porta 41000 | ⚠️ Terceiro gateway. Manter só se tiver algo que os outros não têm | 4º |
| **AirLLM** | Inferência local | Roda modelos de 70B em 4 GB de VRAM carregando **uma camada por vez do disco** | ❌ **Não serve para agentes**: lento demais (sem tabela de tokens/s publicada). Para local, usar **Ollama** | — |
| **Ollama** | Provedor local | Modelos locais, já instalado (modelos em `O:\data\ollama`) | ✅ Entra como provedor no gateway | 2º |
| **Antigravity** | IDE / agente (Google) | O Alethe já lê sessões e uso (`antigravity_*.rs`, indicador na topbar) | ✅ Nativo | 5º |
| **OpenCode** | Agente CLI | Suportado nativamente (`opencode_*.rs`) | ✅ Nativo | 5º |
| **Freebuff** | Agente CLI gratuito | Versão grátis do Codebuff, paga com anúncios no terminal; modelos variam (DeepSeek, Gemini Flash...). `npm i -g freebuff` | 🧪 Bom para tarefas simples e baratas; depende de backend hospedado | 6º |
| **Hermes Agent** | Agente autônomo (Nous Research) | Memória persistente, aprende skills, 70+ ferramentas, conversa por Telegram/Discord/WhatsApp. MIT | ⚠️ Poderoso e com **muitas permissões**: só em sandbox Docker | Bloco 2 |
| **OpenClaw** | Orquestrador / agente | Processo "Gateway" central, agentes, skills da comunidade, canais de chat, sub-agentes. MIT | ⚠️ Mesmo cuidado: sandbox Docker | Bloco 2 |

## Segurança do 9router (configuração obrigatória)

Levantado no código do 9router 0.5.59 e do Alethe em 15/10/2026.

| Risco | Situação de fábrica | O que fazemos |
|---|---|---|
| Porta conhecida (20128) | Alethe usa 20128 se nada for configurado | **Porta 41010**, registrada em `A JORNADA/PORTAS.md` |
| Senha padrão do painel | **`123456`** até definir outra (o Alethe não passa `INITIAL_PASSWORD`) | Trocar no **primeiro login**, antes de cadastrar qualquer provedor. A senha nova é salva com hash (bcrypt) |
| Acesso pela rede local | Alethe força `HOSTNAME=127.0.0.1`: só o próprio PC acessa | Manter. Nunca usar o compartilhamento remoto do 9router |
| Painel sem login | `requireLogin: true` de fábrica | Conferir que continua ligado |
| `/v1` sem chave | `requireApiKey: true` de fábrica | Criar **uma chave por cliente** (Alethe, Claude Code...), para poder revogar só uma |
| Túnel público | Desligado; o Alethe nunca liga | Manter desligado |
| Vulnerabilidades conhecidas | Aviso do próprio Alethe | Ler os avisos antes de colocar chaves reais; manter a versão fixada pelo Alethe |
| Contas reaproveitando sessão web (ChatGPT/Claude.ai) | Suportado pelo 9router | **Não usar**: viola os termos dos provedores e pode banir a conta. Só chaves de API oficiais (regra de `research/COMPUTACAO-REMOTA.md`) |

Por que trocar a senha mesmo só aceitando conexões locais: qualquer programa no PC, ou uma página
maliciosa aberta no navegador, consegue fazer pedidos para `127.0.0.1`. Porta trocada + senha
forte + chave obrigatória são camadas que se somam.

### Verificação feita em 15/10/2026

| Teste | Resultado |
|---|---|
| Escuta | só `127.0.0.1:41010`; IP da rede recusado |
| Senha do painel | própria (hash no banco), `123456` não vale mais |
| `POST /v1/chat/completions` sem chave / chave falsa | 401 / 401 |
| Com a chave do Alethe | aceita (404 só porque ainda não há provedor) |
| `GET /v1/models` | público por design do 9router: lista o catálogo, sem gastar tokens |

### OpenRouter no 9router (15/10/2026)

- Nome do modelo no 9router: **`openrouter/<id do OpenRouter>`**. Ex.: `openrouter/nvidia/nemotron-3-super-120b-a12b:free`.
- O catálogo `/v1/models` do 9router **não lista** os modelos do OpenRouter: use os ids da lista pública `https://openrouter.ai/api/v1/models` (filtrar `:free` com preço 0).
- Modelos grátis mudam: em 15/10 eram 14 (Nemotron 3 Super/Ultra/Lightning, Gemma 4, Laguna, Inkling, North Mini Code, Dots...). O Llama 3.3 70B `:free` já não era grátis.
- Resultados do teste: Nemotron Super 120B, Nemotron 3.5 Lightning e North Mini Code responderam; Gemma 4 31B e Laguna deram **429** (congestionados); Inkling Small deu 403.
- `openrouter/openrouter/auto` dá **402** (sem créditos): ele escolhe modelos pagos.
- Vários modelos grátis "pensam" antes de responder: `max_tokens` baixo (ex.: 20) acaba no raciocínio e o conteúdo vem vazio. Use pelo menos ~500.
- O 9router responde em **streaming (SSE)** por padrão.
## Agentes × provedores (estratégia, 15/10/2026)

Agentes são os **programas que trabalham**; provedores são os **modelos que pensam**; o 9router escolhe o provedor.

| Agente | Como conecta | Uso |
|---|---|---|
| Claude Code | Direto na assinatura Claude Pro (sem 9router) | Tarefas pesadas, planejamento |
| Codex | Direto na conta OpenAI | Revisão, segunda opinião |
| OpenCode | **Via 9router** → provedores grátis/baratos | Tarefas simples e em volume |
| Antigravity CLI (`agy`) | Agente personalizado no Alethe; conta Google própria | Gemini (padrão Gemini 3.5 Flash) |
| Freebuff | Agente personalizado no Alethe; conta paga própria (backend Codebuff) | Tarefas de código rápidas |

**Nunca** ligar assinatura pessoal (Claude Pro, ChatGPT) dentro do 9router por login de conta: viola os termos. No 9router, só chaves de API oficiais.

### Ordem dos provedores no 9router (combo de fallback)

1. **OpenRouter** (chave oficial; modelos `:free` + pagos baratos)
2. Google AI Studio (Gemini)
3. Groq
4. **Ollama por último**: usa a máquina local (preferência do Victor)

Dados de clientes ou prefeitura: não vão para camadas grátis (podem virar treino).

## Caveman (economia de tokens no agente)

Repositório: [JuliusBrussee/caveman](https://github.com/juliusbrussee/caveman) (Apache-2.0/MIT). Atua **dentro do agente**, não no gateway.

| Módulo | O que faz | Números declarados pelo projeto | Usar? |
|---|---|---|---|
| Say less | Respostas curtas; código, comandos e erros intactos; nunca reescreve o prompt | 10 perguntas no Opus 5.5: 6.983 → 4.119 tokens de saída (`/caveman`), 2.693 (`/ultracave`) | ✅ Testar |
| Read less | Comprime logs, JSON, CSV, YAML e saídas de teste antes do modelo ler | −33,2% de entrada em 54 sessões, 18/18 corretas. **Piora em HTML (+9,9%)** | ✅ Testar, sem HTML |
| Auto | Escolhe modelo e esforço por pedido | −54% de custo com acerto parecido (resultado parcial, ±7 pts) | ⚠️ Envia o conteúdo para a Caveman Cloud: **não usar com dados sensíveis** |
| Blocks | Reaproveita scripts | pré-lançamento | ❌ Esperar |
| caveman-compress | Comprime memórias como `CLAUDE.md` | — | 🧪 |

Cuidados: telemetria ligada por padrão (`caveman telemetry off` ou `DO_NOT_TRACK=1`); as regras custam ~1.160 tokens de entrada (não compensa quem paga por requisição); números são do próprio projeto, e vamos medir com o mesmo roteiro antes/depois.
Agentes suportados: Claude Code, Codex, OpenCode, Gemini CLI e outros.

**Instalação feita (15/10/2026):** plugin `caveman@caveman` v4.0.1 no Claude Code (escopo usuário), com hooks SessionStart/SubagentStart/UserPromptSubmit/SessionEnd. `defaultMode: "off"` em `%APPDATA%\caveman\config.json` (conferido: resolve `off`). Ligar por sessão com `/caveman`, `/ultracave` ou `/megacave`, e desligar com `/caveman off`. Por projeto: `.caveman/config.json` com `{"defaultMode":"caveman"}`. Por terminal: variável `CAVEMAN_DEFAULT_MODE`. O instalador completo (`npx @caveman-ai/cli`) **não foi usado**: ele configura um proxy via `ANTHROPIC_BASE_URL`, o que conflita com o 9router.
## Desenho alvo

Ver `diagramas/conexoes-provedores.drawio` (abrir no draw.io) e `diagramas/conexoes-provedores.excalidraw`.

```text
 Alethe (planejador + workers) ──┐
 Claude Code / Codex / OpenCode ─┼──►  9router :20128  ──►  Anthropic · OpenAI · Google · DeepSeek
 Freebuff / Hermes / OpenClaw ───┘     (1 gateway só)  └──►  Ollama local :11434 (O:\data\ollama)
```

## CPU e memória: onde está o custo de verdade

- **Gateway** (9router/OmniRoute): processo Node leve, dezenas de MB. Não é gargalo.
- **Agente CLI** (Claude Code, Codex): cada um é um processo Node com **~150-400 MB**. 10 agentes ≈ 2-4 GB.
  O Alethe ajuda porque terminais fora da tela não renderizam e podem ser **suspensos** (`suspend_pty`).
- **Modelo na nuvem**: custo zero de CPU/RAM local, o custo é de tokens/cota.
- **Modelo local (Ollama)**: é aqui que o PC pesa (VRAM/RAM e CPU). Usar modelos pequenos para tarefas simples.
- **Sem limites não existe**: o teto real é RAM e cota de API. A tabela abaixo vai mostrar o seu teto.

| Cenário | RAM do app | RAM total dos agentes | CPU | Medido em |
|---|---|---|---|---|
| App aberto, 0 agentes | | | | |
| 3 agentes | | | | |
| 10 agentes | | | | |

## Estudo de caso: Toolzz Voice

Plataforma brasileira de **agentes de voz** que fazem e recebem ligações (prospecção, cobrança,
agendamento, URA), também por WhatsApp e Instagram. Planos a partir de R$ 899/mês (1.000 min).
Stack citada: OpenAI, Gemini, Anthropic; ElevenLabs (clonagem de voz); PABX/VoIP (Asterisk, 3CX);
CRMs (HubSpot, Salesforce, Pipedrive); Zapier/Make; API REST.
**O que aprender:** é o padrão "squad de agentes + canal de voz + integrações de negócio". As peças
abertas equivalentes (STT, LLM, TTS, telefonia SIP) entram no Bloco 3.

## Fontes

- 9router: [README no npm](https://cdn.jsdelivr.net/npm/9router@0.3.72/README.md) · [docs](https://docs.9router.com/) · [análise](https://mer.vin/2026/05/9router-one-openai-compatible-gateway-for-claude-code-codex-cursor-and-multi-provider-fallbacks/)
- OmniRoute: [DEV Community](https://dev.to/terminalchai/omniroute-the-open-source-ai-gateway-slashing-token-costs-by-95-2nfd) · [review](https://dev.to/andrew-ooo/omniroute-free-ai-gateway-with-231-llm-providers-2026-review-1bbg) · [dev.co](https://dev.co/ai/mcp/omniroute)
- AirLLM: [blog do autor](https://huggingface.co/blog/lyogavin/airllm) · [PyPI](https://pypi.org/project/airllm) · [análise de VRAM](https://wavect.io/blog/airllm-layer-wise-inference-low-vram.md)
- Hermes Agent: [docs](https://agentic-ai.readthedocs.io/en/latest/AgentPlatforms/hermes-agent/) · [site](https://hermes-agent.org/about/)
- OpenClaw: [arquitetura](https://bibek-poudel.medium.com/how-openclaw-works-understanding-ai-agents-through-a-real-architecture-5d59cc7a4764) · [explicação](https://operator.io/blog/what-is-openclaw)
- Freebuff: [Y Combinator](https://www.ycombinator.com/companies/freebuff) · [guia](https://www.bitdoze.com/freebuff-free-ai-coding-agent/)
- Toolzz Voice: [página oficial](https://www.toolzz.com.br/voice)
