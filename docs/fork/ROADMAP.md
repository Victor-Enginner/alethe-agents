# Roadmap

Sem prazos fixos: as fases seguem em **ordem**, e cada uma começa quando a anterior estiver de pé. Trabalho diário.
Visão: partir do Alethe para chegar a uma **UI multiagente própria**, rápida, bonita e com
identidade, que mais tarde sirva de base para uma **DAW** (estação de áudio) com agentes.

## Fase 0 — Fundação ✅

- [x] Fork criado e rodando no Windows
- [x] Correção de versões dos plugins Tauri
- [x] README do fork, estrutura de documentação, marco 0 salvo
- [x] Primeira mudança visual: carrossel ASCII no fundo da home

## Fase 1 — Dominar o código

- [ ] Entender a arquitetura: stores Zustand, orquestrador Rust, comandos Tauri
- [x] Mapa do código em [`docs/fork/ARQUITETURA.md`](./ARQUITETURA.md) (15/10/2026)
- [ ] Primeiras mudanças pequenas na UI para aprender o fluxo
- [ ] Nomes reais para os slides do carrossel

## Fase 2 — Identidade própria

- [ ] Escolher nome e logo próprios (exigência do TRADEMARK.md para versão distribuída)
- [ ] Tema visual próprio (cores, tipografia, ícones)
- [ ] Revisar a home e o layout dos painéis

## Fase 3 — Multiagente de verdade

- [ ] Melhorias na orquestração de squads de agentes
- [ ] Performance: memória, número de terminais, tempo de abertura
- [ ] Integração com o gateway de modelos local (LiteLLM / Ollama em `O:\`)

## Fase 4 — Rumo à DAW

- [ ] Pesquisa: motor de áudio em Rust (cpal, rodio, nih-plug) dentro do Tauri
- [ ] Protótipo: timeline simples + agente que ajuda a compor
- [ ] Decidir se a DAW vira módulo deste app ou projeto separado

## Ideias soltas

- Mais artes ASCII no carrossel, ou carrossel configurável pelas preferências
