# Oásis

Plataforma web para empresas encontrarem, analisarem e compararem desenvolvedores a partir de dados públicos do GitHub. Projeto de TCC do curso de Desenvolvimento de Sistemas (SENAI).

## Funcionalidades

- Cadastro e login da empresa (uma conta por empresa)
- Busca de candidatos por linguagem, localização, repositórios e seguidores
- Perfil técnico com linguagens e repositórios públicos
- Favoritos, avaliações privadas e comparação lado a lado (até 3)
- Histórico de buscas e painel com o uso do plano

## Tecnologias

Next.js, TypeScript, Tailwind CSS, Prisma e MySQL. Dados do GitHub via Octokit.

## Como rodar

Requisitos: Node.js 22+ e MySQL em execução.

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL`, `GITHUB_TOKEN` e `SESSION_SECRET`
   (o token precisa só de leitura em repositórios públicos).
3. Crie o banco `oasis` no MySQL e aplique as tabelas: `npx prisma migrate deploy`
4. Rode: `npm run dev` e abra http://localhost:3000

## Observações

- Os dados do GitHub são públicos e podem estar incompletos; a plataforma apoia a análise e não substitui a avaliação humana.
- Os planos e limites (Gratuito, Profissional, Empresarial) são provisórios.