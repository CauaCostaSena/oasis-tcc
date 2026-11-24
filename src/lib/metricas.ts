import type { Analise } from "./analise";
import type { Perfil } from "./github";

export type ItemComparacao = { perfil: Perfil; analise: Analise };

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "Não informado");

// Métricas que a empresa pode marcar numa comparação. `numero` vira gráfico; `texto` vira linha da tabela.
export const METRICAS = {
  repos: { rotulo: "Repositórios públicos", curto: "Repositórios", numero: (i: ItemComparacao) => i.perfil.repos },
  seguidores: { rotulo: "Seguidores", curto: "Seguidores", numero: (i: ItemComparacao) => i.perfil.seguidores },
  estrelas: { rotulo: "Estrelas recebidas", curto: "Estrelas", numero: (i: ItemComparacao) => i.analise.estrelas },
  forks: { rotulo: "Forks recebidos", curto: "Forks", numero: (i: ItemComparacao) => i.analise.forks },
  reposAtivos: { rotulo: "Repositórios ativos (12 meses)", curto: "Repos ativos", numero: (i: ItemComparacao) => i.analise.reposAtivos },
  anosConta: { rotulo: "Tempo de conta (anos)", curto: "Anos de conta", numero: (i: ItemComparacao) => i.analise.anosConta ?? 0 },
  seguindo: { rotulo: "Seguindo", curto: "Seguindo", numero: (i: ItemComparacao) => i.perfil.seguindo },
  linguagens: { rotulo: "Linguagens" }, // gráfico próprio (mapa de calor)
  areas: { rotulo: "Tipo de projeto", texto: (i: ItemComparacao) => i.analise.areas.join(", ") || "Não identificado" },
  topicos: {
    rotulo: "Temas recorrentes",
    texto: (i: ItemComparacao) => i.analise.topicos.slice(0, 6).map(([t]) => t).join(", ") || "Nenhum tópico marcado",
  },
  ultimaAtividade: { rotulo: "Última atividade", texto: (i: ItemComparacao) => data(i.analise.ultimaAtividade) },
  localizacao: { rotulo: "Localização", texto: (i: ItemComparacao) => i.perfil.localizacao ?? "Não informada" },
  resumo: { rotulo: "Resumo dos repositórios", texto: (i: ItemComparacao) => i.analise.resumo },
  bio: { rotulo: "Biografia", texto: (i: ItemComparacao) => i.perfil.bio ?? "Sem biografia informada." },
} satisfies Record<string, { rotulo: string; curto?: string; numero?: (i: ItemComparacao) => number; texto?: (i: ItemComparacao) => string }>;

/** Identifica o mesmo conjunto de candidatos, em qualquer ordem. */
export const chaveLogins = (logins: string[]) => logins.map((l) => l.toLowerCase()).sort().join(",");

export type Metrica = keyof typeof METRICAS;
export const TODAS_METRICAS = Object.keys(METRICAS) as Metrica[];
export const METRICAS_PADRAO: Metrica[] = ["repos", "seguidores", "estrelas", "reposAtivos", "anosConta", "linguagens", "areas", "resumo"];

export const metricasValidas = (v: unknown): Metrica[] => {
  const lista = (Array.isArray(v) ? v : v ? [v] : []).map(String);
  const validas = TODAS_METRICAS.filter((m) => lista.includes(m)); // mantém a ordem da tabela, não a da URL
  return validas.length ? validas : METRICAS_PADRAO;
};
