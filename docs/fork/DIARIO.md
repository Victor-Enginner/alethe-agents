# Diário

Uma entrada por dia de trabalho: o que foi feito, o que travou, o próximo passo.
As mais recentes ficam no topo.

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
