import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Oásis — encontre desenvolvedores pelo GitHub",
  description:
    "Plataforma para empresas pesquisarem, compararem e organizarem desenvolvedores a partir de dados públicos do GitHub.",
};

// Aplica o tema salvo antes da primeira pintura, para não piscar o tema errado.
const TEMA = `try{if(localStorage.getItem("tema")==="claro")document.documentElement.dataset.tema="claro"}catch{}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: TEMA }} />
        {children}
        <Toaster position="bottom-right" closeButton />
      </body>
    </html>
  );
}
