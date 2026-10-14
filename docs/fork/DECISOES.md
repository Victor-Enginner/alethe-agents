# Decisões

Registro curto das escolhas importantes: contexto, decisão e consequência.
Numeradas, nunca apagadas. Se uma decisão mudar, crie outra que a substitua.

---

## D-001 — Fork em vez de projeto do zero (14/10/2026)

**Contexto:** quero uma UI multiagente própria. O Alethe (AGPL-3.0) já resolve terminais
paralelos, orquestração e painéis, com 1073 testes.
**Decisão:** evoluir a partir de um fork, mantendo `upstream` para receber melhorias do original.
**Consequência:** o código continua AGPL (versões distribuídas precisam publicar o código-fonte).
Para distribuir, é preciso nome e logo próprios (TRADEMARK.md).

## D-002 — Assets do fundo locais, não remotos (14/10/2026)

**Contexto:** as artes do 21st ficam num CDN, e a CSP do app bloqueia mídia remota.
**Decisão:** baixar os vídeos para `src/assets/home-bg/` em vez de liberar o domínio na CSP.
**Consequência:** funciona offline e mantém a segurança, mas cada arte nova é um arquivo no repositório.

## D-003 — Exports em vídeo no carrossel; receitas ao vivo guardadas (14/10/2026)

**Contexto:** as recipes do 21st não incluem a foto original, então o resultado ao vivo não
fica igual ao da galeria.
**Decisão:** o carrossel usa os exports em vídeo. O motor `ascii-effect` e as receitas ficam
disponíveis em `asciiRecipes.ts` para usos futuros.
**Consequência:** arte idêntica à galeria, mas sem interação com o mouse.

## D-004 — Pasta própria em PROJETOS\alethe (14/10/2026)

**Contexto:** o projeto estava dentro de `VIRTUAL-3D\agentes`, sem relação com o VIRTUAL-3D.
**Decisão:** mover para `O:\dev\A JORNADA\PROJETOS\alethe`.
**Consequência:** caminho curto e independente. O cache Rust foi recriado do zero.
