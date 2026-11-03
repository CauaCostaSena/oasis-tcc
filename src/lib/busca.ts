import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
import { buscarCandidatos, type Filtros } from "./github";

type Empresa = { id: number; plano: { limiteBuscasMes: number } };

/**
 * Executa a busca respeitando o plano. Só a página 1 conta como busca nova e vai para o
 * histórico; repetir a mesma busca no mesmo minuto (recarregar a página) não gasta o limite.
 * Limite -1 = ilimitado.
 */
export async function executarBusca(empresa: Empresa, f: Filtros, pagina: number) {
  if (pagina !== 1) return { resultado: await buscarCandidatos(f, pagina) };

  const filtros = { minRepos: f.minRepos ?? null, minSeguidores: f.minSeguidores ?? null };
  const minuto = Math.floor(Date.now() / 60_000);
  const chave = createHash("sha1")
    .update(JSON.stringify([empresa.id, f.linguagem, f.localizacao, filtros, minuto]))
    .digest("hex");

  const repetida = await db.busca.findUnique({ where: { chave } });

  if (!repetida && empresa.plano.limiteBuscasMes >= 0) {
    const agora = new Date();
    const usadas = await db.busca.count({
      where: {
        empresaId: empresa.id,
        criadoEm: { gte: new Date(agora.getFullYear(), agora.getMonth(), 1) },
      },
    });
    if (usadas >= empresa.plano.limiteBuscasMes) {
      return { erro: `Você atingiu o limite de ${empresa.plano.limiteBuscasMes} buscas deste mês no seu plano.` };
    }
  }

  const r = await buscarCandidatos(f, pagina);
  if (!repetida) {
    try {
      await db.busca.create({
        data: {
          empresaId: empresa.id,
          linguagem: f.linguagem ?? null,
          localizacao: f.localizacao ?? null,
          filtros,
          total: r.total,
          chave,
        },
      });
    } catch (e) {
      // P2002: outra requisição idêntica gravou primeiro (corrida); a busca já foi contada.
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  return { resultado: r };
}
