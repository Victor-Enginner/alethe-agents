# Dívidas técnicas

O que ficou "feito, mas não do jeito certo". Revisar no início de cada bloco do plano.
Ao pagar uma dívida: marcar `[x]` com a data e o commit.

| # | Dívida | Por que importa | Onde | Desde |
|---|---|---|---|---|
| DT-01 | [ ] Comentários em português no código | Regra do autor (AGENTS.md): código em inglês. Dificulta receber updates e contribuir de volta | `ascii-effect.tsx`, `asciiRecipes.ts`, `HomeBackdropCarousel.*` | 14/10 |
| DT-02 | [ ] Cores fixas (hex) em vez de tokens do tema | Regra do autor: só variáveis de `src/styles/theme.css`. Quebra a troca de tema | `asciiRecipes.ts`, `HomeBackdropCarousel.module.css` | 14/10 |
| DT-03 | [ ] Features sem registro em `docs/CHANGELOG.md` | Regra do autor: changelog obrigatório em `[Unreleased]` | carrossel ASCII | 14/10 |
| DT-04 | [ ] Slides com nomes genéricos (`slide-a/b/c`) | Difícil saber qual arte é qual | `src/assets/home-bg/` | 14/10 |
| DT-05 | [ ] Sem teste do `HomeBackdropCarousel` | Troca de slide e cross-fade sem cobertura | `src/components/HomeView/` | 14/10 |
| DT-06 | [ ] 3 gateways no PC (9router, OmniRoute?, LiteLLM) | Redundância, portas e chaves em vários lugares | ver PROVEDORES.md | 15/10 |
