<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Visual do Oásis

Antes de mexer em qualquer tela, leia [DESIGN.md](DESIGN.md) (tokens, fontes, movimento, componentes, layout e o que não fazer). Ele também é o nó `DESIGN.md (guia visual do Oásis)` no grafo do Graphify (`graphify-out/graph.json`):

```
graphify explain "DESIGN.md (guia visual do Oásis)"
```

Para atualizar o grafo sem perder esse nó, rode da pasta `oasis` com a saída fixada (senão o Graphify cria `src/graphify-out`):

```
GRAPHIFY_OUT="<caminho absoluto>/oasis/graphify-out" graphify update src
```
