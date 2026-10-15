# Provedores, gateways e agentes

Documento de referência de como os modelos de IA chegam até o Alethe. Levantado e testado em 15/10/2026.
Números *autodeclarados* vêm do próprio projeto citado e ainda precisam de medição nossa.

**Sumário:** [Status](#1-status-deste-documento) · [Vocabulário](#2-vocabulário) · [Arquitetura](#3-arquitetura-atual) ·
[9router](#4-9router-o-gateway) · [Conexões testadas](#5-conexões-testadas) · [Combos](#6-combos-de-fallback) ·
[Agentes](#7-agentes-no-alethe) · [Economia de tokens](#8-economia-de-tokens) · [Ferramentas avaliadas](#9-ferramentas-avaliadas) ·
[CPU e memória](#10-cpu-e-memória) · [Como testar](#11-como-testar-um-provedor-novo) · [Fontes](#12-fontes)

---

## 1. Status deste documento

| Item | Estado |
|---|---|
| 9router instalado, seguro e verificado | ✅ |
| Conexões testadas: 7 ativas, todas funcionando; 5 com falha removidas | ✅ |
| Gemini AI Studio e Groq (chaves) | ✅ |
| Combos desenhados | ✅ |
| Combos criados e fallback testado com falha real | ✅ (16/10) |
| OpenCode usando os combos | ✅ provedor `9router` no `opencode.jsonc` |
| Ollama no fim dos combos | ⏳ (por último) |
| `agy` e `freebuff` cadastrados como agentes no Alethe | ⏳ |
| Medições: tokens (Caveman) e RAM/CPU | ⏳ |
| Decisão do gateway oficial (9router × OmniRoute × LiteLLM) | ⏳ |

As tarefas correspondentes estão em [TAREFAS.md](./TAREFAS.md) (sprints 1.4 a 1.6).

## 2. Vocabulário

| Termo | O que é | Analogia |
|---|---|---|
| **Provedor** | Quem tem o modelo: Anthropic, OpenAI, Google, OpenRouter, Ollama local... | O fornecedor de ingredientes |
| **Modelo** | O "cérebro" que responde: Claude Opus 5, GPT-5.6, Gemini 3... | O ingrediente |
| **Agente / CLI** | Programa que usa um modelo para agir: Claude Code, Codex, OpenCode, agy, Freebuff | O cozinheiro |
| **Gateway / roteador** | Um endereço único na frente de vários provedores, que troca de provedor quando um falha | A central de compras |
| **Combo / fallback** | Lista ordenada de modelos: se o 1º falhar, tenta o 2º, e assim por diante | O plano B, C, D... |
| **Orquestrador** | Coordena vários agentes: divide, distribui e junta resultados | O chefe de cozinha |
| **Compressão de tokens** | Encurta o que entra ou sai do modelo para gastar menos | Resumir o pedido sem mudar o prato |
| **OAuth × chave de API** | OAuth = login com a sua conta/assinatura; chave = credencial de API cobrada por uso | Cartão da loja × conta corrente |

## 3. Arquitetura atual

```text
 AGENTES (quem trabalha)                      GATEWAY                     PROVEDORES (quem pensa)
 ─────────────────────────                  ───────────                  ───────────────────────
 Orquestrador do Alethe ──┐                                           ┌─► cc/  Claude (assinatura)
 OpenCode ────────────────┼──► 9router  127.0.0.1:41010 ──────────────┼─► cx/  Codex (conta OpenAI)
 (Claude Code/Codex,      │    · só aceita conexão do próprio PC      ├─► ag/  Antigravity
  se ligados no 9router) ─┘    · senha própria + chave obrigatória    ├─► gh/  GitHub Copilot
                               · combos de fallback                   ├─► gemini/  AI Studio (chave)
                                                                      ├─► groq/  Groq (chave)
                                                                      ├─► openrouter/  modelos grátis
                                                                      └─► Ollama local (por último)

 Claude Code · Codex · agy · Freebuff ──► direto na conta de cada um (padrão, sem 9router)
 Hermes · OpenClaw (Bloco 2, em Docker) ──► 9router por uma ponte segura (ver ARQUITETURA.md §10)
```

Diagramas editáveis: [`diagramas/conexoes-provedores.drawio`](./diagramas/) e `.excalidraw` (gerados por `gerar.mjs`; atualizar para este desenho).

## 4. 9router (o gateway)

Embutido no Alethe (`src-tauri/src/router9.rs`), versão fixada **0.5.59**, instalado na pasta de perfil:
`%LOCALAPPDATA%\com.kc1t.alethe.dev\profiles\default\tools\9router` (dados em `...\9router-data`).

### 4.1 Configuração de segurança (em vigor)

| Item | De fábrica | Como está |
|---|---|---|
| Porta | 20128 | **41010** (registrada em `A JORNADA/PORTAS.md`) |
| Endereço | `0.0.0.0` (rede toda). O Alethe 1.7.0 tentava limitar, mas não funcionava | **Só `127.0.0.1`**: bug corrigido no fork ([seguranca/](./seguranca/2026-10-15-9router-exposto-na-rede.md)) |
| Senha do painel | `123456` | **Própria**, gravada com hash |
| Login no painel | obrigatório | obrigatório |
| Chave de API no `/v1` | obrigatória | obrigatória; chave do Alethe salva |
| Túnel público | desligado | desligado |
| Atualização automática | ativa | desligada (`--skip-update`) |

Por que tudo isso mesmo só local: qualquer programa no PC, ou uma página maliciosa no navegador,
consegue fazer pedidos para `127.0.0.1`. As camadas se somam.

### 4.2 Verificação (15/10/2026)

| Teste | Resultado |
|---|---|
| Porta | escuta só em `127.0.0.1:41010`; pelo IP da rede é recusado |
| Tailscale (16/10, após reinício) | `100.117.35.70:41010` recusado; nenhum serve/funnel ativo |
| `POST /v1/chat/completions` sem chave / chave falsa | 401 / 401 |
| Com a chave do Alethe | aceita |
| `GET /v1/models` | público por design: lista o catálogo, sem gastar tokens |
| Teste unitário `router9::cli_args_tests` | passou |

### 4.3 Assinaturas por OAuth (decisão D-005)

Claude, Codex, Antigravity e GitHub Copilot estão conectados por **login de conta**.
Decisão do Victor: **manter e somar** ([DECISOES.md](./DECISOES.md#d-005)). Riscos aceitos: os termos desses
serviços restringem uso por proxy (possível suspensão) e os tokens de login ficam no banco do 9router.
Cuidados: não expor `9router-data` em backups públicos; acompanhar avisos nos painéis das contas;
lembrar que o que passa pelo 9router gasta **a mesma cota** da assinatura usada direto.

## 5. Conexões testadas

**7 conexões ativas, 77 modelos** (depois de remover as que falharam). Um pedido mínimo por modelo, via `127.0.0.1:41010`.

| Prefixo | Conexão | Tipo | ✅ Funcionou | ❌ Falhou (motivo) |
|---|---|---|---|---|
| `cc/` | Claude | OAuth | `claude-opus-5` (1,6 s), `claude-sonnet-5` (1,8 s) | — |
| `cx/` | Codex | OAuth | `gpt-5.6-sol` (2,8 s), `gpt-5.6-terra` (4,0 s) | `gpt-5.4-mini`: não suportado na conta |
| `ag/` | Antigravity | OAuth | `gemini-3-flash` (1,1 s) | `gemini-3.7-flash-high`, `gemini-pro-agent`: 404 · `claude-sonnet-4-6`: descontinuado |
| `gh/` | GitHub Copilot | OAuth | `gpt-4.1` (0,6 s) | `gpt-5-mini`, `claude-haiku-4.5`, `gpt-5.4-mini-free-auto`: fora do plano |
| `openrouter/` | OpenRouter | chave | `nvidia/nemotron-3-super-120b-a12b:free` (1,1 s), `nvidia/nemotron-3.5-lightning:free`, `cohere/north-mini-code:free` | Gemma 4 e Laguna `:free`: 429 (congestionados) · `openrouter/auto`: 402 (sem crédito) |
| `gemini/` | Gemini (AI Studio) | chave | `gemini-3.7-flash` (2,1 s), `gemini-3.5-flash-lite` (4,8 s) | `gemini-3.1-pro-preview`: 429 (cota grátis do Pro esgotada/indisponível) |
| `groq/` | Groq | chave | `openai/gpt-oss-120b` (1,0 s) | `llama-3.3-70b-versatile`, `qwen/qwen3-32b`: 404 (descontinuados no Groq) |

**Regra:** conexão que falha no teste real é **removida**, com backup do banco antes
(`A JORNADA\tools\remover-conexoes-9router.js`; backups em `O:\data\backup\9router\`). Um 429 passageiro não conta.

**Removidas em 15/10/2026:**

| Conexão | Motivo |
|---|---|
| api.airforce (`af/`) | 402: modelos exigem plano pago |
| Poolside (`ps/`) | 404: ids de modelo não reconhecidos |
| Gemini CLI (`gc/`) | 403 em todos os modelos, persistente. O Gemini CLI segue ativo (https://geminicli.com); o problema era a conexão desta conta pelo 9router. O Gemini entra pelo AI Studio (`gemini/`) |
| Cline (`cl/`) | 401 / 402: sem autorização e sem créditos |
| Grok CLI (`gcli/`) | 426: o 9router 0.5.59 usa uma versão desatualizada do cliente do Grok |

### Notas sobre o OpenRouter
- Nome no 9router: **`openrouter/<id do OpenRouter>`**.
- O catálogo do 9router **não lista** os modelos do OpenRouter. Os ids vêm de `https://openrouter.ai/api/v1/models` (grátis = `:free` com preço 0). Em 15/10 eram 14 e mudam com frequência.
- Muitos modelos grátis "pensam" antes de responder: use `max_tokens` de pelo menos ~500, senão o conteúdo vem vazio.
- O 9router responde em streaming (SSE) por padrão.

## 6. Combos de fallback

Só modelos que responderam. Ordem: **melhor primeiro**, grátis no fim, **Ollama sempre por último**.
Criar no painel do 9router (**Combos**) com estes nomes e esta ordem.

| Combo | Papel no orquestrador | Ordem |
|---|---|---|
| **`alethe-topo`** | planejador, `expert`, `deep` | `cc/claude-opus-5` → `cx/gpt-5.6-sol` → `cc/claude-sonnet-5` → `cx/gpt-5.6-terra` → `gemini/gemini-3.7-flash` → `ag/gemini-3-flash` → `groq/openai/gpt-oss-120b` → `openrouter/nvidia/nemotron-3-super-120b-a12b:free` → *(Ollama)* |
| **`alethe-builder`** | `builder`, `writer` | `cc/claude-sonnet-5` → `cx/gpt-5.6-terra` → `gemini/gemini-3.7-flash` → `gh/gpt-4.1` → `ag/gemini-3-flash` → `groq/openai/gpt-oss-120b` → `openrouter/nvidia/nemotron-3-super-120b-a12b:free` → *(Ollama)* |
| **`alethe-rapido`** | `scout`, `typist` | `groq/openai/gpt-oss-120b` → `gemini/gemini-3.5-flash-lite` → `ag/gemini-3-flash` → `gh/gpt-4.1` → `openrouter/nvidia/nemotron-3.5-lightning:free` → `openrouter/cohere/north-mini-code:free` → *(Ollama)* |

A ordem entre Claude e GPT-5.6 é hipótese inicial: validar na primeira orquestração real (qualidade, tempo, cota).
O Groq abre o `alethe-rapido` por ser o mais rápido (1,0 s) com um modelo de 120B.

**Dados de clientes ou prefeitura** não vão para modelos grátis (podem virar treino): só provedor com
contrato/termos de privacidade adequados ou Ollama local.

## 7. Agentes no Alethe

| Agente | Instalado | Como conecta (padrão) | Uso |
|---|---|---|---|
| Claude Code | ✅ | Direto na assinatura | Tarefas pesadas, planejamento |
| Codex | ✅ | Direto na conta OpenAI | Revisão, segunda opinião |
| OpenCode | ✅ | **Via 9router** (`alethe-rapido`) | Tarefas simples e em volume |
| Antigravity CLI (`agy`) | ✅ `%LOCALAPPDATA%\agy\bin` | Direto na conta Google · ⏳ cadastrar como agente personalizado | Gemini (padrão Gemini 3.5 Flash) |
| Freebuff | ✅ | Direto, **conta paga** (backend Codebuff) · ⏳ cadastrar como agente personalizado | Código rápido |
| Gemini | via 9router (`gemini/`, AI Studio) | ✅ | Gemini 3.7 Flash |

Como o Alethe liga um agente ao 9router (`src/lib/router9.ts`): Claude Code recebe `ANTHROPIC_BASE_URL`;
Codex e OpenCode recebem `OPENAI_BASE_URL`. Só acontece quando o 9router está ligado para aquele
terminal. A opção "usar 9router por padrão em agentes novos" está **desligada** (manter assim).

Agentes personalizados: Configurações → **Terminal e agentes** → **Agentes personalizados** → `id`, nome e comando
(ex.: `agy` / Antigravity / `agy`; `freebuff` / Freebuff / `freebuff`).

## 8. Economia de tokens

### 8.1 Caveman (dentro do agente)
[JuliusBrussee/caveman](https://github.com/juliusbrussee/caveman) · Apache-2.0/MIT.

| Módulo | O que faz | Números *autodeclarados* | Situação |
|---|---|---|---|
| Say less | Respostas curtas; código, comandos e erros intactos | 10 perguntas (Opus 5.5): 6.983 → 4.119 tokens (`/caveman`), 2.693 (`/ultracave`) | ✅ instalado |
| Read less | Comprime logs, JSON, CSV, YAML, saídas de teste | −33,2% de entrada (54 sessões); piora em HTML (+9,9%) | ⏸️ usa proxy via `ANTHROPIC_BASE_URL`, que conflita com o 9router |
| Auto | Escolhe modelo e esforço | −54% de custo (parcial, ±7 pts) | ❌ envia conteúdo à Caveman Cloud |
| Blocks | Reaproveita scripts | pré-lançamento | ❌ esperar |

**Instalação feita:** plugin `caveman@caveman` 4.0.1 no Claude Code, **desligado por padrão**
(`%APPDATA%\caveman\config.json` → `{"defaultMode":"off"}`, conferido), telemetria off (`DO_NOT_TRACK=1`).
Ligar: `/caveman`, `/ultracave`, `/megacave` · desligar: `/caveman off` · por projeto: `.caveman/config.json` ·
por terminal: `CAVEMAN_DEFAULT_MODE=caveman` (ideal para agentes trabalhadores).
**Falta:** medir com o mesmo roteiro, com e sem.

### 8.2 No gateway
- **9router**: troca para modelo mais barato/grátis via combos.
- **OmniRoute** (🧪): compressão de 15-95% *autodeclarada*; testar contra o 9router com a mesma tarefa.

## 9. Ferramentas avaliadas

| Ferramenta | Categoria | Veredito |
|---|---|---|
| **9router** | Gateway | ✅ **em uso** (seção 4) |
| **OmniRoute** 3.8.51 | Gateway + compressão | 🔄 **instalado** em `O:/data/omniroute` (porta 41030, só 127.0.0.1, `REQUIRE_API_KEY=true` testado: 401 sem chave, segredos aleatórios). Subir: aba do Terminal com `DATA_DIR=O:/data/omniroute/data` + `omniroute.cmd`. Falta: senha, chave, provedores e o teste medido contra o 9router |
| **LiteLLM** | Gateway (`tools/litellm`, porta 41000) | ⚠️ terceiro gateway: decidir manter ou desligar (D-006) |
| **Ollama** | Provedor local (`O:\data\ollama`) | ✅ entra **por último** nos combos (usa a máquina) |
| **AirLLM** | Inferência local camada por camada | ❌ lento demais para agentes |
| **Caveman** | Compressão no agente | ✅ instalado (seção 8) |
| **Hermes Agent** | Agente autônomo (Nous Research) | ⚠️ Bloco 2, só em sandbox Docker |
| **OpenClaw** | Orquestrador/agente | ⚠️ Bloco 2, só em sandbox Docker |
| **ECC** ([affaan-m/ECC](https://github.com/affaan-m/ECC), MIT) | Kit de harness: 71 agentes, 311 skills, hooks, Memory Vault, AgentShield, `/context-budget` | ✅ **seletivo** (perfil `minimal`): testar `planner`, `code-reviewer`, `security-reviewer` e `/context-budget` na sprint 1.6. Ler os hooks antes. Plugin completo anuncia o catálogo e pode **gastar** mais contexto. Sobrepõe o Caveman: medir. Bugs conhecidos no Windows nativo |
| **Project N.O.M.A.D.** ([Crosstalk-Solutions](https://github.com/Crosstalk-Solutions/project-nomad), Apache-2.0) | Servidor de conhecimento offline (Kiwix, Kolibri, mapas, IA local, Qdrant) | ⏸️ Não agora: só Linux, sem autenticação por design. Referência de RAG (Qdrant) para a base de conhecimento da Bina |
| **openpi** ([physical-intelligence](https://github.com/physical-intelligence/openpi), Apache-2.0) | Modelos VLA para robôs físicos | ❌ Fora do escopo (robótica, GPU NVIDIA 8-80 GB) |
| **FoxProfile** ([chienbm98](https://github.com/chienbm98/foxprofile), MIT) | Perfis de navegador antidetecção (fingerprint, proxy, multi-contas) | ❌ Não integrar para multi-contas falsas em redes sociais (viola os termos das plataformas, como o próprio README avisa). Uso legítimo futuro: testes de sites ou contas reais de clientes com autorização |
| **Arena (arena.ai / LMArena)** | Site de comparação e ranking de modelos | 👁️ Usar **no navegador** e o ranking para decidir a ordem dos combos. ❌ **Sem proxy** para usar os modelos pelo 9router/Alethe: seria acesso automatizado ao site sem API oficial |
| **Daytona** ([daytonaio](https://github.com/daytonaio/daytona)) | Sandboxes para código gerado por IA | ❌ **Repositório arquivado** desde 06/2026 (sem correções; desenvolvimento migrou para código privado/nuvem). O isolamento de agentes será feito com Docker (sprint 2.1) |

O estudo de caso Toolzz Voice foi para o projeto próprio: `PROJETOS/voz-agentes/docs/REFERENCIA-TOOLZZ.md`.

## 10. CPU e memória

- **Gateway**: processo Node leve (dezenas de MB).
- **Agente CLI**: ~150-400 MB cada → 10 agentes ≈ 2-4 GB. Terminais fora da tela não renderizam e podem ser suspensos.
- **Modelo na nuvem**: zero de CPU local; o custo é cota/tokens.
- **Ollama**: é o que pesa no PC (i7-3770S, 16 GB, RX 580), por isso fica por último.

| Cenário | RAM do app | RAM dos agentes | CPU | Medido em |
|---|---|---|---|---|
| App aberto, 0 agentes | ⏳ | ⏳ | ⏳ | |
| 3 agentes | ⏳ | ⏳ | ⏳ | |
| 10 agentes | ⏳ | ⏳ | ⏳ | |

## 11. Como testar um provedor novo

```powershell
& 'O:\DEV\A JORNADA\tools\testar-modelos-9router.ps1' -Models 'prefixo/modelo','outro/modelo'
```

Mostra HTTP, tempo e o início da resposta de cada modelo. Depois: atualizar a tabela da seção 5 e, se passou, encaixar no combo.

## 12. Fontes

- 9router: [README no npm](https://cdn.jsdelivr.net/npm/9router@0.3.72/README.md) · [docs](https://docs.9router.com/) · [análise](https://mer.vin/2026/05/9router-one-openai-compatible-gateway-for-claude-code-codex-cursor-and-multi-provider-fallbacks/)
- OmniRoute: [DEV Community](https://dev.to/terminalchai/omniroute-the-open-source-ai-gateway-slashing-token-costs-by-95-2nfd) · [review](https://dev.to/andrew-ooo/omniroute-free-ai-gateway-with-231-llm-providers-2026-review-1bbg)
- Caveman: [repositório](https://github.com/juliusbrussee/caveman)
- Antigravity CLI: [codelab Google](https://codelabs.developers.google.com/antigravity-cli-hands-on?hl=en) · Gemini CLI: [geminicli.com](https://geminicli.com/)
- OpenRouter: [lista de modelos](https://openrouter.ai/api/v1/models)
- AirLLM: [blog do autor](https://huggingface.co/blog/lyogavin/airllm)
- Hermes Agent: [docs](https://agentic-ai.readthedocs.io/en/latest/AgentPlatforms/hermes-agent/) · OpenClaw: [explicação](https://operator.io/blog/what-is-openclaw)
- Freebuff: [Y Combinator](https://www.ycombinator.com/companies/freebuff)
