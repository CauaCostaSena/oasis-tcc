// Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { filtrosDaUrl, filtrosParaParams, montarQuery, normalizar, rotulos, temCriterio } from "./filtros.ts";
import { analisar, similaridade } from "./analise.ts";

const HOJE = new Date("2026-11-14T12:00:00Z");

test("filtros: URL -> filtros -> URL não perde nada", () => {
  const url = "q=ana&em=name&l=Go&l=Rust&loc=Brasil&loc=Lisboa&rmin=5&rmax=50&smin=10&amin=3&sp=1&ord=seguidores";
  const f = filtrosDaUrl(Object.fromEntries([...new Set(new URLSearchParams(url).keys())].map((k) => {
    const v = new URLSearchParams(url).getAll(k);
    return [k, v.length > 1 ? v : v[0]];
  })));
  assert.equal(filtrosParaParams(f).toString(), new URLSearchParams(url).toString());
});

test("filtros: descarta linguagem desconhecida, aspas e números inválidos", () => {
  const f = normalizar({ linguagens: ["Go", "Cobol"], regioes: ['Bra"sil'], minRepos: "-3", texto: ' a"b ' });
  assert.deepEqual(f.linguagens, ["Go"]);
  assert.deepEqual(f.regioes, ["Brasil"]);
  assert.equal(f.minRepos, undefined);
  assert.equal(f.texto, "ab");
  assert.equal(temCriterio(normalizar({ minRepos: 5 })), false);
});

test("filtros: consulta do GitHub", () => {
  const f = normalizar({ texto: "ana", linguagens: ["Go", "Rust"], regioes: ["Brasil", "Lisboa"], minRepos: 5, maxRepos: 50, minAnos: 3, patrocinavel: true });
  assert.equal(
    montarQuery(f, HOJE),
    'ana in:login,name type:user language:"Go" language:"Rust" location:"Brazil" location:"Brasil" location:"Lisboa" repos:5..50 created:<=2023-11-14 is:sponsorable',
  );
  assert.deepEqual(rotulos(f), ["“ana”", "Go", "Rust", "Brasil", "Lisboa", "5–50 repositórios", "conta de 3+ anos", "GitHub Sponsors"]);
});

const repo = (nome, linguagem, extra = {}) => ({
  nome, linguagem, descricao: null, estrelas: 0, forks: 0, atualizado: "2026-06-01T00:00:00Z", url: "", fork: false, topicos: [], ...extra,
});
const pessoa = (login, repos, extra = {}) => {
  const perfil = { login, nome: null, repos: repos.length, seguidores: 50, criadoEm: "2020-01-01T00:00:00Z", ...extra };
  return { perfil, analise: analisar(perfil, repos, HOJE) };
};

test("análise: conta só repositórios próprios e monta o resumo", () => {
  const { analise } = pessoa("ana", [
    repo("flutter_todo", "Dart", { estrelas: 7, topicos: ["flutter"] }),
    repo("flutter_quiz", "Dart", { atualizado: "2022-01-01T00:00:00Z" }),
    repo("api-node", "JavaScript", { descricao: "API REST com Express" }),
    repo("copiado", "Go", { fork: true, estrelas: 99 }),
  ]);
  assert.deepEqual(analise.linguagens, [["Dart", 2], ["JavaScript", 1]]);
  assert.equal(analise.estrelas, 7);
  assert.equal(analise.reposAtivos, 2);
  assert.equal(analise.anosConta, 6);
  assert.deepEqual(analise.areas, ["Mobile", "Back-end e APIs"]);
  assert.match(analise.resumo, /publica principalmente em Dart \(67%\) e JavaScript \(33%\), com projetos de Mobile e Back-end e APIs/);
  assert.match(pessoa("vazio", []).analise.resumo, /não tem repositórios próprios públicos\.$/);
});

test("similaridade: igual = 100, sem nada em comum fica baixa, e aponta os pontos", () => {
  const dart = [repo("flutter_a", "Dart", { topicos: ["flutter"] }), repo("flutter_b", "Dart", { topicos: ["flutter"] })];
  const modelo = pessoa("modelo", dart);
  assert.equal(similaridade(modelo, pessoa("gemeo", dart)).pct, 100);

  const outro = similaridade(modelo, pessoa("outro", [repo("kernel", "C"), repo("driver", "C")], { seguidores: 90000 }));
  assert.ok(outro.pct < 25, `esperava < 25, veio ${outro.pct}`);
  assert.deepEqual(outro.pontos, []);

  const parecido = similaridade(modelo, pessoa("parecido", [...dart, repo("site", "HTML")]));
  assert.ok(parecido.pct > 60 && parecido.pct < 100, String(parecido.pct));
  assert.ok(parecido.pontos.includes("Linguagens em comum: Dart"));
});
