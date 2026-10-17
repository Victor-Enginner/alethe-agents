# Proposta: workers de CLIs personalizadas no orquestrador

Estado: **aprovada e implementada** (17/10/2026), no working tree, sem commit. Teste real: `opencode`
(modelo grátis) e `agy` responderam "PONG" pelo orquestrador
(`cargo test --test orchestrator real_one_shot -- --ignored`).

Implementação: `Launcher.one_shot` + `OneShotSpec`/`PromptVia` em `orchestrator_core.rs`
(`spawn_one_shot`, `complete_one_shot`, `read_one_shot_line`); registro em `orchestrator.rs`; papéis
aceitam `agy`/`opencode` em Preferências → Orquestração. Prompt do agy vai em arquivo
`.alethe/tasks/<job>-<n>.md` na pasta do worker, apagado ao fim do turno. Limitação: o OpenCode às
vezes não emite `step_finish`, então o card pode ficar sem tokens.

## Problema

O orquestrador só lança dois tipos de worker (`orchestrator_core.rs`, `Launcher`):
Codex (`codex app-server --stdio`, JSON-RPC) e Claude (`claude -p --input-format stream-json`).
Toda tarefa delegada gasta cota do Claude ou do Codex, mesmo as simples.

## O que cada CLI aceita (testado em 16/10)

| CLI | Modo sem terminal | Resultado | Retomar conversa | Serve de worker? |
|---|---|---|---|---|
| `agy` (Antigravity) | `agy --output-format json -p="<prompt>"` | um JSON: `status`, `response`, `conversation_id`, `usage` (3,5 s para "OK") | `--conversation <id>` | **sim** |
| `opencode` | `opencode run --format json --auto -m <provedor/modelo> "<prompt>"` | eventos JSON | `--session <id>` | **sim** (com `9router/alethe-rapido`) |
| `freebuff` | não tem (só interativo, `login`, `--continue`) | — | — | **não**; continua só como terminal |

Observação: o `agy` tem `--input-format stream-json`, mas com esquema próprio (campo `event`),
**não** é o do Claude; por isso a proposta usa o modo de uma chamada por turno.

## Desenho

1. `Launcher` ganha `protocol`:
   - `CodexAppServer` e `ClaudeStreamJson` (como hoje);
   - `OneShotJson { prompt_flag, resume_flag, result_path }` — um processo por turno; o prompt vai no
     argumento; o resultado sai do JSON final; o id da conversa vira o `thread_id` do job para os
     próximos turnos (`--conversation` / `--session`).
2. Presets embutidos para `agy` e `opencode` (args acima); o OpenCode recebe `-m` do papel
   (ex.: `9router/alethe-rapido`) e a chave do 9router só por variável de ambiente, nunca em arquivo.
3. Agente personalizado (Preferências → Agentes personalizados) ganha o campo opcional
   "pode ser worker" com o preset; os papéis de Orquestração passam a listar esses agentes.
4. Somente leitura: `agy --mode plan` e OpenCode sem `--auto`. Sem `--dangerously-skip-permissions`
   por padrão.
5. Custo: `usage` do `agy` e o banco do OpenCode alimentam o mesmo painel de custo.

## Por que assim

- Reaproveita a fila, o limite de vagas, o painel e os papéis que já existem; só muda como o
  processo é iniciado e lido.
- Um processo por turno é mais simples e robusto que imitar um protocolo de stream que cada CLI
  define de um jeito; o custo é reabrir o processo a cada turno (segundos), aceitável para tarefas
  delegadas.

## Critério de pronto

Teste Rust do adaptador `OneShotJson` com um executável falso (sucesso, erro, retomada);
um papel "Leitor barato" usando `agy` executa uma tarefa real no painel; papéis em pt-BR/en/zh;
CHANGELOG.

## Fora do escopo

Freebuff como worker (a CLI não permite). Se um dia ganhar modo `-p`, entra pelo mesmo preset.
