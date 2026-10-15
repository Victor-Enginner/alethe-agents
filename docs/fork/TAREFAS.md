# Tarefas — série "100 dias"

Lista viva do projeto. Ao concluir: trocar `[ ]` por `[x]` e marcar **ok** com a data.
Uma tarefa grande demais para um dia vira várias pequenas.
Cada dia termina com: diário atualizado, commit + push, e o episódio do dia (DIA XX/100).

**Legenda:** `ok` concluída · `🔄` em andamento · `⛔` bloqueada (motivo ao lado) · `🧪` precisa de teste antes de decidir

---

## Regras permanentes

- [x] Toda mudança vai pro Git, README e DIARIO — ok 14/10
- [x] Dívidas técnicas registradas em [DIVIDAS.md](./DIVIDAS.md) — ok 15/10
- [ ] Sites: nada de site genérico gerado por IA. Só componentes via MCP do 21st.dev (heros e animações complexas)
- [ ] Agentes autônomos (Hermes, OpenClaw) sempre em **sandbox Docker**, nunca com acesso livre ao PC
- [ ] Toda decisão entre ferramentas parecidas vira um registro em DECISOES.md, com teste medido

---

## Bloco 1 — Fundação (dias 1-10)

- [x] Dia 1 · Fork rodando, README, carrossel ASCII, marco 0 — ok 14/10
- [x] Dia 2 · Guia de arquitetura ([ARQUITETURA.md](./ARQUITETURA.md)) — ok 15/10
- [x] Dia 2 · Pesquisa das ferramentas de provedores e orquestração ([PROVEDORES.md](./PROVEDORES.md)) — ok 15/10
- [x] Dia 2 · Diagrama de conexões em draw.io e Excalidraw (`docs/fork/diagramas/`) — ok 15/10
- [ ] Dia 3 · **Conectar o 9router** pelo próprio Alethe (botão de instalar, que já existe no app)
- [ ] Dia 3 · Ligar Claude Code e Codex passando pelo 9router; ver o uso na topbar
- [ ] Dia 4 · Conectar Ollama local (modelos em `O:\data\ollama`) como provedor no 9router
- [ ] Dia 4 · Medir RAM/CPU: app parado, 3 agentes, 10 agentes (tabela no PROVEDORES.md)
- [ ] Dia 5 · 🧪 Teste comparativo: 9router × OmniRoute (compressão real em tokens, mesma tarefa)
- [ ] Dia 6 · Decidir o gateway oficial (D-005) e desligar o que sobrar (LiteLLM?)
- [ ] Dia 7 · Antigravity e OpenCode: conferir integração nativa do Alethe
- [ ] Dia 8 · Freebuff como worker gratuito (avaliar a qualidade em tarefas simples)
- [ ] Dia 9 · Etapa 1 da trilha: comando Rust `ola` + botão (entender `invoke`)
- [ ] Dia 10 · Marco 1: provedores conectados, medidos e documentados

## Bloco 2 — Orquestração (dias 11-30)

- [ ] Usar o orquestrador nativo do Alethe: planejador + papéis (scout, builder, expert)
- [ ] Configurar regras de roteamento por cota (`QuotaGate`) com os provedores do Bloco 1
- [ ] Docker: sandbox para agentes autônomos
- [ ] Hermes Agent dentro da sandbox: memória persistente e skills
- [ ] OpenClaw dentro da sandbox: gateway, canais, sub-agentes
- [ ] Comparar orquestrador do Alethe × OpenClaw × Hermes (quando usar cada um)

## Bloco 3 — Automações reais (dias 31-60)

- [ ] Pipeline de conteúdo: roteiro → narração → vídeo → thumbnail (série 100 dias)
- [ ] Publicação pelas APIs oficiais (YouTube Data API, Meta Graph API, TikTok Content Posting API)
- [ ] Estudo de caso Toolzz Voice: agente de voz (telefonia, WhatsApp) com stack aberta
- [ ] Protótipo de agente de voz próprio

## Bloco 4 — Produto e negócio (dias 61-100)

- [ ] Squad de agentes para um nicho real (ex.: agendamento e estoque em clínicas)
- [ ] Identidade própria do fork (nome, logo, tema)
- [ ] Marco final: demonstração completa, do DIA 01 ao 100
