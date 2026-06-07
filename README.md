# 🏋️ SoloGym API

[![NestJS](https://img.shields.io/badge/NestJS-10.x-red?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-blue?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)](https://neon.tech/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📖 Sobre o Projeto

API desenvolvida para academias que operam no modelo **individual por reserva** - onde clientes reservam horários de 1 hora para treinar sozinhos, sem aglomeração.

**Contexto real:** Projeto desenvolvido para a academia do meu irmão, que está abrindo um espaço com essa modalidade. A API gerencia desde cadastro de clientes até reservas e controle administrativo.

## 🎯 Funcionalidades Completas

### 👤 Autenticação & Usuários
- ✅ Registro de novos clientes
- ✅ Login com JWT (token válido por 7 dias)
- ✅ Controle de roles: **ADMIN** (gestores) e **CLIENTE** (alunos)
- ✅ CRUD completo de usuários (apenas ADMIN)
- ✅ Hash de senhas com bcrypt

### 📅 Gestão de Horários (Schedules)
- ⏳ **EM DESENVOLVIMENTO** - Admin cria horários disponíveis (ex: 08h, 09h...22h)
- ⏳ Listagem de horários disponíveis por dia/semana
- ⏳ Bloqueio automático de horários ocupados

### 📝 Reservas (Reservations)
- ⏳ **EM DESENVOLVIMENTO** - Clientes reservam horários disponíveis
- ⏳ Regra: máximo 1 reserva por dia por cliente
- ⏳ Cancelamento com antecedência (configurável)
- ⏳ Histórico de reservas do cliente

### 🛡️ Segurança
- ✅ Senhas hasheadas (bcrypt, salt 10)
- ✅ Rotas protegidas com Guard JWT
- ✅ Controle de acesso por roles (ADMIN/CLIENTE)
- ✅ Validação de dados com class-validator

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| **Framework** | NestJS 10 | Estrutura modular, injeção de dependência |
| **ORM** | Prisma 7 | Type-safe, migrations poderosas |
| **Database** | PostgreSQL (Neon) | Serverless, escalável |
| **Auth** | JWT + Passport | Autenticação stateless |
| **Validação** | class-validator | Decoradores elegantes |
| **Hash** | bcrypt | Segurança para senhas |

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- PostgreSQL (local ou Neon)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/gym-flow-api.git
cd gym-flow-api

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL

# 4. Execute migrations
npx prisma migrate dev

# 5. Inicie o servidor
npm run start:dev