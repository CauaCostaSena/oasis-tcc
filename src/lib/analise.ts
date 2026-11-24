// Resumo automático e similaridade entre perfis: só contas sobre dados públicos, sem IA e sem dependências
// (testado em logica.test.mjs). Os tipos espelham Perfil/Repo de github.ts.

type RepoBase = {
  nome: string;
  descricao: string | null;
  linguagem: string | null;
  estrelas: number;
  forks: number;
  atualizado: string | null;
  url: string;
  fork: boolean;
  topicos?: string[];
};
type PerfilBase = { login: string; nome: string | null; repos: number; seguidores: number; criadoEm?: string | null };

export type Analise = {
  linguagens: [string, number][]; // repositórios próprios por linguagem, do maior para o menor
  topicos: [string, number][];
  areas: string[];
  estrelas: number;
  forks: number;
  reposProprios: number;
  reposAtivos: number; // com envio de código nos últimos 12 meses
  ultimaAtividade: string | null;
  anosConta: number | null;
  destaques: { nome: string; descricao: string | null; estrelas: number; linguagem: string | null; url: string }[];
  resumo: string;
};

// Área de atuação sugerida por palavras nos tópicos, nomes e descrições, ou pela linguagem do repositório.
const AREAS: [string, RegExp, string[]][] = [
  ["Front-end", /\b(react|vue|angular|svelte|next\.?js|front-?end|css|tailwind|html|landing)\b/, ["HTML", "CSS", "Vue"]],
  ["Back-end e APIs", /\b(api|back-?end|rest|graphql|express|spring|django|flask|fastapi|laravel|nest\.?js|server|microservi\w*|crud)\b/, []],
  ["Mobile", /\b(flutter|android|ios|react-native|mobile|swiftui|expo)\b/, ["Dart", "Swift", "Kotlin"]],
  ["Dados e IA", /\b(machine-?learning|ml|data-?science|dataset|pandas|deep-?learning|ai|llm|analytics|etl|nlp|chatbot)\b/, ["Jupyter Notebook", "R"]],
  ["DevOps e infraestrutura", /\b(docker|kubernetes|k8s|terraform|devops|ci|ansible|aws|infra\w*)\b/, ["HCL", "Dockerfile", "Shell"]],
  ["Jogos", /\b(game|games|unity|godot|pygame|jogo|jogos)\b/, ["GDScript"]],
  ["Ferramentas e bibliotecas", /\b(cli|library|biblioteca|sdk|plugin|tool|package|lib)\b/, []],
];

const contar = (itens: string[]) => {
  const n = new Map<string, number>();
  for (const i of itens) n.set(i, (n.get(i) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};
const juntar = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(", ")} e ${l.at(-1)}` : (l[0] ?? ""));
const dataBr = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });

/** Lê os repositórios próprios (forks ficam fora) e devolve os números e um resumo em texto. */
export function analisar(perfil: PerfilBase, repos: RepoBase[], agora = new Date()): Analise {
  const proprios = repos.filter((r) => !r.fork);
  const linguagens = contar(proprios.flatMap((r) => (r.linguagem ? [r.linguagem] : [])));
  const topicos = contar(proprios.flatMap((r) => r.topicos ?? []));
  const umAnoAtras = new Date(agora.getFullYear() - 1, agora.getMonth(), agora.getDate()).toISOString();
  const reposAtivos = proprios.filter((r) => r.atualizado && r.atualizado >= umAnoAtras).length;
  const ultimaAtividade = proprios.map((r) => r.atualizado).filter((d): d is string => Boolean(d)).sort().at(-1) ?? null;
  const anosConta = perfil.criadoEm
    ? Math.floor((agora.getTime() - new Date(perfil.criadoEm).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  // Uma área entra se aparecer em pelo menos 2 repositórios ou em 20% deles.
  const areas = AREAS.map(([nome, regex, langs]) => {
    const n = proprios.filter(
      (r) =>
        regex.test(`${r.nome} ${r.descricao ?? ""} ${(r.topicos ?? []).join(" ")}`.toLowerCase().replace(/_/g, " ")) ||
        (r.linguagem !== null && langs.includes(r.linguagem)),
    ).length;
    return [nome, n] as const;
  })
    .filter(([, n]) => n >= 2 || (n > 0 && n >= proprios.length * 0.2))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nome]) => nome);

  const destaques = [...proprios]
    .sort((a, b) => b.estrelas - a.estrelas)
    .slice(0, 3)
    .filter((r) => r.estrelas > 0)
    .map(({ nome, descricao, estrelas, linguagem, url }) => ({ nome, descricao, estrelas, linguagem, url }));

  const quem = perfil.nome ?? `@${perfil.login}`;
  const frases: string[] = [];
  if (proprios.length === 0) {
    frases.push(`${quem} não tem repositórios próprios públicos${repos.length ? " (apenas forks)" : ""}.`);
  } else {
    const comLinguagem = linguagens.reduce((s, [, n]) => s + n, 0);
    const principais = linguagens.slice(0, 3).map(([l, n]) => `${l} (${Math.round((n / comLinguagem) * 100)}%)`);
    frases.push(
      principais.length
        ? `${quem} publica principalmente em ${juntar(principais)}${areas.length ? `, com projetos de ${juntar(areas)}` : ""}.`
        : `${quem} tem repositórios sem linguagem identificada pelo GitHub.`,
    );
    frases.push(
      `São ${proprios.length} repositórios próprios nos mais recentes, ${reposAtivos} com código enviado nos últimos 12 meses` +
        (ultimaAtividade ? `; a última atividade foi em ${dataBr(ultimaAtividade)}.` : "."),
    );
    if (destaques.length) {
      frases.push(`Mais estrelados: ${juntar(destaques.map((d) => `${d.nome} (${d.estrelas} ${d.estrelas === 1 ? "estrela" : "estrelas"})`))}.`);
    }
    if (topicos.length) frases.push(`Temas recorrentes: ${juntar(topicos.slice(0, 5).map(([t]) => t))}.`);
  }

  return {
    linguagens,
    topicos,
    areas,
    estrelas: proprios.reduce((s, r) => s + r.estrelas, 0),
    forks: proprios.reduce((s, r) => s + r.forks, 0),
    reposProprios: proprios.length,
    reposAtivos,
    ultimaAtividade,
    anosConta,
    destaques,
    resumo: frases.join(" "),
  };
}

type Comparavel = { perfil: PerfilBase; analise: Analise };

const jaccard = (a: string[], b: string[]) => {
  const uniao = new Set([...a, ...b]);
  return uniao.size ? a.filter((x) => b.includes(x)).length / uniao.size : null;
};
// Em escala logarítmica: 50 e 100 seguidores são parecidos, 50 e 90 mil não.
const razao = (a: number, b: number) => Math.log(Math.min(a, b) + 2) / Math.log(Math.max(a, b) + 2);

// Pesos de cada critério na nota final; um critério sem dados sai da conta e os outros são reescalados.
const PESOS = { linguagens: 50, projeto: 30, porte: 20 };

/**
 * Similaridade (0–100) do candidato com o perfil modelo, em três critérios:
 * linguagens (proporção de repositórios por linguagem), tipo de projeto (áreas e tópicos em comum)
 * e porte (repositórios, seguidores e tempo de conta em faixas parecidas).
 */
export function similaridade(modelo: Comparavel, outro: Comparavel) {
  const a = new Map(modelo.analise.linguagens);
  const b = new Map(outro.analise.linguagens);
  const norma = (m: Map<string, number>) => Math.sqrt([...m.values()].reduce((s, v) => s + v * v, 0));
  const produto = [...a].reduce((s, [l, v]) => s + v * (b.get(l) ?? 0), 0);
  const linguagens = a.size && b.size ? produto / (norma(a) * norma(b)) : null; // cosseno

  const top = (x: Comparavel) => x.analise.topicos.slice(0, 15).map(([t]) => t);
  const porArea = jaccard(modelo.analise.areas, outro.analise.areas);
  const porTopico = top(modelo).length && top(outro).length ? jaccard(top(modelo), top(outro)) : null;
  const projeto = porArea !== null && porTopico !== null ? (porArea + porTopico) / 2 : (porArea ?? porTopico);

  const medidas = [
    razao(modelo.perfil.repos, outro.perfil.repos),
    razao(modelo.perfil.seguidores, outro.perfil.seguidores),
    ...(modelo.analise.anosConta !== null && outro.analise.anosConta !== null
      ? [razao(modelo.analise.anosConta, outro.analise.anosConta)]
      : []),
  ];
  const porte = medidas.reduce((s, v) => s + v, 0) / medidas.length;

  const partes = { linguagens, projeto, porte };
  let soma = 0;
  let peso = 0;
  for (const k of Object.keys(PESOS) as (keyof typeof PESOS)[]) {
    if (partes[k] === null) continue;
    soma += partes[k] * PESOS[k];
    peso += PESOS[k];
  }

  const emComum = (x: string[], y: string[]) => x.filter((i) => y.includes(i));
  const langs = emComum([...a.keys()], [...b.keys()]).slice(0, 4);
  const areas = emComum(modelo.analise.areas, outro.analise.areas);
  const temas = emComum(top(modelo), top(outro)).slice(0, 4);
  const pontos = [
    langs.length && `Linguagens em comum: ${juntar(langs)}`,
    areas.length && `Mesmo tipo de projeto: ${juntar(areas)}`,
    temas.length && `Temas em comum: ${juntar(temas)}`,
    Math.min(...medidas) >= 0.6 && `Porte parecido: ${outro.perfil.repos} repositórios e ${outro.perfil.seguidores} seguidores`,
  ].filter((p): p is string => Boolean(p));

  return { pct: Math.round((soma / peso) * 100), pontos, partes };
}
