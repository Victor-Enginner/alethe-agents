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

<a id="d-005"></a>
## D-005 — Assinaturas por OAuth no 9router: mantidas (15/10/2026)

**Contexto:** além das chaves de API (OpenRouter), o 9router recebeu conexões por login de conta:
Claude, Codex, Antigravity e GitHub Copilot. Os termos desses serviços restringem o uso de
assinaturas pessoais por proxies de terceiros, e o 9router tem vulnerabilidades conhecidas.
**Decisão (Victor):** manter todas e seguir adicionando provedores grátis. "Quanto mais melhor."
**Riscos aceitos:** possível suspensão das contas; tokens de login guardados no banco do 9router.
**Mitigações em vigor:** 9router só em `127.0.0.1:41010` (correção de segurança do fork), senha
própria, chave de API obrigatória, túnel desligado, telemetria do Caveman desligada. Não expor a
pasta `9router-data` em backups públicos. Monitorar avisos ou bloqueios nos painéis das contas.
<a id="d-006"></a>
## D-006 — 9router nunca exposto: sem Tunnel e sem Tailscale no 9router (16/10/2026)

**Contexto:** o túnel público do 9router (cloudflared) e o modo Tailscale dele publicariam as contas
conectadas (Claude, Codex, Antigravity, Copilot) na internet. Além disso, o 9router 0.5.59 monta o túnel
na porta padrão 20128, então ele nem funciona com a nossa porta 41010.
**Decisão (Victor):** não usar túnel no 9router "de forma alguma". Acesso de fora = **9Remote** (controle do PC)
+ **Tailscale** (rede privada). Os agentes continuam falando com o 9router por `127.0.0.1`.
**Consequência:** se alguém religar, desligar com `A JORNADA/tools/desligar-tunel-9router.js`.
Evolução do fork: impedir no código que o Alethe/9router ligue o túnel (tarefa aberta).

<a id="d-007"></a>
## D-007 — 9router e OmniRoute juntos, cada um no seu papel (16/10/2026)

**Teste** (`A JORNADA/tools/comparar-gateways.mjs`): mesmo modelo (Groq `openai/gpt-oss-120b`), mesmo pedido
(log de 120 linhas + pergunta curta, típico de agente), 3 rodadas.

| | 9router | OmniRoute |
|---|---|---|
| Tokens de entrada | 5.944 | **3.944 (−33,6%)** |
| Resposta | correta (worker-6, 989 ms) | correta, mesma informação |
| Tempo | **1,1–1,5 s** | 2,4 s (aquecido) · 10,9 s (1ª chamada) |
| No limite do Groq (429) | erro na hora | esperou e respondeu (31 s) |

**Decisão:** usar os dois. **OmniRoute** para trabalho com muito contexto (workers do orquestrador, leitura de
logs, documentos, papers): ~1/3 menos tokens sem perder a resposta. **9router** para o que é interativo e
rápido, e porque é o gateway integrado ao Alethe (combos, OpenCode, topbar).
**Pendências:** repetir o teste com outros tipos de pedido (código, conversa) e com o Caveman ligado; medir o
efeito na cota das assinaturas; o LiteLLM (:41000) vira candidato a desligar (DT-06).
