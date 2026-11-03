# TravelBuddy

O **TravelBuddy** é uma aplicação web para ajudar pessoas a planejar viagens. O usuário informa um orçamento, consulta destinos compatíveis, visualiza detalhes, monta roteiros e salva destinos favoritos. O sistema também inclui um plano Premium simulado e uma área administrativa para gerenciar destinos.

Este projeto foi desenvolvido como trabalho acadêmico para a disciplina de Desenvolvimento, Análise e Projeto de Software.

## Como o sistema funciona

1. A pessoa cria uma conta ou entra com e-mail e senha.
2. Na área de orçamento, informa o valor disponível, a duração da viagem e a quantidade de pessoas.
3. O sistema compara o valor por pessoa com o custo estimado dos destinos e mostra sugestões.
4. A pessoa pode consultar os detalhes de um destino, gerar um roteiro e salvar ou remover favoritos.
5. A página Premium permite simular a contratação ou o cancelamento de uma assinatura. Não há cobrança real nem integração com um gateway de pagamento.
6. Administradores podem cadastrar, editar, ativar e desativar destinos.

O frontend React conversa com uma API REST em Express. A API autentica usuários com JWT, aplica autorização nas rotas privadas e acessa o PostgreSQL por meio do Prisma. Ao iniciar, ela também cadastra os destinos iniciais e cria a conta administrativa configurada nas variáveis de ambiente.

## Funcionalidades

- Cadastro, login e recuperação de senha.
- Sugestões de destinos conforme orçamento e quantidade de viajantes.
- Consulta de detalhes e pontos turísticos.
- Geração e consulta de roteiros.
- Cadastro e gerenciamento de destinos por administradores.
- Favoritos associados à conta do usuário.
- Assinatura Premium simulada.

## Casos de uso

| Código | Caso de uso | Prioridade |
| --- | --- | ---: |
| CU01 | Cadastrar usuário | 5 |
| CU02 | Realizar login | 5 |
| CU03 | Definir orçamento | 5 |
| CU04 | Receber sugestões de destinos | 5 |
| CU05 | Visualizar detalhes do destino | 4 |
| CU06 | Gerar roteiro de viagem | 4 |
| CU07 | Salvar viagem favorita | 3 |
| CU08 | Gerenciar assinatura Premium | 3 |
| CU09 | Cadastrar e gerenciar destinos (administrador) | 4 |

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS e React Router |
| Backend | Node.js, Express, Prisma, JWT e bcryptjs |
| Banco de dados | PostgreSQL |
| Testes do backend | Jest e Supertest |

## Requisitos

- Git.
- Node.js 22.12 ou superior e npm.
- PostgreSQL local ou um banco PostgreSQL hospedado.

## Clonar o projeto

```bash
git clone https://github.com/KristianLopz/TravelBuddy.git
cd TravelBuddy
```

## Configurar o banco de dados

1. Inicie seu servidor PostgreSQL local.
2. Crie um banco vazio chamado `travelbuddy`.
3. Configure `DATABASE_URL` no arquivo `.env` com a URL PostgreSQL local.

O Prisma cria e sincroniza as tabelas dentro do banco; ele não instala ou inicia o PostgreSQL e não cria o próprio banco. O schema está em [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma). Esta versão não se conecta mais ao MySQL; qualquer banco MySQL anterior permanece intacto, mas não será usado.

## Configurar e iniciar o backend

Abra um terminal na pasta do backend:

```bash
cd backend
npm install
```

Crie sua configuração local copiando o modelo:

```powershell
Copy-Item .env.example .env
```

Em macOS/Linux, use:

```bash
cp .env.example .env
```

Edite `backend/.env` e ajuste `DATABASE_URL` para sua instalação PostgreSQL. Troque também os valores de exemplo de `JWT_SECRET` e `ADMIN_PASSWORD` por valores próprios. O `.env` contém credenciais locais e não deve ser commitado ou compartilhado.

Gere o Prisma Client e crie/sincronize as tabelas no banco:

```bash
npm run prisma:generate
npm run db:push
```

Inicie a API:

```bash
npm run dev
```

A API ficará em `http://localhost:3000`. Para verificar se está ativa, abra `http://localhost:3000/health`; a resposta deve indicar o status `OK`.

Na primeira inicialização, o backend cadastra destinos de exemplo e cria a conta administrativa usando `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidos no `.env`.

## Configurar e iniciar o frontend

Em um **segundo terminal**, na raiz do repositório:

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173`. O frontend usa `http://localhost:3000/api` por padrão. Para apontar para outra API, defina `VITE_API_URL` no ambiente do frontend (por exemplo, em `frontend/.env.local`).

## Acessos

- Cadastro: `http://localhost:5173/cadastro`
- Login: `http://localhost:5173/login`
- Área administrativa: `http://localhost:5173/admin/destinos` (requer uma conta com perfil de administrador)

Use o e-mail definido em `ADMIN_EMAIL` e a senha que você escolheu em `ADMIN_PASSWORD` no seu `.env` para entrar como administrador. O modelo não contém uma senha padrão compartilhada.

## Testes e validações

Os testes de integração do backend usam o banco definido no `.env`. Com o PostgreSQL ativo e as tabelas sincronizadas, execute:

```bash
cd backend
npm test -- --runInBand
```

Para validar o frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Estrutura do repositório

```text
TravelBuddy/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── prisma/
│   ├── routes/
│   ├── services/
│   └── tests/
├── frontend/
│   ├── public/
│   └── src/
└── Banco de Dados/
```

O backend também contém um dump SQL de referência em `Banco de Dados/travelbuddy.sql`. Para uma instalação nova, prefira criar o banco vazio e usar `npm run db:push`; não importe o dump e execute `db:push` sobre as mesmas tabelas.

## Publicar gratuitamente

A aplicação usa três serviços: Supabase para PostgreSQL, Render para a API Express e Vercel para o frontend. O Supabase não hospeda diretamente o servidor Express nem o site Vite. Esta publicação começa com um banco online vazio; os destinos de exemplo são cadastrados pela API na inicialização.

1. **Supabase:** crie um projeto PostgreSQL. Em **Connect**, copie a URL de conexão do **Session pooler** (compatível com serviços IPv4 como Render). Não publique nem compartilhe essa URL: ela contém a senha do banco.
2. **Criar as tabelas:** temporariamente configure essa URL como `DATABASE_URL` em `backend/.env` e execute `npm run db:push` dentro de `backend`. Isso cria as tabelas no projeto Supabase. Depois, remova a URL do arquivo local ou substitua-a pela URL do seu PostgreSQL local.
3. **Vercel:** importe o repositório, defina `frontend` como diretório raiz e publique. O build é `npm run build` e a saída é `dist`. Anote o domínio `*.vercel.app` gerado.
4. **Render:** crie um Web Service usando o mesmo repositório, com `backend` como diretório raiz, comando de build `npm ci && npm run prisma:generate` e comando de início `npm start`. Configure as variáveis:
   - `DATABASE_URL`: URL do Session pooler copiada do Supabase.
   - `NODE_ENV`: `production`.
   - `FRONTEND_URL`: domínio Vercel completo, incluindo `https://`.
   - `JWT_SECRET`: segredo aleatório longo e privado.
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD`: credenciais próprias para a conta administrativa.
   - `MAIL_DISABLED`: `true` (e-mail não será enviado sem configurar SMTP).
5. **Conectar o frontend à API:** nas configurações do projeto Vercel, defina `VITE_API_URL` como `https://SEU-SERVICO.onrender.com/api` e faça um novo deploy. Use o domínio que o Render atribuir ao serviço.
6. Abra o domínio Vercel, teste cadastro/login e confira `https://SEU-SERVICO.onrender.com/health`.

Não coloque segredos em `VITE_*`, no código, no Git ou nesta conversa. Apenas `VITE_API_URL` é uma configuração pública. Os arquivos `.env` estão ignorados pelo Git.

**Limites do gratuito:** o Supabase Free inclui 500 MB de banco e pode pausar projetos após uma semana sem atividade; o serviço web gratuito do Render entra em suspensão após 15 minutos sem tráfego e pode levar cerca de um minuto para acordar. São boas opções para demonstração e projetos pessoais, não para disponibilidade garantida. Confira os termos atuais em [Supabase](https://supabase.com/pricing), [Render](https://render.com/docs/free) e [Vercel](https://vercel.com/pricing).
