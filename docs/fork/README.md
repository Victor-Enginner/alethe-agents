# Documentação do fork

Tudo o que é deste fork fica aqui. O resto de `docs/` é do projeto original.

| Arquivo | Para que serve | Quando atualizar |
|---|---|---|
| [ARQUITETURA.md](./ARQUITETURA.md) | Como o app funciona por dentro, com trilha de estudo | Ao descobrir algo novo no código |
| [ROADMAP.md](./ROADMAP.md) | Para onde o projeto vai: fases, metas e ideias | Ao planejar ou concluir uma etapa |
| [DIARIO.md](./DIARIO.md) | Registro de cada dia de trabalho | Ao final de cada sessão |
| [DECISOES.md](./DECISOES.md) | Decisões importantes e o porquê de cada uma | Ao escolher entre caminhos |
| [MARCOS.md](./MARCOS.md) | Pontos salvos do projeto (tags e backups) e como voltar a eles | A cada marco |

## Regras do fork

1. **Toda mudança vai pro Git e pro README** no mesmo commit (tabela "Modificações deste fork").
2. **Commits pequenos e descritivos**, em português, no padrão `tipo(área): descrição` (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`).
3. **Antes de mudança grande**: criar um marco (ver MARCOS.md).
4. **Testes verdes antes de subir**: `npx vitest run`.
5. **Sincronizar com o original** de vez em quando: `git fetch upstream && git merge upstream/main`.
