# Diário

Uma entrada por dia de trabalho: o que foi feito, o que travou, o próximo passo.
As mais recentes ficam no topo.

---

## 16/10/2026 — Orquestração configurada

**Feito**
- Recurso "Orquestração de agentes" ligado e 6 papéis gravados no perfil do Alethe, com o app fechado
  e backup em `O:dataackupaletheprojects-2026-10-15T13-11-41-994Z.json`.
- Time para qualquer planner: `scout` (Codex, só leitura), `builder` (Codex, plano B `builder-claude`),
  `builder-claude` (Claude Sonnet), `expert` (Claude Opus, plano B `builder-claude`).
- Time para planner Codex: `builder` e `expert` 100% Codex. Roteamento: Equilibrado.
- Conferido rodando o próprio normalizador do app sobre o arquivo: os 6 papéis sobrevivem ao carregamento.

**Aprendizados**
- O Alethe só aceita "somente leitura" em papéis do Codex; por isso o scout é Codex nos dois times.
- Editar `projects.json` com o app aberto não adianta: ele sobrescreve no próximo salvamento.

**Próximo passo**
- Abrir o Alethe, criar o projeto `biblioteca-arxiv` e rodar a Fase 1 (`docs/TAREFA-FASE1.md`) no terminal de Orquestração.

---

## 15/10/2026 (madrugada) — Dia 3: provedores, segurança e plano dos próximos projetos

**Feito**
- 9router instalado e **endurecido**: porta 41010, só no PC, senha própria, chave obrigatória.
- **Bug de segurança** encontrado e corrigido no fork: o 9router subia aberto na rede (0.0.0.0:20128).
  Teste unitário + verificação real. Push suspenso até avisar o autor (e-mail pronto).
- Provedores: 7 conexões funcionando (Claude, Codex, Antigravity, GitHub Copilot, Gemini AI Studio,
  Groq, OpenRouter grátis); 5 com falha removidas. Combos `alethe-topo`, `alethe-builder`, `alethe-rapido` desenhados.
- Antigravity CLI (`agy` 1.3.5) instalado; Caveman (say less) instalado e desligado por padrão.
- Avaliados: Caveman, ECC, OmniRoute, AirLLM, Hermes, OpenClaw, N.O.M.A.D., openpi, FoxProfile, Daytona.
- Novos projetos: **Franca Atende + Bina AI** (voz, `voz-agentes`) e **Biblioteca arXiv offline** (`biblioteca-arxiv`).
- Docs reorganizados: TAREFAS em sprints com placar e lacunas; PROVEDORES reescrito; Hermes/OpenClaw na arquitetura.

**Aprendizados**
- Variável de ambiente não basta para o 9router 0.5.59: só `--port`/`--host` funcionam.
- O catálogo do 9router não lista os modelos do OpenRouter; modelos grátis "pensam" e precisam de `max_tokens` maior.
- Recipe ≠ export; repositório arquivado (Daytona) não serve para segurança; sempre ler hooks antes de instalar plugin.

**Próximo passo**
- Reiniciar o PC → cadastrar `agy` e `freebuff` → criar os combos → 1ª orquestração com a Biblioteca arXiv. Ver [RETOMAR.md](./RETOMAR.md).
## 15/10/2026 — Dia 2: entender a arquitetura

**Feito**
- Primeira abertura pelo atalho depois da mudança de pasta (o Rust terminou a compilação interrompida).
- Estudo da arquitetura completa e criação do [ARQUITETURA.md](./ARQUITETURA.md): as duas metades
  (React e Rust), `invoke` e eventos, fluxo do PTY, orquestrador multiagente, estado, mapa de pastas.

**Aprendizados**
- 321 comandos Tauri ligam a interface ao Rust; o texto dos agentes chega por eventos `pty://data/{id}`.
- Terminais fora da tela não emitem texto, só acumulam, e é isso que deixa rodar muitos agentes.
- O orquestrador é um núcleo independente do Tauri: um planejador delega jobs via ferramentas MCP
  `alethe_*`, e um roteador escolhe o papel (scout, builder, expert...) por tipo, esforço e cota.
- O `AGENTS.md` do autor tem regras da casa que o fork ainda não segue (seção 9 do guia).

- Pesquisa de provedores e orquestradores ([PROVEDORES.md](./PROVEDORES.md)): 9router (já embutido no app), OmniRoute, AirLLM, Freebuff, Hermes, OpenClaw e o estudo de caso Toolzz Voice.
- Plano de 100 dias em [TAREFAS.md](./TAREFAS.md), dívidas em [DIVIDAS.md](./DIVIDAS.md) e diagrama de conexões em draw.io + Excalidraw.

**Próximo passo**
- Conectar o 9router pelo próprio Alethe e passar Claude Code e Codex por ele.

---

## 14/10/2026 — Dia 1: nasce o fork

**Feito**
- Projeto rodando pela primeira vez no Windows (primeira compilação do Rust: ~11 min).
- Corrigidas as versões dos plugins Tauri, que impediam o app de abrir.
- Fork criado em `Victor-Enginner/alethe-agents`, com README novo em português.
- Motor ASCII ganhou animação `shimmer` e os modos `mosaic` e `dots`.
- Fundo da home virou um carrossel com 4 artes do 21st.dev (3 ASCII + Van Gogh).
- Atalho ALETHE na área de trabalho.
- Projeto movido para `PROJETOS\alethe`; marco 0 salvo (tag + backup).

**Aprendizados**
- Uma recipe do 21st é só o filtro; para ter a arte idêntica à da galeria, use o *Export* em vídeo.
- A CSP do Tauri bloqueia mídia remota, então assets ficam em `src/assets/`.
- Mover um projeto Rust de pasta exige `cargo clean`.

**Próximo passo**
- Começar a Fase 1: entender a arquitetura do código.
