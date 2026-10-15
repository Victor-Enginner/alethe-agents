# E-mail para o autor do Alethe (aviso privado de segurança)

**Status:** ⏳ não enviado
**Quando enviar:** antes de dar push da correção `fix(9router)` no fork público.
**Depois de enviar:** marcar aqui a data, mudar o status para "enviado" e avisar o Claude para seguir com o push.

---

**Para:** contact@kc1t.com
**Assunto:** [Security] Managed 9router binds 0.0.0.0:20128 regardless of configured port/host

---

Hi Kauã,

I'm running a fork of Alethe and found a security issue in the 9router integration (Alethe v1.7.0, 9router 0.5.59 pinned in `src-tauri/src/router9.rs`).

**What happens**

`router9_start` sets the `PORT` and `HOSTNAME` env vars, but 9router 0.5.59's `cli.js` only reads `--port` / `--host` and passes its own defaults (20128, 0.0.0.0) to the Next.js server, overriding them. So the dashboard ends up reachable from the whole LAN on the default port, with the default password `123456` until the user changes it. The 9router log shows:

    Network-exposed: reachable at http://<lan-ip>:20128 (bound 0.0.0.0). Use --host 127.0.0.1 for local-only.

A second effect: because the process is spawned with `stdin` null, the interactive menu in `cli.js` reads EOF as "Exit" and kills the server. The UI says "routing" while nothing listens on the configured port.

**Fix that works for me**

Spawn 9router with:

    --port <port> --host 127.0.0.1 --tray --skip-update --no-browser

`--tray` is the headless mode `cli.js` itself uses when it relaunches in the background, and `--skip-update` prevents self-updates. After this change, 9router listens only on 127.0.0.1 at the configured port and connections from the LAN IP are refused.

I'm happy to share the patch privately. I'll keep the details out of my public fork until you've had a chance to ship a fix.

Thanks for the project!

Victor
https://github.com/Victor-Enginner
