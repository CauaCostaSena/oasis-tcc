# Oásis: guia visual

Referência do visual do site, atualizada depois do polimento de 20/11/2026 e da conferência de 24/11/2026. Antes de mexer em qualquer tela, leia este arquivo e `src/app/globals.css`.

## Direção

- Produto para recrutadores de empresas: a maior parte é tela de trabalho (busca, análise, comparação). Clareza e consistência valem mais que efeito.
- Tema **escuro por padrão** e tema **claro**, os dois em verde-água. O tema fica em `data-tema="claro"` no `<html>`, salvo no `localStorage` e aplicado antes da primeira pintura (script em `src/app/layout.tsx`).
- Site todo em português.
- A landing é a única tela "de vitrine" (hero com card 3D, fluxo de 4 passos, planos). O app é sóbrio.

## Fontes

| Uso | Fonte | Variável |
|---|---|---|
| Títulos (display) | Sora | `--font-sora` / `font-display` |
| Texto | Geist | `--font-geist-sans` / `font-sans` |
| Números e código | Geist Mono | `--font-geist-mono` / `font-mono` |

Números em contagem usam `tabular-nums` (classe `.num`).

## Cores (tokens em `:root`)

| Token | Escuro | Claro | Uso |
|---|---|---|---|
| `--background` | `#050b0b` | `#f2f8f7` | fundo da página |
| `--surface` | `#0c1716` | `#ffffff` | cards, pop-ups |
| `--surface-2` | `#132422` | `#e8f2f0` | trilhos, chips neutros, células |
| `--border` | `#1f3532` | `#d3e3e0` | bordas e divisórias |
| `--foreground` | `#ecf7f4` | `#07201d` | texto principal |
| `--muted` | `#8ea8a3` | `#55706b` | texto secundário |
| `--primary` | `#2dd4bf` | `#0f766e` | ação, destaque, foco |
| `--primary-hover` | `#5eead4` | `#0d5f59` | hover do primário |
| `--primary-soft` | teal 12% | `#d7f1ec` | fundo de hover/seleção |
| `--on-primary` | `#03201c` | `#ffffff` | texto sobre o primário |
| `--danger` / `--danger-soft` | `#fca5a5` / vermelho 12% | `#b91c1c` / `#fee2e2` | erros, excluir |

No Tailwind viram `bg-surface`, `text-muted`, `border-border`, `text-primary` etc. (`@theme inline` em `globals.css`).

**Laranja neon `#FE5F2F`**: cor exclusiva de "candidato já salvo pela empresa" (`.neon-salvo`, `.selo-salvo`). No tema claro o selo usa `#c2410c` para ter contraste. Não usar essa cor para mais nada.

**Gráficos** (`--serie-1..6`): uma cor fixa por candidato, na ordem em que entrou na comparação. Paleta conferida para daltonismo.

| | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Escuro | `#3987e5` | `#d95926` | `#199e70` | `#c98500` | `#d55181` | `#0ca30c` |
| Claro | `#2a78d6` | `#eb6834` | `#1baf7a` | `#eda100` | `#e87ba4` | `#008300` |

A tabela de linguagens usa uma cor só (`--primary` misturado a `--surface-2`, no máximo 45%) para o número continuar legível.

## Forma, sombra e movimento

- Cantos: `--r-card: 1rem` (cards, pop-ups flutuantes) e `--r-controle: 0.75rem` (botões, campos, toasts). O `dialog.popup` usa 1.25rem.
- Sombra: só `--sombra`, e só em elementos que flutuam (`.flutuante`, pop-ups). Cards comuns têm **apenas borda**.
- Curvas: `--ease-out: cubic-bezier(0.16,1,0.3,1)` para quase tudo; `--ease-in-out` para trocas de estado.
- Durações: `--dur-1: 140ms` (hover, toque), `--dur-2: 240ms` (abrir/fechar), `--dur-3: 480ms` (entrada de tela).
- Nada de mola ou "bounce" (o detector do Impeccable acusa).
- **Um momento de movimento por tela.** Ex.: no Início a busca entra (`.entra`); nos resultados os cards entram em cascata (`--n` = índice, 50 ms cada, máx. 11).
- `prefers-reduced-motion`: todas as animações são desligadas no fim de `globals.css` e de cada `estilos/*.css`. O neon laranja vira borda fixa.

## Componentes base (`globals.css`)

| Classe | O que é |
|---|---|
| `.btn` + `.btn-primary` / `.btn-outline` / `.btn-ghost` | botões; altura mín. 2.5rem, ícone 1rem, `scale(0.97)` ao clicar |
| `.btn-icone` | botão só com ícone (ícone 1.125rem); sempre com `aria-label` |
| `.btn-perigo` | ação destrutiva (hover vermelho) |
| `svg.seta` dentro de `.btn` | seta que anda 3px no hover |
| `.card` / `.card-hover` | superfície com borda; hover muda borda e fundo |
| `.flutuante` | painel que flutua (sino, menus): borda + `--sombra` |
| `.vidro` | barra com fundo 86% + blur 10px |
| `.chip` / `.chip-neutro` | etiquetas pequenas (ícone 0.75rem) |
| `.subtitulo` | linha abaixo do título da página (muted, 0.9375rem) |
| `.rotulo` | rótulo de campo (muted, 0.8125rem, 500) |
| `.field` | input/select; foco = borda primária + anel `--primary-soft` |
| `.alerta` | mensagem de erro (`role="alert"`) |
| `.switch` | interruptor (filtros, "Mostrar já salvos") |
| `.neon-check` | checkbox animado (selecionar para comparar) |
| `.neon-salvo` / `.selo-salvo` | linha laranja que circula o card / selo "já salvo" |
| `dialog.popup` | pop-up de filtros (`<dialog>` nativo) |
| `.barra` | barra de progresso do plano (enche ao abrir) |
| `.esqueleto` | carregamento (`Carregando.tsx`) |
| `.entra` | entrada com fade + 14px |
| `.tilt` / `.tilt-in` / `.tilt-brilho` | card 3D, **só na landing** (removido dos resultados a pedido) |
| `.pasta*` | pastas de favoritos que abrem no hover/foco |
| `.titulo-gigante` | título enorme da landing, cor sólida |
| `kbd.tecla` | atalho de teclado (sem `display` próprio, para `hidden` funcionar) |
| `.tema-claro-so` / `.tema-escuro-so` | mostrar algo só num tema |

Toasts (Sonner) seguem o tema: canto inferior direito, botão de fechar, ícone na cor primária (erro em vermelho).

## CSS por área (`src/app/estilos/`)

Importados em `globals.css` depois do Tailwind.

- `landing.css`: entrada do hero (`.hero-texto`, `.hero-card`).
- `acesso.css`: login/cadastro/perfis (`.girando` spinner, `.pin-campo`, `.perfil-avatar`).
- `app.css`: casca do app (`.casca-barra` com blur só no desktop, `.card.spot` da busca, `.sugestao`, `.chip-opcao`, `kbd.tecla`).
- `analise.css`: candidato, favoritos, comparações (`.an-capa`, `.an-numeros`, `.an-linha`, `.an-acao` barra fixa de comparar, `.an-radar-serie`/`.an-barra` gráficos que se desenham, `.an-modelo`, `.an-estrela`).

## Ícones

Só **lucide-react**. Nada de caracteres no lugar de ícone (✳, ↑, ★). Tamanhos: 16 em botões e listas, 18 em atalhos e navegação, 12–14 em chips e metadados, 32 em estados vazios. Repositórios = `BookMarked`.

## Layout das telas

- `<main className="mx-auto w-full max-w-6xl px-6 py-10">` em todas as páginas do app.
- Título: `h1` `text-3xl sm:text-4xl font-bold` + `.subtitulo` logo abaixo. **Sem etiqueta em cima do título.**
- Grades de cards: `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3` (o `grid-cols-1` evita vazar 3px no celular).
- Desktop: barra lateral esquerda fixa (`md:pl-60`). Celular (< 768px): barra inferior fixa com os 5 itens (`pb-20 md:pb-0`). A barra de comparar (`.an-acao`) fica 60px acima no celular.
- Busca Spotlight fixa no Início e em `/busca`; `Ctrl+K` abre em qualquer página (via `createPortal`, porque `backdrop-filter` prende `position: fixed`). No celular o atalho aparece como "o botão Buscar no topo".
- Card de candidato: o card inteiro é um link (link esticado), sem botão "Ver perfil". Favoritar fica por cima.
- Listas (comparações, atalhos, histórico) em vez de grades de cards iguais.

## O que não fazer (já foi removido)

- Etiqueta/eyebrow acima de títulos; numeração "01 —" / "#01".
- Texto em degradê; brilho verde em botões; blur em cada card.
- Grade de pontos no fundo; `background-attachment: fixed` (o fundo tem um único brilho radial).
- Grades de cards idênticos com ícone + título + texto.
- A mesma animação de entrada em tudo.
- Tilt 3D nos cards de resultado.

## Armadilhas técnicas

- CSS próprio fora de `@layer` ganha das utilidades do Tailwind. Se uma classe própria define `display`, `hidden`/`md:flex` param de funcionar: use `!hidden` ou não defina `display` na classe.
- `backdrop-filter` num pai prende filhos `position: fixed`: por isso a barra do celular é sólida e o Ctrl+K usa portal.
- `usePathname` em rota dinâmica precisa de `Suspense` (Next 16 com cacheComponents).

## Textos que entraram no polimento

- Landing: "Da busca à decisão em quatro passos" e "Sem planilha e sem abrir um perfil por vez".
- Login e landing mostram prévias fictícias marcadas como "exemplo ilustrativo".
- Resumo do candidato: "19 estrelas" em vez de "19★" (comparações antigas guardam o texto antigo).
- Histórico agrupado por dia no fuso do servidor.

## Onde está cada coisa

| Área | Arquivos |
|---|---|
| Tokens e componentes base | `src/app/globals.css` |
| Fontes, tema, toasts | `src/app/layout.tsx` |
| Landing | `src/app/page.tsx`, `components/Planos.tsx`, `components/Tilt.tsx` |
| Acesso | `components/FormularioAuth.tsx`, `components/SelecaoPerfil.tsx`, `app/perfis/page.tsx` |
| Casca do app | `app/(app)/layout.tsx`, `components/NavApp.tsx`, `components/Spotlight.tsx` |
| Resultados | `components/CardCandidato.tsx`, `components/Carregando.tsx`, `app/(app)/busca`, `painel`, `historico`, `semelhantes` |
| Análise | `app/(app)/candidato/[login]`, `favoritos` (`components/Pastas.tsx`), `comparar`, `comparacoes`, `components/ComparacaoView.tsx`, `components/Comparacoes.tsx`, `components/FormAvaliacao.tsx` |

## Conferido em 24/11/2026

- **Pastas:** criar, renomear e excluir funcionam de ponta a ponta, com toast. Excluir **não pede confirmação** (apaga na hora; os favoritos continuam). Fica a decisão de colocar uma confirmação.
- **Máscara do CNPJ:** o cursor fica no lugar ao digitar ou apagar no meio do número (`aplicarMascara` em `FormularioAuth.tsx`).
- **Tema claro a 375px:** landing, login, cadastro, perfis e todas as páginas internas, sem vazamento lateral. Corrigido:
  - rótulos "Comparações" e "Semelhantes" cortados na barra de baixo (`tracking-tight` no celular);
  - pastas da landing: em tela de toque já aparecem abertas (`.pastas-demo`, em `landing.css`), e a dica "Passe o mouse" só aparece onde há mouse (`[@media(hover:hover)]`);
  - o nome da pasta não reserva mais espaço para o botão "…" quando ele não existe (`PastaVisual`).
- **Ctrl+K:** a saída agora é um fade de 160 ms, sem mola; some em cerca de 0,35 s depois do Esc. A entrada continua como antes.
- **Tabelas da comparação:** no celular rolam dentro do próprio card (de propósito).

## Pendências visuais

- 21st.dev: a skill está instalada, mas o servidor MCP dela não conecta (sem ferramentas `search`/`get_component`; provavelmente falta a chave `API_KEY_21ST`). Componentes seguem feitos à mão.
- Excluir pasta sem confirmação (ver acima).
- O tema escuro no celular não foi refeito depois destas correções.
