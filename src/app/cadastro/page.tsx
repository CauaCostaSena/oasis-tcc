import type { Metadata } from "next";
import { cadastrar } from "@/app/actions/auth";
import FormularioAuth from "@/components/FormularioAuth";

export const metadata: Metadata = { title: "Cadastrar empresa — Oásis" };

export default function Cadastro() {
  return (
    <FormularioAuth
      titulo="Cadastrar empresa"
      subtitulo="Crie a conta da sua empresa e comece a buscar."
      acao={cadastrar}
      botao="Criar conta"
      campos={[
        { name: "nome", label: "Nome da empresa", autoComplete: "organization" },
        { name: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00" },
        { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
        { name: "senha", label: "Senha (mínimo 8 caracteres)", type: "password", autoComplete: "new-password" },
      ]}
      rodape={{ texto: "Já tem conta?", link: "Entrar", href: "/login" }}
    />
  );
}
