import type { Metadata } from "next";
import { entrar } from "@/app/actions/auth";
import FormularioAuth from "@/components/FormularioAuth";

export const metadata: Metadata = { title: "Entrar — Oásis" };

export default function Login() {
  return (
    <FormularioAuth
      titulo="Entrar"
      subtitulo="Bem-vindo de volta ao Oásis."
      acao={entrar}
      botao="Entrar"
      campos={[
        { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
        { name: "senha", label: "Senha", type: "password", autoComplete: "current-password" },
      ]}
      rodape={{ texto: "Ainda não tem conta?", link: "Cadastrar empresa", href: "/cadastro" }}
    />
  );
}
