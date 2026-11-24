import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft, AtSign, BookMarked, BookmarkCheck, Briefcase, Building2, CalendarDays, ExternalLink, GitCompareArrows,
  GitFork, Globe, Lock, Mail, MapPin, Sparkles, Star, Users,
} from "lucide-react";
import BotaoFavorito from "@/components/BotaoFavorito";
import Carregando from "@/components/Carregando";
import FormAvaliacao, { BotaoExcluirAvaliacao } from "@/components/FormAvaliacao";
import { analisar } from "@/lib/analise";
import { db } from "@/lib/db";
import { LOGIN_VALIDO, obterPerfil, obterRepos, type Repo } from "@/lib/github";
import { favoritosDe } from "@/lib/preferencias";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Perfil do candidato — Oásis" };

const MAX_REPOS = 30;

export default function Candidato({ params }: PageProps<"/candidato/[login]">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Suspense fallback={<Carregando />}>
        <Conteudo params={params} />
      </Suspense>
    </main>
  );
}

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");
// O campo "blog" do GitHub é texto livre: só vira link se for http(s).
const linkSeguro = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

async function Conteudo({ params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  const empresa = await empresaAtual();
  if (!LOGIN_VALIDO.test(login)) notFound();

  let perfil, repos: Repo[];
  try {
    perfil = await obterPerfil(login);
    if (!perfil) notFound();
    repos = await obterRepos(login);
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_")) throw e; // notFound/redirect do Next
    return (
      <p role="alert" className="alerta">
        Não foi possível consultar o GitHub agora. Tente novamente em alguns instantes.
      </p>
    );
  }

  const analise = analisar(perfil, repos);
  const maisUsada = analise.linguagens[0]?.[1] ?? 1;
  const aviso = (await favoritosDe(empresa.id, [perfil.login])).get(perfil.login);
  // Públicos da empresa + os privados de quem está logado.
  const avaliacoes = await db.avaliacao.findMany({
    where: {
      empresaId: empresa.id,
      githubLogin: perfil.login,
      OR: [{ privada: false }, { recrutadorId: empresa.recrutador.id }],
    },
    orderBy: { criadoEm: "desc" },
    include: { recrutador: true },
  });

  const numeros: [number, string][] = [
    [analise.reposProprios, "repositórios próprios"],
    [analise.reposAtivos, "ativos em 12 meses"],
    [analise.forks, "forks recebidos"],
  ];

  return (
    <>
      <Link href="/painel" className="btn btn-ghost !px-3">
        <ArrowLeft size={16} /> Voltar ao início
      </Link>

      <header className="card mt-4 overflow-hidden">
        <div className="an-capa" />
        <div className="flex flex-col gap-5 p-6 sm:flex-row">
          <Image src={perfil.avatar} alt="" width={112} height={112} className="-mt-14 h-24 w-24 shrink-0 rounded-full border-4 border-surface sm:-mt-16 sm:h-28 sm:w-28" priority />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-3xl font-bold">{perfil.nome ?? perfil.login}</h1>
            <p className="text-muted">@{perfil.login}</p>
            <p className="mt-3 max-w-prose">{perfil.bio ?? <span className="text-muted">Sem biografia informada.</span>}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {perfil.disponivel && <li className="chip"><Briefcase /> Marcou “disponível para contratação”</li>}
              <li className="chip chip-neutro"><MapPin /> {perfil.localizacao ?? "Localização não informada"}</li>
              {perfil.empresa && <li className="chip chip-neutro"><Building2 /> {perfil.empresa}</li>}
              <li className="chip chip-neutro"><Users /> {perfil.seguidores} seguidores · segue {perfil.seguindo}</li>
              <li className="chip chip-neutro"><BookMarked /> {perfil.repos} repositórios públicos</li>
              {perfil.criadoEm && <li className="chip chip-neutro"><CalendarDays /> No GitHub desde {new Date(perfil.criadoEm).getFullYear()}</li>}
            </ul>
            {(perfil.email || perfil.site || perfil.twitter) && (
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                {perfil.email && (
                  <li>
                    <a href={`mailto:${perfil.email}`} className="inline-flex min-h-8 items-center gap-1.5 break-all hover:text-primary hover:underline">
                      <Mail size={14} /> {perfil.email}
                    </a>
                  </li>
                )}
                {perfil.site && (
                  <li>
                    <a href={linkSeguro(perfil.site)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1.5 break-all hover:text-primary hover:underline">
                      <Globe size={14} /> {perfil.site.replace(/^https?:\/\//i, "")}
                    </a>
                  </li>
                )}
                {perfil.twitter && (
                  <li className="inline-flex min-h-8 items-center gap-1.5">
                    <AtSign size={14} /> {perfil.twitter}
                  </li>
                )}
              </ul>
            )}
            {aviso && (
              <p className="selo-salvo mt-4">
                <BookmarkCheck size={12} /> {aviso}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-start gap-2">
              <BotaoFavorito login={perfil.login} favorito={Boolean(aviso)} rotulo />
              <Link href={`/comparar?c=${perfil.login}`} className="btn btn-outline">
                <GitCompareArrows size={16} /> Comparar
              </Link>
              <Link href={`/semelhantes?modelo=${perfil.login}`} className="btn btn-outline">
                <Sparkles size={16} /> Buscar semelhantes
              </Link>
              <a href={perfil.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                Abrir no GitHub <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Resumo dos repositórios</h2>
        <p className="subtitulo mt-1 flex items-center gap-1.5">
          <Sparkles size={14} className="shrink-0 text-primary" /> Resumo automático dos repositórios
        </p>
        <div className="card mt-4 p-6">
          <p className="max-w-prose leading-relaxed">{analise.resumo}</p>
          {analise.areas.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {analise.areas.map((a) => (
                <li key={a} className="chip">{a}</li>
              ))}
            </ul>
          )}
          <dl className="an-numeros mt-6 border-t border-border pt-5">
            <div>
              <dd className="display text-4xl font-bold text-primary">{analise.estrelas}</dd>
              <dt className="text-sm text-muted">estrelas recebidas</dt>
            </div>
            {numeros.map(([valor, rotulo]) => (
              <div key={rotulo}>
                <dd className="display text-2xl font-bold">{valor}</dd>
                <dt className="text-sm text-muted">{rotulo}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs text-muted">
            Texto montado pelo Oásis a partir dos 100 repositórios mais recentes (linguagens, tópicos, descrições e datas). Não
            usa IA e não mede competência.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Comentários e avaliações</h2>
        <p className="subtitulo mt-1">
          Ficam só no Oásis. Você escolhe se os outros recrutadores da empresa veem ou se fica só para você.
        </p>
        <div className="card mt-4 p-5">
          <FormAvaliacao login={perfil.login} />
        </div>
        {avaliacoes.length > 0 && (
          <ul className="mt-4 space-y-3">
            {avaliacoes.map((a) => (
              <li key={a.id} className="card p-4">
                <div className="flex items-start justify-between gap-2 text-xs text-muted">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {a.privada ? (
                      <span className="chip"><Lock /> Só você vê</span>
                    ) : (
                      <span className="chip chip-neutro"><Users /> Empresa</span>
                    )}
                    {a.nota && (
                      <span className="inline-flex items-center gap-0.5 text-amber-500" role="img" aria-label={`Nota ${a.nota} de 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={13} fill={n <= a.nota! ? "currentColor" : "none"} className={n <= a.nota! ? "" : "text-border"} aria-hidden />
                        ))}
                      </span>
                    )}
                    <span>{a.recrutador?.nome ?? "Perfil removido"}</span>
                    <span>· {a.criadoEm.toLocaleDateString("pt-BR")}</span>
                  </span>
                  {(a.recrutadorId === empresa.recrutador.id || a.recrutadorId === null) && <BotaoExcluirAvaliacao id={a.id} />}
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">{a.texto}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Linguagens nos repositórios públicos</h2>
        <p className="subtitulo mt-1">Mostra onde a pessoa publicou código, não o nível de domínio. Forks não são contados.</p>
        {analise.linguagens.length === 0 ? (
          <p className="card mt-4 p-5 text-sm text-muted">Nenhuma linguagem identificada nos repositórios próprios.</p>
        ) : (
          <ul className="card mt-4 space-y-3 p-5">
            {analise.linguagens.slice(0, 8).map(([nome, qtd], i) => (
              <li key={nome} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-3 text-sm sm:grid-cols-[8rem_1fr_2.5rem]">
                <span className="truncate font-medium">{nome}</span>
                <span className="barra">
                  <span style={{ width: `${(qtd / maisUsada) * 100}%`, animationDelay: `${i * 70}ms` }} />
                </span>
                <span className="text-right font-mono text-xs tabular-nums text-muted">{qtd}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Repositórios recentes</h2>
        {repos.length === 0 ? (
          <p className="card mt-4 p-5 text-sm text-muted">Nenhum repositório público.</p>
        ) : (
          <ul className="card an-linhas mt-4">
            {repos.slice(0, MAX_REPOS).map((r) => (
              <li key={r.url} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-primary hover:underline">
                    {r.nome}
                  </a>
                  {r.fork && <span className="chip chip-neutro">fork</span>}
                  {r.arquivado && <span className="chip chip-neutro">arquivado</span>}
                </div>
                {r.descricao && <p className="mt-1 max-w-prose text-sm text-muted">{r.descricao}</p>}
                {r.topicos.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1">
                    {r.topicos.slice(0, 5).map((t) => (
                      <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">{t}</span>
                    ))}
                  </p>
                )}
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span>{r.linguagem ?? "Linguagem não identificada"}</span>
                  <span className="inline-flex items-center gap-1"><Star size={12} /> {r.estrelas}</span>
                  <span className="inline-flex items-center gap-1"><GitFork size={12} /> {r.forks}</span>
                  <span>Atualizado em {data(r.atualizado)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
        {repos.length > MAX_REPOS && (
          <p className="mt-3 text-sm text-muted">
            Mostrando {MAX_REPOS} de {repos.length} repositórios. Veja o restante no GitHub.
          </p>
        )}
      </section>
    </>
  );
}
