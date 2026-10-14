# Marcos

Pontos salvos do projeto. Cada marco tem uma **tag no Git** (também no GitHub) e um
**backup completo** em `O:\data\backup\alethe\` (git bundle, recupera tudo mesmo sem internet).

| Marco | Data | Tag | Backup | Estado |
|---|---|---|---|---|
| 0 | 14/10/2026 | `marco-0-2026-10-14` | `alethe-marco-0-2026-10-14.bundle` | Fork rodando, README, carrossel ASCII com 4 artes |

## Criar um marco novo

```bash
git tag -a marco-N-AAAA-MM-DD -m "descrição"
git push origin marco-N-AAAA-MM-DD
git bundle create "O:/data/backup/alethe/alethe-marco-N-AAAA-MM-DD.bundle" --all
```

## Voltar a um marco

Para olhar (sem perder nada):
```bash
git switch -c olhando-marco-0 marco-0-2026-10-14
```

Para recuperar o projeto inteiro de um backup:
```bash
git clone "O:/data/backup/alethe/alethe-marco-0-2026-10-14.bundle" alethe-restaurado
```

> Os bundles guardam o histórico do Git. `node_modules` e o cache do Rust não entram;
> são recriados com `npm install` e na primeira compilação.
