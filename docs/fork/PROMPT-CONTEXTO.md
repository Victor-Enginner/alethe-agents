# Prompt de contexto para uma nova sessão (Claude ou Codex dentro do Alethe)

Cole o bloco abaixo no agente, aberto na pasta `O:\DEV\A JORNADA\PROJETOS\alethe`.

---

Você vai continuar um projeto já em andamento. Leia este contexto inteiro antes de agir, depois leia os
arquivos citados. Responda sempre em português, seja direto, explique o porquê das decisões e
**verifique antes de afirmar** (rode, teste, mostre a saída).

## Quem sou e o que quero
Sou o Victor, de Franca-SP. Trabalho todos os dias num **fork do Alethe** (app desktop Tauri: React +
Rust) para transformá-lo na minha própria **IDE de orquestração multiagente** e, mais tarde, numa base
para uma DAW. Em paralelo: **Franca Atende** (plataforma de atendimento por voz/WhatsApp com a
assistente **Bina AI**, para empresas e órgãos públicos de Franca), **Biblioteca arXiv offline** e uma
**fábrica de frontends** (sites com componentes reais e mídia real).

## Regras que valem sempre
1. **Sem prazos estimados**: planos por ordem e dependência.
2. **Toda mudança vai pro Git**, com README (tabela "Modificações deste fork") e `docs/fork/DIARIO.md`.
   Commits pequenos, em português, terminando com a linha de co-autoria do agente.
3. **Push do fork suspenso**: os commits desde `25aa173` (correção de segurança do 9router) ficam só
   locais até eu confirmar que mandei o e-mail ao autor (`docs/fork/seguranca/EMAIL-AUTOR-9router.md`).
4. **Segurança é responsabilidade do agente**: nunca exponha serviços na rede; tudo em `127.0.0.1`;
   segredos só em `.env` fora do Git (há trava gitleaks nos commits). Nunca digite chaves por mim.
5. **9router sem túnel e sem Tailscale** (decisão D-006). Acesso remoto = 9Remote + Tailscale.
6. **Ollama sempre por último** nas cadeias de modelos (usa a minha máquina).
7. **Provedor que falha no teste sai** (remover com backup).
8. **Nada gerado por IA no frontend**: só componentes reais (21st.dev, React Bits, Magic UI...),
   mídia baixada com licença registrada e trabalho manual.
9. **Quando eu colar um texto de configuração, configure; não saia construindo coisas.**
10. Regras do autor do Alethe (`AGENTS.md`): comentários de código em inglês, textos via `t()` nas 3
    línguas, cores por tokens do tema, features registradas no `docs/CHANGELOG.md`.
11. Servidores sobem numa aba do Terminal (ou no atalho), nunca por um comando que morre com a ferramenta.

## Onde está cada coisa
| O quê | Onde |
|---|---|
| Fork do Alethe | `O:\DEV\A JORNADA\PROJETOS\alethe` (origin Victor-Enginner/alethe-agents, upstream Kc1t/alethe-agents) |
| Docs do fork | `docs/fork/`: **RETOMAR.md**, **TAREFAS.md** (sprints, placar, lacunas), **PROVEDORES.md**, **ARQUITETURA.md**, **DECISOES.md** (D-001…D-007), DIVIDAS.md, DIARIO.md |
| Portas | `O:\DEV\A JORNADA\PORTAS.md` (9router 41010, OpenCode 41020, OmniRoute 41030) |
| Scripts | `O:\DEV\A JORNADA\tools\` (testar-modelos-9router.ps1, criar-combos-9router.js, desligar-tunel-9router.js, comparar-gateways.mjs, configurar-orquestracao-alethe.js, guardar-chave.ps1) |
| Biblioteca arXiv | `O:\DEV\A JORNADA\PROJETOS\biblioteca-arxiv` (tarefa: `docs/TAREFA-FASE1.md`) |
| Franca Atende | `O:\DEV\A JORNADA\PROJETOS\voz-agentes` |
| Fábrica de frontends | `O:\DEV\A JORNADA\PROJETOS\fabrica-frontend` (acervo de mídia, REFERENCIAS.md) |
| Backups | `O:\data\backup\` |

## Estado atual (16/10/2026)
- **9router** (gateway embutido no Alethe): `127.0.0.1:41010`, senha própria, chave obrigatória, sem túnel.
  7 conexões funcionando (Claude, Codex, Antigravity, GitHub Copilot, Gemini AI Studio, Groq, OpenRouter grátis).
  Combos `alethe-topo`, `alethe-builder`, `alethe-rapido` criados e fallback testado.
- **OmniRoute** 3.8.51: `127.0.0.1:41030`, chave obrigatória. Teste: **−33,6% de tokens de entrada**, mais
  lento → usar para tarefas com muito contexto (D-007). Chave do cliente em `O:\data\omniroute\cliente.env`.
- **OpenCode** usa o 9router pelo provedor `9router` em `~/.config/opencode/opencode.jsonc`.
- **Agentes personalizados** no Alethe: `agy` (Antigravity CLI) e `freebuff`.
- **Topbar**: botões para abrir os painéis do 9router e do OmniRoute.
- **Orquestrador do Alethe**: workers só Claude e Codex, direto nas contas (ARQUITETURA §11).
  Config pronta em `tools/configurar-orquestracao-alethe.js` (liga o recurso e cria os papéis), que
  **só roda com o Alethe fechado**. Pode ainda não ter sido aplicada: confira em
  `%LOCALAPPDATA%\com.kc1t.alethe.dev\profiles\default\projects.json` (`enabledFeatures.orchestrator` e `orchestration.roles`).
- Skills de UI instaladas em `~/.claude/skills`: make-interfaces-feel-better, design-taste-frontend,
  minimalist-ui, high-end-visual-design, redesign-existing-projects, ui-ux-pro-max, ui-styling,
  design-system, pacote 21st (sem geração por IA).

## Próximo passo
**Primeira orquestração real**: Biblioteca arXiv, Fase 1 (coletor de metadados do arXiv via OAI-PMH,
SQLite + FTS5). Instruções completas em `PROJETOS/biblioteca-arxiv/docs/TAREFA-FASE1.md`.
Se o Claude estiver sem cota, o planner é o **Codex**, com o time de papéis "só Codex".

## Bugs e pendências conhecidos
- Pílula da topbar mostra "9router off" com ele rodando (`router9_status` olha só o processo-pai; corrigir no Rust).
- Trava no fork para forçar `tunnelEnabled=false`/`tailscaleEnabled=false` ao iniciar o 9router.
- Launcher do OpenCode no orquestrador, para usar os combos do 9router como workers.
- Medir o Caveman e o RAM/CPU com vários agentes; ECC em perfil minimal.
- Chaves do acervo (Pixabay, Unsplash) em `fabrica-frontend/.env`; Pexels com emissão pausada.

Comece lendo `docs/fork/RETOMAR.md` e `docs/fork/TAREFAS.md` e me diga, em poucas linhas, o estado que
você entendeu e qual será a sua primeira ação.
