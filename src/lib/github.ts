import "server-only";
import { createHash } from "node:crypto";
import { Octokit } from "octokit";
import { db } from "./db";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Regra de nomes do GitHub: letras, números e hífens, até 39 caracteres.
export const LOGIN_VALIDO = /^[a-z\d](?:[a-z\d-]{0,38})$/i;

export const POR_PAGINA = 12;
// A busca do GitHub devolve no máximo 1000 resultados.
export const MAX_PAGINAS = Math.floor(1000 / POR_PAGINA);
const TTL_MS = 24 * 60 * 60 * 1000;

export type Filtros = {
  linguagem?: string;
  localizacao?: string;
  minRepos?: number;
  minSeguidores?: number;
};

// Só o que o GitHub devolveu; campos vazios continuam nulos, nunca inventados.
export type Perfil = {
  login: string;
  nome: string | null;
  avatar: string;
  bio: string | null;
  localizacao: string | null;
  repos: number;
  seguidores: number;
  url: string;
};

export function montarQuery(f: Filtros): string {
  const aspas = (s: string) => s.replace(/"/g, "");
  const partes = ["type:user"];
  if (f.linguagem) partes.push(`language:"${aspas(f.linguagem)}"`);
  if (f.localizacao) partes.push(`location:"${aspas(f.localizacao)}"`);
  if (f.minRepos) partes.push(`repos:>=${f.minRepos}`);
  if (f.minSeguidores) partes.push(`followers:>=${f.minSeguidores}`);
  return partes.join(" ");
}

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
    return await comCache(login, async () => {
      const { data: u } = await octokit.rest.users.getByUsername({ username: login });
      return {
        login: u.login,
        nome: u.name,
        avatar: u.avatar_url,
        bio: u.bio,
        localizacao: u.location,
        repos: u.public_repos,
        seguidores: u.followers,
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
};

// shortcut: só os 100 repositórios mais recentes (1 página), basta para o perfil; paginar se precisar de mais.
export function obterRepos(login: string): Promise<Repo[]> {
  return comCache(`repos:${login}`, async () => {
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
    }));
  });
}

export async function buscarCandidatos(f: Filtros, pagina: number) {
  const q = montarQuery(f);
  // Cache curto: a página refaz a busca a cada ação (ex.: favoritar) e o GitHub limita a 30 buscas/min.
  const chave = `busca:${createHash("sha1").update(`${q}|${pagina}`).digest("hex")}`;
  const { total, logins } = await comCache(
    chave,
    async () => {
      const { data } = await octokit.rest.search.users({ q, per_page: POR_PAGINA, page: pagina });
      return { total: data.total_count, logins: data.items.map((i) => i.login) };
    },
    10 * 60 * 1000,
  );
  const perfis = (await Promise.all(logins.map(obterPerfil))).filter((p): p is Perfil => p !== null);
  return { total, paginas: Math.min(Math.ceil(total / POR_PAGINA), MAX_PAGINAS), perfis };
}
