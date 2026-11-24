import "server-only";
import { createHash } from "node:crypto";
import { Octokit } from "octokit";
import { db } from "./db";
import { montarQuery, ORDENS, type Filtros } from "./filtros";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Regra de nomes do GitHub: letras, números e hífens, até 39 caracteres.
export const LOGIN_VALIDO = /^[a-z\d](?:[a-z\d-]{0,38})$/i;

export const POR_PAGINA = 12;
// Poupa o limite de requisições do GitHub (compartilhado por todas as empresas); refine os filtros para ver mais.
export const MAX_PAGINAS = 10;
const TTL_MS = 24 * 60 * 60 * 1000;

// Só o que o GitHub devolveu; campos vazios continuam nulos, nunca inventados.
export type Perfil = {
  login: string;
  nome: string | null;
  avatar: string;
  bio: string | null;
  localizacao: string | null;
  repos: number;
  seguidores: number;
  seguindo: number;
  gists: number;
  empresa: string | null;
  site: string | null;
  email: string | null;
  twitter: string | null;
  disponivel: boolean | null; // "available for hire" marcado no perfil
  criadoEm: string | null;
  url: string;
};

/** Devolve do cache se tiver menos de 24h; senão consulta o GitHub e guarda, poupando o limite. */
async function comCache<T>(chave: string, buscar: () => Promise<T>, ttl = TTL_MS): Promise<T> {
  const c = await db.perfilCache.findUnique({ where: { githubLogin: chave } });
  if (c && Date.now() - c.atualizadoEm.getTime() < ttl) return c.dados as T;
  const dados = await buscar();
  await db.perfilCache.upsert({
    where: { githubLogin: chave },
    update: { dados: dados as object },
    create: { githubLogin: chave, dados: dados as object },
  });
  return dados;
}

export async function obterPerfil(login: string): Promise<Perfil | null> {
  try {
    // "p2:" = formato com os campos novos; entradas antigas do cache são ignoradas.
    return await comCache(`p2:${login}`, async () => {
      const { data: u } = await octokit.rest.users.getByUsername({ username: login });
      return {
        login: u.login,
        nome: u.name,
        avatar: u.avatar_url,
        bio: u.bio,
        localizacao: u.location,
        repos: u.public_repos,
        seguidores: u.followers,
        seguindo: u.following,
        gists: u.public_gists,
        empresa: u.company,
        site: u.blog || null,
        email: u.email,
        twitter: u.twitter_username ?? null,
        disponivel: u.hireable,
        criadoEm: u.created_at,
        url: u.html_url,
      };
    });
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null; // conta removida
    throw e;
  }
}

export type Repo = {
  nome: string;
  descricao: string | null;
  linguagem: string | null;
  estrelas: number;
  forks: number;
  atualizado: string | null;
  url: string;
  fork: boolean;
  topicos: string[];
  arquivado: boolean;
};

// shortcut: só os 100 repositórios mais recentes (1 página), basta para o perfil; paginar se precisar de mais.
export function obterRepos(login: string): Promise<Repo[]> {
  return comCache(`repos2:${login}`, async () => {
    const { data } = await octokit.rest.repos.listForUser({
      username: login,
      per_page: 100,
      sort: "pushed",
    });
    return data.map((r) => ({
      nome: r.name,
      descricao: r.description ?? null,
      linguagem: r.language ?? null,
      estrelas: r.stargazers_count ?? 0,
      forks: r.forks_count ?? 0,
      atualizado: r.pushed_at ?? null,
      url: r.html_url,
      fork: r.fork,
      topicos: r.topics ?? [],
      arquivado: r.archived ?? false,
    }));
  });
}

export async function buscarCandidatos(f: Filtros, pagina: number) {
  const q = montarQuery(f);
  // Cache curto: a página refaz a busca a cada ação (ex.: favoritar) e o GitHub limita a 30 buscas/min.
  const [, sort, order] = f.ordem ? ORDENS[f.ordem] : [];
  const chave = `busca:${createHash("sha1").update(`${q}|${f.ordem}|${pagina}`).digest("hex")}`;
  const { total, logins } = await comCache(
    chave,
    async () => {
      const { data } = await octokit.rest.search.users({ q, sort, order, per_page: POR_PAGINA, page: pagina });
      return { total: data.total_count, logins: data.items.map((i) => i.login) };
    },
    10 * 60 * 1000,
  );
  const perfis = (await Promise.all(logins.map(obterPerfil))).filter((p): p is Perfil => p !== null);
  return { total, paginas: Math.min(Math.ceil(total / POR_PAGINA), MAX_PAGINAS), perfis };
}
