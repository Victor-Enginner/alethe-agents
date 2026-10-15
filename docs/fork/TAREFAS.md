# Tarefas

Lista viva do projeto, em **ordem de execução** (sem prazos: cada etapa leva o tempo que precisar).
Ao concluir: trocar `[ ]` por `[x]` e marcar **ok** com a data em que foi feita.
Cada sessão termina com: diário atualizado, commit (+ push quando liberado). O "DIA XX/100" da série de vídeos conta os dias gravados, não prazos.

**Legenda:** `ok` concluída · `🔄` em andamento · `⛔` bloqueada (motivo ao lado) · `🧪` precisa de teste antes de decidir

---

## Placar

| Bloco | Feito | Falta | Situação |
|---|---|---|---|
| 1 — Fundação | sprints 1.1, 1.2 e 1.3 | 1.4 a 1.7 | 🔄 provedores prontos; falta agentes, economia e 1ª orquestração |
| 2 — Orquestração | — | tudo | a fazer (a 1ª orquestração real abre este bloco) |
| 3 — Automações | estudo Toolzz Voice | resto | a fazer · projeto de voz em `PROJETOS/voz-agentes` |
| 4 — Produto | — | tudo | a fazer |

---

## Regras permanentes

- [x] Toda mudança vai pro Git, README e DIARIO — ok 14/10
- [x] Dívidas técnicas registradas em [DIVIDAS.md](./DIVIDAS.md) — ok 15/10
- [x] Sem prazos estimados: só ordem e dependência — ok 15/10
- [x] Ollama sempre por último (usa a máquina local) — ok 15/10
- [ ] Sites: nada de site genérico gerado por IA. Só componentes via MCP do 21st.dev (heros e animações complexas)
- [ ] Agentes autônomos (Hermes, OpenClaw) sempre em **sandbox Docker**, nunca com acesso livre ao PC
- [ ] Toda decisão entre ferramentas parecidas vira um registro em DECISOES.md, com teste medido

---

## Bloco 1 — Fundação

### Sprint 1.1 — Fork e base ✅
- [x] Fork rodando, README, carrossel ASCII, marco 0 — ok 14/10
- [x] Guia de arquitetura ([ARQUITETURA.md](./ARQUITETURA.md)) — ok 15/10
- [x] Pesquisa de provedores e orquestração ([PROVEDORES.md](./PROVEDORES.md)) — ok 15/10
- [x] Diagramas draw.io e Excalidraw (`diagramas/`) — ok 15/10

### Sprint 1.2 — 9router seguro ✅
- [x] Instalar o 9router pelo Alethe (v0.5.59) — ok 15/10
- [x] Corrigir o 9router subindo exposto na rede; agora só `127.0.0.1:41010` ([seguranca/](./seguranca/)) — ok 15/10
- [x] Senha própria, travas (login e chave obrigatórios), sem túnel — ok 15/10
- [x] Chave de API do Alethe; testado: sem chave 401, chave falsa 401, real aceita — ok 15/10
- [ ] ⛔ Push da correção: aguardando aviso privado ao autor ([e-mail pronto](./seguranca/EMAIL-AUTOR-9router.md))

### Sprint 1.3 — Provedores conectados ✅
- [x] OpenRouter (chave) testado — ok 15/10
- [x] Conexões por assinatura mantidas por decisão do Victor (D-005) — ok 15/10
- [x] Teste real das 9 conexões: 5 funcionam (cc, cx, ag, gh, openrouter) — ok 15/10
- [x] Desenho dos combos `alethe-topo`, `alethe-builder`, `alethe-rapido` ([PROVEDORES.md](./PROVEDORES.md)) — ok 15/10

### Sprint 1.4 — Combos ativos 🔄
- [x] 3 combos criados (`alethe-topo`, `alethe-builder`, `alethe-rapido`) via `A JORNADA/tools/criar-combos-9router.js` — ok 16/10
- [x] Combos respondem (0,6 / 1,3 / 1,7 s) e fallback testado: 2 modelos quebrados pulados, Groq respondeu em 1,9 s — ok 16/10
- [x] Conexões com falha removidas (api.airforce, Poolside, Gemini CLI, Cline, Grok CLI), com backup — ok 15/10
- [ ] Mais provedores grátis (Victor conectando): testar um a um com `A JORNADA\tools\testar-modelos-9router.ps1 -Models <prefixo/modelo>`
- [x] Gemini AI Studio (`gemini/gemini-3.7-flash`) e Groq (`groq/openai/gpt-oss-120b`) testados e nos combos — ok 15/10
- [ ] Ollama local no fim de cada combo (por último)

### Sprint 1.5 — Agentes no Alethe
- [x] Antigravity CLI (`agy`) instalado — ok 15/10
- [x] `agy` cadastrado como agente personalizado — ok 15/10
- [x] `freebuff` cadastrado como agente personalizado — ok 16/10
- [x] OpenCode via 9router: provedor `9router` em `~/.config/opencode/opencode.jsonc` (chave via `OPENAI_API_KEY`, sem segredo no arquivo), porta do serviço movida para 41020 — ok 16/10
- [ ] Abrir o OpenCode **dentro do Alethe** com o 9router ligado e escolher `9router/alethe-rapido`
- [ ] Confirmar que Claude Code e Codex abertos **sem** 9router seguem na assinatura direta

### Sprint 1.6 — Economia de tokens
- [x] Caveman 4.0.1 (say less) instalado, desligado por padrão, telemetria off — ok 15/10
- [ ] 🧪 Medir o Caveman: mesmo roteiro com e sem, contar tokens
- [ ] Caveman nos agentes trabalhadores (`CAVEMAN_DEFAULT_MODE=caveman`)
- [ ] Caveman "read less": entender a convivência com o 9router antes de ligar
- [ ] 🧪 ECC em perfil `minimal` (planner, code-reviewer, security-reviewer, `/context-budget`): ler hooks, instalar seletivo, medir contra o Caveman
- [ ] 🧪 9router × OmniRoute (compressão real, mesma tarefa) · o Victor aposta que o OmniRoute ajuda mais: testar com o mesmo pedido e medir tokens
- [ ] Decidir o gateway oficial e o destino do LiteLLM (:41000), registrar como D-006
- [ ] Medir RAM/CPU: app parado, 3 agentes, 10 agentes

### Sprint 1.7 — Primeira orquestração real 🎯
- [x] 1º projeto de teste: **Biblioteca arXiv offline** (`PROJETOS/biblioteca-arxiv`) — ok 15/10
- [x] Levantado como o orquestrador funciona: workers só Claude e Codex, direto nas contas (ARQUITETURA §11) — ok 16/10
- [ ] Configurar os papéis no app: `scout`, `builder`, `builder-claude`, `expert` + preset Equilibrado
- [x] Tarefa da 1ª orquestração escrita: `biblioteca-arxiv/docs/TAREFA-FASE1.md` — ok 16/10
- [ ] Evolução do fork: `Launcher` OpenCode no orquestrador para usar os combos do 9router como workers
- [ ] Rodar: planejador delega para scout/builder, revisar o resultado e o diff
- [ ] Registrar: tempo, tokens, qual modelo fez o quê, o que falhou
- [ ] Marco 1: provedores conectados, orquestração testada e tudo documentado

---

## Bloco 2 — Orquestração

Desenho completo em [ARQUITETURA.md §10](./ARQUITETURA.md#10-hermes-e-openclaw-agentes-autônomos-bloco-2).

### Sprint 2.1 — Docker e ponte segura
- [x] Docker Desktop instalado (29.8.2, WSL2, Ubuntu 24.04) — já existia, conferido 15/10
- [x] Tailscale instalado (PC = 100.117.35.70), sem serve/funnel — ok 15/10
- [ ] Ligar o Docker Desktop e rodar um container de teste
- [ ] 🧪 Ponte opção 0: container alcança `host.docker.internal:41010`?
- [ ] Se não: ponte opção 1 (proxy na interface do Docker + regra de firewall)
- [ ] Critério de aceite: container fala com o 9router **e** `192.168.x.x:41010` continua recusado
- [ ] Chaves de API do 9router separadas: `hermes` e `openclaw`

### Sprint 2.2 — Hermes Agent
- [ ] Ler a documentação oficial e o repositório (NousResearch/hermes-agent) antes de instalar
- [ ] Container com volume só em `O:\data\agentes\hermes`, sem Docker socket
- [ ] Apontar para o 9router (combo `alethe-builder` ou `alethe-rapido`)
- [ ] Canal: Telegram (bot próprio) para conversar pelo celular
- [ ] Teste: "o que falta na sprint atual?" lendo DIARIO/TAREFAS (montados somente leitura)

### Sprint 2.3 — OpenClaw
- [ ] Ler a documentação oficial e o repositório oficial ([openclaw/openclaw](https://github.com/openclaw/openclaw)) antes de instalar
- [ ] Container isolado, mesmo padrão do Hermes
- [ ] Gateway apontando para o 9router
- [ ] Canal WhatsApp/Telegram
- [ ] Primeira automação: roteiro de um episódio da série 100 dias
- [ ] Protótipo do canal da Bina (sem dados reais)

### Sprint 2.4 — Orquestração avançada
- [ ] Regras de roteamento por cota (`QuotaGate`) no orquestrador do Alethe
- [ ] Comparar orquestrador do Alethe × Hermes × OpenClaw e registrar D-007 (quando usar cada um)
- [ ] Etapa 1 da trilha de estudo: comando Rust `ola` + botão (entender `invoke`)

## Projeto paralelo — Biblioteca arXiv offline

- [x] Plano escrito: `PROJETOS/biblioteca-arxiv/docs/PLANO.md` — ok 15/10
- [ ] Fases 1 a 3: metadados (OAI-PMH) → PDFs selecionados + leitor → servidor MCP para os agentes

## Projeto paralelo — Fábrica de frontends

- [x] Visão registrada: `PROJETOS/fabrica-frontend/docs/VISAO.md` — ok 16/10
- [ ] MCP do 21st.dev (Victor) · skill make-interfaces-feel-better · projeto-base · 1º template: landing do Franca Atende

## Bloco 3 — Automações reais

- [x] Estudo de caso Toolzz Voice e planejamento do projeto de voz — ok 15/10 → `PROJETOS/voz-agentes`
- [ ] Pipeline de conteúdo: roteiro → narração → vídeo → thumbnail (série 100 dias)
- [ ] Publicação pelas APIs oficiais (YouTube Data API, Meta Graph API, TikTok Content Posting API)
- [ ] Protótipo de agente de voz próprio (Bina AI)

## Bloco 4 — Produto e negócio

- [ ] Squad de agentes para um nicho real (ex.: agendamento e estoque em clínicas)
- [ ] Identidade própria do fork (nome, logo, tema)
- [ ] Marco final: demonstração completa, do DIA 01 ao 100

---

## Lacunas (o que ainda não sabemos ou não está coberto)

| Lacuna | Por que importa | Onde resolver |
|---|---|---|
| Gemini 3.1 Pro indisponível (429 no AI Studio grátis, 403 no Gemini CLI) | Seria um ótimo modelo no combo topo | Rever quando houver cota |
| Ponte Docker → 9router nunca testada | Sem ela, Hermes e OpenClaw não acessam os modelos | Sprint 2.1 |
| Combo do 9router nunca testado com falha real | Não sabemos se o fallback troca rápido nem como o agente reage | Sprint 1.4 |
| Uso real de cota das assinaturas pelo 9router | Orquestração pode esgotar a cota do Claude/Codex que você usa direto | Sprint 1.7 (medir) |
| Nenhuma medição de tokens ainda | "Economia" sem número é palpite | Sprint 1.6 |
| Teto de RAM/CPU com vários agentes | Define quantos agentes rodam juntos no seu PC | Sprint 1.6 |
| Orquestrador nativo do Alethe nunca usado | É o coração da orquestração real | Sprint 1.7 |
| Workers do orquestrador não usam o 9router | Combos e modelos grátis ficam fora da orquestração | Novo `Launcher` (Rust) |
| 4 commits de segurança só locais | GitHub do fork desatualizado | E-mail ao autor → push |
| Dívidas técnicas DT-01 a DT-06 em aberto | Comentários em PT, cores fixas, changelog, testes | [DIVIDAS.md](./DIVIDAS.md) |
