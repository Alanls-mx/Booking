# FlexBook Backend API

API Backend robusta, multi-tenant e white-label para sistemas de agendamento SaaS. Construída com NestJS, Prisma e PostgreSQL.

## 🚀 Tecnologias

- **NestJS** (Framework Node.js)
- **TypeScript** (Linguagem)
- **Prisma** (ORM)
- **PostgreSQL** (Banco de Dados)
- **JWT** (Autenticação)
- **Swagger** (Documentação)

## 🏗️ Arquitetura e Estrutura

O projeto segue uma arquitetura modular, facilitando a manutenção e escalabilidade.

- `src/prisma`: Módulo global para conexão com banco de dados.
- `src/common`: Utilitários, Guards, Pipes e Interceptors globais.
- `src/modules`: Módulos de funcionalidade (Tenants, Users, Auth, Appointments, etc.).

### Multi-Tenancy

O sistema foi desenhado para ser multi-tenant (várias empresas usando a mesma instância).
Todas as entidades principais possuem um campo `tenantId` para isolamento lógico dos dados.

## 🛠️ Configuração e Execução

### 1. Pré-requisitos
- Node.js (v18+)
- PostgreSQL rodando

### 2. Instalação
```bash
cd backend
npm install
```

### 3. Configuração de Ambiente
Crie um arquivo `.env` na raiz da pasta `backend` (já criado automaticamente):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/flexbook"
JWT_SECRET="sua-chave-secreta"
```
*Ajuste a `DATABASE_URL` com as credenciais do seu banco local.*

### 4. Banco de Dados
Execute as migrações para criar as tabelas:
```bash
npx prisma migrate dev --name init
```

### 5. Executar
```bash
# Desenvolvimento
npm run start:dev
```

A API estará disponível em: `http://localhost:3000`
Documentação Swagger: `http://localhost:3000/api/docs`

## 📚 Documentação da API (Swagger)

Acesse `/api/docs` para ver todos os endpoints disponíveis e testá-los.

### Fluxo Básico de Teste:
1. **Tenants**: Crie um Tenant (Empresa) via `POST /tenants`. Copie o `id` gerado.
2. **Auth**: Registre um usuário ADMIN ou CLIENT via `POST /auth/register` (use o `tenantId`).
3. **Auth**: Faça login via `POST /auth/login` para obter o Token JWT.
4. **Services/Professionals**: Cadastre serviços e profissionais usando o Token.
5. **Appointments**: Crie agendamentos.
6. **Plans & Subscriptions**: Configure planos (créditos, intervalo) e crie assinaturas para clientes.
7. **Payments**: Ative métodos de pagamento (Stripe, PayPal, Mercado Pago) e acompanhe o histórico.
8. **Working Hours**: Configure horários de funcionamento no painel de integrações.
9. **Email Templates**: Ajuste templates transacionais (agendamento, cancelamento, reset de senha, pagamento).

## 📝 Observações Educacionais

- **DTOs**: Usados para validar dados de entrada.
- **Services**: Contêm a regra de negócio.
- **Controllers**: Lidam com as requisições HTTP.
- **Guards**: Protegem rotas que exigem autenticação.

---
Desenvolvido com ❤️ pela Trae AI.
