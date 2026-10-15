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
