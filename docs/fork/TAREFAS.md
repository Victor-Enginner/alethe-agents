# Tarefas

Lista viva do projeto, em **ordem de execução** (sem prazos: cada etapa leva o tempo que precisar).
Ao concluir: trocar `[ ]` por `[x]` e marcar **ok** com a data em que foi feita.
Uma tarefa grande demais para um dia vira várias pequenas.
Cada sessão termina com: diário atualizado, commit + push. O "DIA XX/100" da série de vídeos conta os dias gravados, não prazos.

**Legenda:** `ok` concluída · `🔄` em andamento · `⛔` bloqueada (motivo ao lado) · `🧪` precisa de teste antes de decidir

---

## Regras permanentes

- [x] Toda mudança vai pro Git, README e DIARIO — ok 14/10
- [x] Dívidas técnicas registradas em [DIVIDAS.md](./DIVIDAS.md) — ok 15/10
- [ ] Sites: nada de site genérico gerado por IA. Só componentes via MCP do 21st.dev (heros e animações complexas)
- [ ] Agentes autônomos (Hermes, OpenClaw) sempre em **sandbox Docker**, nunca com acesso livre ao PC
- [ ] Toda decisão entre ferramentas parecidas vira um registro em DECISOES.md, com teste medido

---

## Bloco 1 — Fundação

- [x] Fork rodando, README, carrossel ASCII, marco 0 — ok 14/10
- [x] Guia de arquitetura ([ARQUITETURA.md](./ARQUITETURA.md)) — ok 15/10
- [x] Pesquisa das ferramentas de provedores e orquestração ([PROVEDORES.md](./PROVEDORES.md)) — ok 15/10
- [x] Diagrama de conexões em draw.io e Excalidraw (`docs/fork/diagramas/`) — ok 15/10
- [x] Instalar o 9router pelo Alethe (v0.5.59, verificado no disco) — ok 15/10
- [x] Levantamento de segurança do 9router (senha padrão, porta, chaves) — ok 15/10
- [x] Corrigir o 9router subindo exposto na rede; agora só 127.0.0.1:41010 (ver `seguranca/`) — ok 15/10
- [ ] ⛔ Push da correção: aguardando aviso privado ao autor. E-mail pronto em [`seguranca/EMAIL-AUTOR-9router.md`](./seguranca/EMAIL-AUTOR-9router.md)
- [x] Senha própria no 9router (gravada com hash; conferido no banco) — ok 15/10
- [x] Travas nos padrões seguros: requireLogin e requireApiKey ligados, nenhum túnel ativo — ok 15/10
- [x] Chave de API do Alethe salva; testado: sem chave = 401, chave falsa = 401, chave real = aceita — ok 15/10
- [ ] Ligar Claude Code e Codex passando pelo 9router; ver o uso na topbar
- [x] OpenRouter conectado no 9router (chave oficial) e testado ponta a ponta: Nemotron Super 120B grátis respondeu em 2,4 s — ok 15/10
- [ ] Testar o OpenRouter via OpenCode dentro do Alethe
- [x] Conexões por assinatura (claude, codex, antigravity, github) mantidas por decisão do Victor (D-005) — ok 15/10
- [ ] Mais provedores grátis no 9router (em andamento pelo Victor)
- [x] Antigravity CLI (`agy`) instalado em `%LOCALAPPDATA%\agy\bin` — ok 15/10
- [ ] Cadastrar `agy` como agente personalizado no Alethe
- [ ] Freebuff (conta paga): cadastrar como agente personalizado no Alethe
- [x] Caveman 4.0.1 instalado como plugin do Claude Code (só say less), **desligado por padrão** (`%APPDATA%\caveman\config.json`), telemetria off (`DO_NOT_TRACK=1`) — ok 15/10
- [ ] 🧪 Caveman: medir economia (antes/depois) com o mesmo roteiro
- [ ] Caveman "read less" (proxy): só depois de entender a convivência com o 9router (ele mexe no ANTHROPIC_BASE_URL)
- [ ] Gemini (AI Studio) e Groq como fallback no combo
- [ ] Ollama local no fim do combo (por último: usa a máquina)
- [ ] Medir RAM/CPU: app parado, 3 agentes, 10 agentes (tabela no PROVEDORES.md)
- [ ] 🧪 Teste comparativo: 9router × OmniRoute (compressão real em tokens, mesma tarefa)
- [ ] Decidir o gateway oficial (D-005) e desligar o que sobrar (LiteLLM?)
- [ ] Antigravity e OpenCode: conferir integração nativa do Alethe
- [ ] Freebuff como worker gratuito (avaliar a qualidade em tarefas simples)
- [ ] Etapa 1 da trilha: comando Rust `ola` + botão (entender `invoke`)
- [ ] Marco 1: provedores conectados, medidos e documentados

## Bloco 2 — Orquestração

- [ ] Usar o orquestrador nativo do Alethe: planejador + papéis (scout, builder, expert)
- [ ] Configurar regras de roteamento por cota (`QuotaGate`) com os provedores do Bloco 1
- [ ] Docker: sandbox para agentes autônomos
- [ ] Hermes Agent dentro da sandbox: memória persistente e skills
- [ ] OpenClaw dentro da sandbox: gateway, canais, sub-agentes
- [ ] Comparar orquestrador do Alethe × OpenClaw × Hermes (quando usar cada um)

## Bloco 3 — Automações reais

- [ ] Pipeline de conteúdo: roteiro → narração → vídeo → thumbnail (série 100 dias)
- [ ] Publicação pelas APIs oficiais (YouTube Data API, Meta Graph API, TikTok Content Posting API)
- [x] Estudo de caso Toolzz Voice e planejamento do projeto de voz — ok 15/10 → projeto próprio em `PROJETOS/voz-agentes`
- [ ] Protótipo de agente de voz próprio

## Bloco 4 — Produto e negócio

- [ ] Squad de agentes para um nicho real (ex.: agendamento e estoque em clínicas)
- [ ] Identidade própria do fork (nome, logo, tema)
- [ ] Marco final: demonstração completa, do DIA 01 ao 100
