# 9router gerenciado sobe exposto na rede local (0.0.0.0:20128)

- **Encontrado:** 15/10/2026, no fork, ao endurecer o 9router (porta própria + senha).
- **Afeta:** Alethe v1.7.0 + 9router 0.5.59 (versão fixada em `router9.rs`), modo "managed" e "external".
- **Gravidade:** alta. O painel do 9router fica acessível por qualquer máquina da rede local, com a
  senha padrão `123456` enquanto o usuário não trocar.
- **Status no fork:** corrigido localmente. **Divulgação pública suspensa** até o autor ser avisado
  em particular, conforme o `SECURITY.md` do projeto original (contato: contact@kc1t.com).

## Como aparece

O Alethe mostra "Roteando por http://127.0.0.1:41010", mas a porta não responde. O
`9router.log` do perfil mostra:

```text
⚠ Network-exposed: reachable at http://192.168.x.x:20128 (bound 0.0.0.0). Use --host 127.0.0.1 for local-only.
Exiting...
```

## Causa

1. `router9_start` passa a porta e o host só por variáveis de ambiente (`PORT`, `HOSTNAME`).
   O `cli.js` do 9router 0.5.59 lê apenas `--port`/`--host` e **repassa os próprios padrões**
   (`20128`, `0.0.0.0`) ao servidor Next.js, sobrescrevendo as variáveis do Alethe.
2. O processo é iniciado com `stdin` nulo. Sem TTY, o menu interativo do `cli.js` lê EOF como
   "Exit" e derruba o servidor. Por isso ele aparece e some.

## Correção (fork)

`router9_start` passa a iniciar o 9router com:

```text
--port <porta> --host 127.0.0.1 --tray --skip-update --no-browser
```

`--tray` é o modo sem menu (o que o próprio `cli.js` usa ao relançar em segundo plano) e
`--skip-update` impede autoatualização. As variáveis de ambiente continuam sendo passadas.
Teste unitário: `router9::cli_args_tests::binds_loopback_on_the_requested_port`.

## Verificação

- [x] `cargo test cli_args_tests`: 1 passou — ok 15/10
- [x] App recompilado: porta 41010 escuta **só em 127.0.0.1** — ok 15/10
- [x] Nada escutando em 0.0.0.0:20128; conexão pelo IP da rede (192.168.x.x:41010) recusada — ok 15/10
- [x] Log sem o aviso "Network-exposed"; processo segue rodando em modo tray — ok 15/10

## Rascunho do e-mail ao autor (enviar pelo Victor)

> **Para:** contact@kc1t.com
> **Assunto:** [Security] Managed 9router binds 0.0.0.0:20128 regardless of configured port/host
>
> Hi Kauã, I'm running a fork of Alethe and found a security issue in the 9router integration
> (Alethe v1.7.0, 9router 0.5.59 pinned in `src-tauri/src/router9.rs`).
>
> `router9_start` sets `PORT`/`HOSTNAME` env vars, but 9router 0.5.59's `cli.js` only reads
> `--port`/`--host` and passes its own defaults (20128, 0.0.0.0) to the Next.js server, overriding
> them. The dashboard ends up reachable from the whole LAN on the default port, with the default
> password `123456` until the user changes it. The log shows
> "Network-exposed: reachable at http://<lan-ip>:20128 (bound 0.0.0.0)".
>
> A second effect: with `stdin` null the interactive menu reads EOF as "Exit" and kills the server,
> so the UI says "routing" while nothing listens on the configured port.
>
> Fix that works for me: spawn with `--port <port> --host 127.0.0.1 --tray --skip-update --no-browser`.
> Happy to share the patch privately. I'll keep the details out of my public fork until you've had a
> chance to ship a fix. Thanks for the project!
