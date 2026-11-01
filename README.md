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

O frontend React conversa com uma API REST em Express. A API autentica usuários com JWT, aplica autorização nas rotas privadas e acessa o MySQL por meio do Prisma. Ao iniciar, ela também cadastra os destinos iniciais e cria a conta administrativa configurada no arquivo local `.env`.

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
| Banco de dados | MySQL ou MariaDB |
| Testes do backend | Jest e Supertest |

## Requisitos

- Git.
- Node.js 22.12 ou superior e npm.
- MySQL ou MariaDB. O XAMPP pode ser usado para executar o MySQL localmente.

## Clonar o projeto

```bash
git clone https://github.com/KristianLopz/TravelBuddy.git
cd TravelBuddy
```

## Configurar o banco de dados

1. Inicie o MySQL pelo XAMPP (ou inicie seu serviço MySQL/MariaDB).
2. Crie um banco vazio chamado `travelbuddy`, por exemplo pelo phpMyAdmin.
3. Confirme a porta, o usuário e a senha usados pela sua instalação. No XAMPP local, é comum usar `localhost`, porta `3306`, usuário `root` e senha vazia, mas isso depende da configuração de cada máquina.

O Prisma cria e sincroniza as tabelas dentro do banco `travelbuddy`; ele não instala ou inicia o servidor MySQL e não cria o próprio banco. O schema está em [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

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

Edite `backend/.env` e ajuste `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` para sua instalação do MySQL. Troque também os valores de exemplo de `JWT_SECRET` e `ADMIN_PASSWORD` por valores próprios. O `.env` contém credenciais locais e não deve ser commitado ou compartilhado.

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

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173`. O frontend usa a API em `http://localhost:3000/api`; mantenha a API em execução enquanto utiliza a aplicação.

## Acessos

- Cadastro: `http://localhost:5173/cadastro`
- Login: `http://localhost:5173/login`
- Área administrativa: `http://localhost:5173/admin/destinos` (requer uma conta com perfil de administrador)

Use o e-mail definido em `ADMIN_EMAIL` e a senha que você escolheu em `ADMIN_PASSWORD` no seu `.env` para entrar como administrador. O modelo não contém uma senha padrão compartilhada.

## Testes e validações

Os testes de integração do backend usam o banco definido no `.env`. Com o MySQL ativo e as tabelas sincronizadas, execute:

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
