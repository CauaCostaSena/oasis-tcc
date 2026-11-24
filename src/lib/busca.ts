import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
import type { Filtros } from "./filtros";
import { buscarCandidatos } from "./github";

type Empresa = { id: number; plano: { limiteBuscasMes: number } };

// Consultas distintas por empresa por minuto; repetir a mesma (recarregar, favoritar) não conta.
// shortcut: memória de um só processo, com vários servidores mover para o banco.
const POR_MINUTO = 8;
const recentes = new Map<number, Map<string, number>>();

function excedeuRitmo(empresaId: number, consulta: string) {
  const agora = Date.now();
  const m = recentes.get(empresaId) ?? new Map<string, number>();
  for (const [k, t] of m) if (agora - t > 60_000) m.delete(k);
  recentes.set(empresaId, m);
  if (m.has(consulta)) return false;
  if (m.size >= POR_MINUTO) return true;
  m.set(consulta, agora);
  return false;
}

/**
 * Executa a busca respeitando o plano. Só a página 1 conta como busca nova e vai para o
 * histórico; repetir a mesma busca no mesmo minuto (recarregar a página) não gasta o limite.
 * Limite -1 = ilimitado.
 */
export async function executarBusca(empresa: Empresa, f: Filtros, pagina: number) {
  if (excedeuRitmo(empresa.id, JSON.stringify([f, pagina]))) {
    return { erro: "Muitas buscas em pouco tempo. Aguarde um minuto e tente novamente." };
  }
  if (pagina !== 1) return { resultado: await buscarCandidatos(f, pagina) };

  const minuto = Math.floor(Date.now() / 60_000);
  const chave = createHash("sha1").update(JSON.stringify([empresa.id, f, minuto])).digest("hex");

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
          linguagem: f.linguagens.join(", ") || null,
          localizacao: f.regioes.join(", ") || null,
          filtros: f, // o conjunto completo; as duas colunas acima servem só para consulta rápida
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
