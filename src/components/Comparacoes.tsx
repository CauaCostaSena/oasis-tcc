"use client";

import { useState, useTransition } from "react";
import { MessageSquarePlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { comentarComparacao, excluirComentario, excluirComparacao, salvarComparacao } from "@/app/actions/comparacoes";

/** Salva a comparação que está na tela; em caso de sucesso a ação já leva para a página dela. */
export function SalvarComparacao({ logins, metricas }: { logins: string[]; metricas: string[] }) {
  const [pendente, iniciar] = useTransition();
  return (
    <form
      className="card flex flex-wrap items-end gap-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const titulo = String(new FormData(e.currentTarget).get("titulo"));
        iniciar(async () => {
          const erro = await salvarComparacao(logins, metricas, titulo);
          if (erro) toast.error(erro);
        });
      }}
    >
      <label className="min-w-0 flex-1 text-sm font-medium">
        Salvar para a equipe
        <input name="titulo" maxLength={80} placeholder="Título (opcional). Ex.: Vaga mobile pleno" className="field mt-1" />
      </label>
      <button disabled={pendente} aria-busy={pendente} className="btn btn-primary">
        <Save size={16} /> {pendente ? "Salvando..." : "Salvar comparação"}
      </button>
      <p className="w-full text-xs text-muted">
        Fica na aba Comparações, visível a todos os recrutadores da empresa, com seu nome, dia e horário. Só você poderá
        excluí-la.
      </p>
    </form>
  );
}

/** Pede confirmação no próprio botão antes de apagar de vez. */
export function ExcluirComparacao({ id }: { id: number }) {
  const [confirmar, setConfirmar] = useState(false);
  const [pendente, iniciar] = useTransition();
  return (
    <button
      disabled={pendente}
      aria-busy={pendente}
      onBlur={() => setConfirmar(false)}
      onClick={() => {
        if (!confirmar) return setConfirmar(true);
        iniciar(async () => {
          const erro = await excluirComparacao(id);
          if (erro) toast.error(erro);
          else toast.success("Comparação excluída.");
        });
      }}
      className={`btn btn-outline hover:!border-danger hover:!text-danger ${confirmar ? "!border-danger !bg-danger-soft !text-danger" : ""}`}
    >
      <Trash2 size={16} /> {pendente ? "Excluindo..." : confirmar ? "Clique de novo para excluir" : "Excluir"}
    </button>
  );
}

export function ComentarComparacao({ id }: { id: number }) {
  const [pendente, iniciar] = useTransition();
  return (
    <form
      className="card space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const texto = String(new FormData(form).get("texto"));
        iniciar(async () => {
          const erro = await comentarComparacao(id, texto);
          if (erro) return void toast.error(erro);
          toast.success("Comentário adicionado.");
          form.reset();
        });
      }}
    >
      <label className="block text-sm font-medium">
        Novo comentário
        <textarea
          name="texto"
          rows={3}
          maxLength={2000}
          required
          placeholder="Ex.: pontos positivos de um candidato em relação ao outro."
          className="field mt-1"
        />
      </label>
      <button disabled={pendente} aria-busy={pendente} className="btn btn-primary">
        <MessageSquarePlus size={16} /> {pendente ? "Enviando..." : "Comentar"}
      </button>
    </form>
  );
}

export function ExcluirComentario({ id }: { id: number }) {
  const [pendente, iniciar] = useTransition();
  return (
    <button
      disabled={pendente}
      aria-busy={pendente}
      onClick={() =>
        iniciar(async () => {
          await excluirComentario(id);
          toast.success("Comentário excluído.");
        })
      }
      className="btn btn-ghost !px-2.5 text-xs hover:!bg-danger-soft hover:!text-danger"
    >
      <Trash2 size={14} /> {pendente ? "Excluindo..." : "Excluir"}
    </button>
  );
}
