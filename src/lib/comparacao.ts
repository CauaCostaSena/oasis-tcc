import "server-only";
import { LOGIN_VALIDO, obterPerfil, obterRepos, type Perfil } from "./github";

export const MAX_COMPARAR = 3;

export type ItemComparacao = {
  perfil: Perfil;
  linguagens: string[];
  estrelas: number;
  ultimaAtividade: string | null;
  repos: number;
};

/** Normaliza o que veio da URL: só logins válidos, sem repetir, no máximo MAX_COMPARAR. */
export function loginsDaUrl(v: string | string[] | undefined): string[] {
  const lista = Array.isArray(v) ? v : v ? [v] : [];
  return [...new Set(lista.map((l) => l.trim()).filter((l) => LOGIN_VALIDO.test(l)))].slice(0, MAX_COMPARAR);
}

// Estrelas e linguagens vêm dos 100 repositórios mais recentes e próprios (sem forks).
export async function montarComparacao(logins: string[]): Promise<ItemComparacao[]> {
  const itens = await Promise.all(
    logins.map(async (login) => {
      const perfil = await obterPerfil(login);
      if (!perfil) return null;
      const proprios = (await obterRepos(login)).filter((r) => !r.fork);
      const contagem = new Map<string, number>();
      for (const r of proprios) if (r.linguagem) contagem.set(r.linguagem, (contagem.get(r.linguagem) ?? 0) + 1);
      return {
        perfil,
        linguagens: [...contagem].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([l]) => l),
        estrelas: proprios.reduce((s, r) => s + r.estrelas, 0),
        ultimaAtividade: proprios.map((r) => r.atualizado).filter(Boolean).sort().at(-1) ?? null,
        repos: proprios.length,
      };
    }),
  );
  return itens.filter((i): i is ItemComparacao => i !== null);
}
