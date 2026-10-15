# Diário

Uma entrada por dia de trabalho: o que foi feito, o que travou, o próximo passo.
As mais recentes ficam no topo.

---

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
- Dia 3: conectar o 9router pelo próprio Alethe e passar Claude Code e Codex por ele.

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
