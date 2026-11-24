import { Suspense } from "react";
import BotaoTema from "@/components/BotaoTema";
import Logo from "@/components/Logo";
import SelecaoPerfil from "@/components/SelecaoPerfil";
import { empresaSemPerfil } from "@/lib/session";

export const metadata = { title: "Quem está usando? — Oásis" };

export default function Perfis() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-6 text-center">
      <div className="flex items-center justify-between">
        <Logo />
        <BotaoTema />
      </div>
      <div className="my-auto py-12">
        <Suspense fallback={<div className="esqueleto mx-auto h-56 max-w-md" />}>
          <Conteudo />
        </Suspense>
      </div>
    </main>
  );
}

async function Conteudo() {
  const empresa = await empresaSemPerfil();
  return (
    <>
      <h1 className="text-4xl font-bold sm:text-5xl">Quem está usando?</h1>
      <p className="subtitulo mt-3">Perfis de recrutador de {empresa.nome}</p>
      <SelecaoPerfil
        recrutadores={empresa.recrutadores.map((r) => ({ id: r.id, nome: r.nome }))}
        limite={empresa.plano.limiteRecrutadores}
      />
    </>
  );
}
