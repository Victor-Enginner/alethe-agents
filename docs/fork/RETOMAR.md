# Como retomar depois de reiniciar o PC

Estado salvo em 15/10/2026. Tudo commitado localmente; nada se perde ao reiniciar.

## 1. Religar (nesta ordem)

1. **Abrir o ALETHE**: dois cliques no atalho **ALETHE** da área de trabalho.
   - Abre uma janela preta (o "motor"). **Não feche essa janela.**
   - Como o Rust já está compilado, deve abrir em segundos ou poucos minutos.
2. **9router**: liga sozinho com o Alethe (`Iniciar junto com o Alethe: Sim`), na porta **41010**, só no próprio PC.
   - Conferir: Configurações → Integrações → 9router → "Roteando por http://127.0.0.1:41010".
   - Se não ligar: clicar em iniciar ali mesmo.
3. **Ollama**: não precisa (fica por último e não é usado agora).

Nada mais roda sozinho: sem tarefas agendadas, por preferência sua.

## 2. Primeira coisa a fazer: cadastrar os agentes

Configurações → **Terminal e agentes** → **Agentes personalizados** → **Adicionar**.

| Campo | Antigravity | Freebuff |
|---|---|---|
| ID (slug) | `agy` | `freebuff` |
| Nome de exibição | `Antigravity` | `Freebuff` |
| Comando CLI | `agy` (depois do reinício o PATH já reconhece; se não, `C:\Users\User\AppData\Local\agy\bin\agy.exe`) | `freebuff` |
| Flag irrestrita | `--dangerously-skip-permissions` | (vazio) |

Teste: **novo terminal** → escolher o agente → fazer login na primeira vez (`agy`: Google OAuth; `freebuff login`).

## 3. Depois: por onde continuar

1. **Criar os 3 combos** no painel do 9router (`http://127.0.0.1:41010/dashboard` → Combos). Nomes e ordem em [PROVEDORES.md §6](./PROVEDORES.md#6-combos-de-fallback).
2. **Primeira orquestração real (sprint 1.7)** com o projeto **Biblioteca arXiv offline**
   (`PROJETOS/biblioteca-arxiv/docs/PLANO.md`), começando pela Fase 1 (coletor de metadados OAI-PMH).
3. Mandar o **e-mail ao autor do Alethe** ([seguranca/EMAIL-AUTOR-9router.md](./seguranca/EMAIL-AUTOR-9router.md)) e
   avisar o Claude para fazer o **push** dos commits do fork (estão só no PC).

## 4. Onde está cada coisa

| O quê | Onde |
|---|---|
| Fork do Alethe | `O:\DEV\A JORNADA\PROJETOS\alethe` (GitHub: Victor-Enginner/alethe-agents) |
| Tarefas, sprints, placar e lacunas | [TAREFAS.md](./TAREFAS.md) |
| Provedores, 9router, combos, agentes | [PROVEDORES.md](./PROVEDORES.md) |
| Arquitetura (incluindo Hermes e OpenClaw) | [ARQUITETURA.md](./ARQUITETURA.md) |
| Decisões (D-001 a D-005) | [DECISOES.md](./DECISOES.md) |
| Diário | [DIARIO.md](./DIARIO.md) |
| Segurança do 9router | [seguranca/](./seguranca/) |
| Projeto de voz (Franca Atende + Bina AI) | `O:\DEV\A JORNADA\PROJETOS\voz-agentes` |
| Biblioteca arXiv offline | `O:\DEV\A JORNADA\PROJETOS\biblioteca-arxiv` (PDFs em `O:\data\arxiv`) |
| Scripts do 9router | `O:\DEV\A JORNADA\tools\testar-modelos-9router.ps1` e `remover-conexoes-9router.js` |
| Backups | `O:\data\backup\alethe\` (bundles do Git) · `O:\data\backup\9router\` (banco) |
| Atalho do Alethe | Área de trabalho → `ALETHE` (script em `O:\DEV\A JORNADA\tools\atalhos\iniciar-alethe.bat`) |

## 5. Para o Claude (nova sessão)

Ler nesta ordem: este arquivo → TAREFAS.md (placar e lacunas) → PROVEDORES.md §1 (status).
Regras do Victor estão na memória: sem prazos, Ollama por último, provedor que falha sai, toda
mudança vai para README/DIARIO/git, push só depois do aviso ao autor.
