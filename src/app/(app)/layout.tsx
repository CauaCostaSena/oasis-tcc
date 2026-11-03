import Link from "next/link";
import { sair } from "@/app/actions/auth";

const links = [
  ["/painel", "Painel"],
  ["/busca", "Buscar"],
  ["/favoritos", "Favoritos"],
  ["/comparar", "Comparar"],
  ["/historico", "Histórico"],
];

// Só links e o botão Sair: não lê a sessão aqui (cada página protege a si mesma).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <Link href="/painel" className="text-xl font-bold text-primary">
            Oásis
          </Link>
          <ul className="flex flex-1 flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
            {links.map(([href, nome]) => (
              <li key={href}>
                <Link href={href} className="hover:text-primary">
                  {nome}
                </Link>
              </li>
            ))}
          </ul>
          <form action={sair}>
            <button className="text-sm font-semibold text-muted hover:text-primary">Sair</button>
          </form>
        </nav>
      </header>
      {children}
    </>
  );
}
