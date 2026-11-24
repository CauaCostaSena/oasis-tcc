// Filtros da busca: compartilhado entre servidor e navegador, sem dependências (testado em logica.test.mjs).

export const LINGUAGENS = [
  "Python", "JavaScript", "TypeScript", "Java", "C#", "PHP", "Go", "Rust",
  "Kotlin", "Swift", "Ruby", "C++", "C", "Dart",
];

// O campo "location" do GitHub é texto livre: cada região vira os termos mais usados (somados com OU).
export const REGIOES: Record<string, string[]> = {
  Brasil: ["Brazil", "Brasil"],
  Salvador: ["Salvador"],
  "São Paulo": ["São Paulo", "Sao Paulo"],
  "Rio de Janeiro": ["Rio de Janeiro"],
  Portugal: ["Portugal"],
  Espanha: ["Spain", "España"],
  Argentina: ["Argentina"],
  "Estados Unidos": ["USA", "United States"],
  Canadá: ["Canada"],
  "Reino Unido": ["UK", "United Kingdom"],
  Alemanha: ["Germany", "Deutschland"],
};

export const ORDENS = {
  seguidores: ["Mais seguidores", "followers", "desc"],
  repositorios: ["Mais repositórios", "repositories", "desc"],
  recentes: ["Contas mais novas", "joined", "desc"],
  antigas: ["Contas mais antigas", "joined", "asc"],
} as const;
export type Ordem = keyof typeof ORDENS;

export const CAMPOS_TEXTO = { login: "Usuário", name: "Nome", email: "E-mail" } as const;
export type CampoTexto = keyof typeof CAMPOS_TEXTO;

export type Filtros = {
  texto?: string; // procurado em `em` (padrão: usuário e nome)
  em: CampoTexto[];
  linguagens: string[]; // várias = qualquer uma delas
  regioes: string[]; // nomes de REGIOES ou texto livre; várias = qualquer uma delas
  minRepos?: number;
  maxRepos?: number;
  minSeguidores?: number;
  maxSeguidores?: number;
  minAnos?: number; // idade mínima da conta
  maxAnos?: number;
  patrocinavel?: boolean; // tem GitHub Sponsors
  ordem?: Ordem;
};

export const FILTROS_VAZIOS: Filtros = { em: [], linguagens: [], regioes: [] };

const MAX_LISTA = 5; // a consulta do GitHub tem limite de tamanho
const lista = (v: unknown) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]).map(String);
const inteiro = (v: unknown, max: number) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : undefined;
};

/** Limpa qualquer objeto (URL, JSON do banco) para um Filtros válido; o que não reconhece é descartado. */
export function normalizar(b: Record<string, unknown>): Filtros {
  const texto = String(b.texto ?? "").trim().replace(/["\\]/g, "").slice(0, 60);
  return {
    texto: texto || undefined,
    em: [...new Set(lista(b.em))].filter((c): c is CampoTexto => c in CAMPOS_TEXTO),
    linguagens: [...new Set(lista(b.linguagens))].filter((l) => LINGUAGENS.includes(l)).slice(0, MAX_LISTA),
    regioes: [...new Set(lista(b.regioes).map((r) => r.trim().replace(/["\\]/g, "").slice(0, 40)))]
      .filter(Boolean)
      .slice(0, MAX_LISTA),
    minRepos: inteiro(b.minRepos, 10_000),
    maxRepos: inteiro(b.maxRepos, 10_000),
    minSeguidores: inteiro(b.minSeguidores, 1_000_000),
    maxSeguidores: inteiro(b.maxSeguidores, 1_000_000),
    minAnos: inteiro(b.minAnos, 20),
    maxAnos: inteiro(b.maxAnos, 20),
    patrocinavel: b.patrocinavel === true || b.patrocinavel === "1" || undefined,
    ordem: String(b.ordem) in ORDENS ? (b.ordem as Ordem) : undefined,
  };
}

// Nomes curtos na URL.
const CHAVES = {
  texto: "q", em: "em", linguagens: "l", regioes: "loc", minRepos: "rmin", maxRepos: "rmax",
  minSeguidores: "smin", maxSeguidores: "smax", minAnos: "amin", maxAnos: "amax", patrocinavel: "sp", ordem: "ord",
} as const;

export function filtrosDaUrl(sp: Record<string, string | string[] | undefined>): Filtros {
  return normalizar(Object.fromEntries(Object.entries(CHAVES).map(([campo, chave]) => [campo, sp[chave]])));
}

export function filtrosParaParams(f: Filtros): URLSearchParams {
  const u = new URLSearchParams();
  for (const [campo, chave] of Object.entries(CHAVES)) {
    const v = f[campo as keyof Filtros];
    if (Array.isArray(v)) v.forEach((x) => u.append(chave, x));
    else if (v === true) u.set(chave, "1");
    else if (v) u.set(chave, String(v));
  }
  return u;
}

/** A busca precisa de pelo menos um destes para não varrer o GitHub inteiro. */
export const temCriterio = (f: Filtros) => Boolean(f.texto || f.linguagens.length || f.regioes.length);

/** Etiquetas legíveis dos filtros ativos (chips da barra de busca e histórico). */
export function rotulos(f: Filtros): string[] {
  const faixa = (min?: number, max?: number) => (min && max ? `${min}–${max}` : min ? `${min}+` : `até ${max}`);
  return [
    f.texto && `“${f.texto}”`,
    ...f.linguagens,
    ...f.regioes,
    (f.minRepos || f.maxRepos) && `${faixa(f.minRepos, f.maxRepos)} repositórios`,
    (f.minSeguidores || f.maxSeguidores) && `${faixa(f.minSeguidores, f.maxSeguidores)} seguidores`,
    (f.minAnos || f.maxAnos) && `conta de ${faixa(f.minAnos, f.maxAnos)} anos`,
    f.patrocinavel && "GitHub Sponsors",
    f.ordem && ORDENS[f.ordem][0],
  ].filter((r): r is string => Boolean(r));
}

/** Consulta da API de busca de usuários do GitHub. `hoje` entra por parâmetro para o teste ser estável. */
export function montarQuery(f: Filtros, hoje = new Date()): string {
  const faixa = (min?: number, max?: number) => (min && max ? `${min}..${max}` : min ? `>=${min}` : `<=${max}`);
  const ha = (anos: number) => new Date(hoje.getFullYear() - anos, hoje.getMonth(), hoje.getDate()).toISOString().slice(0, 10);
  const partes = ["type:user"];
  if (f.texto) partes.unshift(f.texto, `in:${(f.em.length ? f.em : ["login", "name"]).join(",")}`);
  for (const l of f.linguagens) partes.push(`language:"${l}"`);
  for (const r of f.regioes) for (const termo of REGIOES[r] ?? [r]) partes.push(`location:"${termo}"`);
  if (f.minRepos || f.maxRepos) partes.push(`repos:${faixa(f.minRepos, f.maxRepos)}`);
  if (f.minSeguidores || f.maxSeguidores) partes.push(`followers:${faixa(f.minSeguidores, f.maxSeguidores)}`);
  if (f.minAnos) partes.push(`created:<=${ha(f.minAnos)}`);
  if (f.maxAnos) partes.push(`created:>=${ha(f.maxAnos)}`);
  if (f.patrocinavel) partes.push("is:sponsorable");
  return partes.join(" ");
}
