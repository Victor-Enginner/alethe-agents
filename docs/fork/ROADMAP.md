# Roadmap

Horizonte: **outubro de 2026 a outubro de 2027**, com trabalho diário.
Visão: partir do Alethe para chegar a uma **UI multiagente própria**, rápida, bonita e com
identidade, que mais tarde sirva de base para uma **DAW** (estação de áudio) com agentes.

## Fase 0 — Fundação (outubro de 2026) ✅

- [x] Fork criado e rodando no Windows
- [x] Correção de versões dos plugins Tauri
- [x] README do fork, estrutura de documentação, marco 0 salvo
- [x] Primeira mudança visual: carrossel ASCII no fundo da home

## Fase 1 — Dominar o código (meses 1-2)

- [ ] Entender a arquitetura: stores Zustand, orquestrador Rust, comandos Tauri
- [ ] Mapa do código em `docs/fork/` (o que cada pasta faz)
- [ ] Primeiras mudanças pequenas na UI para aprender o fluxo
- [ ] Nomes reais para os slides do carrossel

## Fase 2 — Identidade própria (meses 2-4)

- [ ] Escolher nome e logo próprios (exigência do TRADEMARK.md para versão distribuída)
- [ ] Tema visual próprio (cores, tipografia, ícones)
- [ ] Revisar a home e o layout dos painéis

## Fase 3 — Multiagente de verdade (meses 4-8)

- [ ] Melhorias na orquestração de squads de agentes
- [ ] Performance: memória, número de terminais, tempo de abertura
- [ ] Integração com o gateway de modelos local (LiteLLM / Ollama em `O:\`)

## Fase 4 — Rumo à DAW (meses 8-12)

- [ ] Pesquisa: motor de áudio em Rust (cpal, rodio, nih-plug) dentro do Tauri
- [ ] Protótipo: timeline simples + agente que ajuda a compor
- [ ] Decidir se a DAW vira módulo deste app ou projeto separado

## Ideias soltas

- Mais artes ASCII no carrossel, ou carrossel configurável pelas preferências
