# 🎯 Sistema de Gestão de Tarefas Colaborativo

Sistema completo de gestão de tarefas com autenticação, notificações em tempo real e histórico de auditoria. Desenvolvido com arquitetura de microserviços usando **NestJS**, **React**, **RabbitMQ** e **WebSocket**.

## 📋 Stack Tecnológica

### Frontend
- **React 18** + **TypeScript**
- **TanStack Router** - Roteamento type-safe
- **shadcn/ui** - Componentes UI
- **Tailwind CSS** - Estilização
- **React Hook Form** + **Zod** - Validação de formulários
- **Axios** - Cliente HTTP
- **Socket.io Client** - WebSocket

### Backend
- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **RabbitMQ** - Message broker
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Winston** - Logging estruturado
- **Swagger** - Documentação da API

### DevOps
- **Docker** + **Docker Compose**
- **Turborepo** - Monorepo tooling
- **pnpm** - Gerenciador de pacotes

---

## 🎯 Contexto & Objetivo

Construir um **Sistema de Gestão de Tarefas Colaborativo** com autenticação simples, CRUD de tarefas, comentários, atribuição e notificações. O sistema deve rodar em **monorepo** e expor uma **UI** limpa, responsiva e usável. O back‑end deve ser composto por **microserviços Nest** que se comunicam via **RabbitMQ**; o acesso HTTP externo passa por um **API Gateway** (Nest HTTP).

**O que queremos observar:**

* Organização, clareza e pragmatismo.
* Segurança básica (hash de senha, validação de entrada).
* Divisão de responsabilidades entre serviços.
* Qualidade da UI e DX (developer experience).

---

## 🧱 Requisitos Funcionais

### Autenticação & Gateway

* **JWT** com **cadastro/login** (email, username, password) e **proteção de rotas no API Gateway**.
---

## 🏗️ Arquitetura

### Microserviços

```
┌─────────────────┐
│   Frontend      │
│   (React/Vite)  │
│   :3000         │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  API Gateway    │
│  (NestJS HTTP)  │
│  :3001          │
└────┬─────┬──────┘
     │     │
     │     └─────────────┐
     │                   │
     ▼                   ▼
┌──────────────┐  ┌──────────────┐
│Auth Service  │  │Tasks Service │
│(NestJS µs)   │  │(NestJS µs)   │
│:3002         │  │:3003         │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
         ┌────────────┐
         │  RabbitMQ  │
         │  :5672     │
         └─────┬──────┘
               │
               ▼
      ┌──────────────────┐
      │Notifications Svc │
      │(NestJS µs + WS)  │
      │:3004             │
      └──────────────────┘
               │
               ▼ WebSocket
         [Navegador]
```

### Fluxo de Dados

1. **Frontend** → Requisições HTTP → **API Gateway**
2. **API Gateway** → RabbitMQ (RPC) → **Auth Service** / **Tasks Service**
3. **Tasks Service** → Publica eventos → **RabbitMQ**
4. **Notifications Service** → Consome eventos → Envia via **WebSocket** → **Frontend**

### Banco de Dados

- **PostgreSQL** compartilhado entre os microserviços
- Cada serviço tem suas próprias tabelas:
  - `auth-service`: `users`
  - `tasks-service`: `tasks`, `comments`, `task_history`, `task_users_user`
  - `notifications-service`: `notifications`

---

## 🚀 Como Rodar

### Pré-requisitos

- **Docker** e **Docker Compose**
- **pnpm** (para desenvolvimento local)
- **Node.js 20+**

### Com Docker (Recomendado)

```bash
# Clone o repositório
git clone <repo-url>
cd jungle-fullstack-challenge

# Suba todos os serviços
docker compose up -d

# Ou use os scripts helper
chmod +x docker.sh
./docker.sh start
```

**Serviços disponíveis:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:3001
- Swagger: http://localhost:3001/api
- Auth Service: http://localhost:3002
- Tasks Service: http://localhost:3003
- Notifications: http://localhost:3004
- RabbitMQ UI: http://localhost:15672 (admin/admin)
- PostgreSQL: localhost:5432 (postgres/password)

### Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Subir apenas infra (DB + RabbitMQ)
docker compose up -d db rabbitmq

# Em terminais separados, rodar cada serviço:
cd apps/auth-service && pnpm dev
cd apps/tasks-service && pnpm dev
cd apps/notifications-service && pnpm dev
cd apps/api-gateway && pnpm dev
cd apps/web && pnpm dev
```

### Scripts Docker Helper

```bash
./docker.sh build   # Reconstrói todas as imagens
./docker.sh start   # Inicia todos os serviços
./docker.sh stop    # Para e remove containers
./docker.sh logs    # Mostra logs de todos os serviços
./docker.sh clean   # Remove tudo (containers, volumes, imagens)
```

---

## 📡 Endpoints da API

### Autenticação

```http
POST /api/auth/register
Body: { name, email, username, password }

POST /api/auth/login
Body: { emailOrUsername, password }
Response: { user, accessToken, refreshToken }

POST /api/auth/refresh
Body: { refreshToken }
Response: { accessToken }

GET /api/auth/users
Headers: Authorization: Bearer <token>
```

### Tarefas

```http
GET /api/tasks?page=1&limit=10&status=TODO&priority=HIGH
Headers: Authorization: Bearer <token>

POST /api/tasks
Headers: Authorization: Bearer <token>
Body: { title, description, dueDate, priority, assignedUserIds }

GET /api/tasks/:id
PUT /api/tasks/:id
DELETE /api/tasks/:id

GET /api/tasks/:id/history?page=1&limit=10
# Retorna histórico de alterações (audit log)
```

### Comentários

```http
POST /api/tasks/:id/comments
Body: { content }

GET /api/tasks/:id/comments?page=1&limit=10
```

### WebSocket (Notificações)

```javascript
// Conectar ao WebSocket
const socket = io('http://localhost:3004', {
  auth: { token: '<accessToken>' }
});

// Eventos recebidos
socket.on('task:created', (data) => { /* ... */ });
socket.on('task:updated', (data) => { /* ... */ });
socket.on('task:assigned', (data) => { /* ... */ });
socket.on('comment:new', (data) => { /* ... */ });
```

---

## ✨ Funcionalidades Implementadas

### ✅ Autenticação
- [x] Registro de usuários com validação
- [x] Login com email ou username
- [x] JWT com access token (15min) e refresh token (7 dias)
- [x] Hash de senha com bcrypt
- [x] Guards JWT no API Gateway
- [x] Endpoint de refresh token

### ✅ Tarefas
- [x] CRUD completo de tarefas
- [x] Paginação e filtros (status, prioridade)
- [x] Atribuição a múltiplos usuários
- [x] 4 níveis de prioridade (LOW, MEDIUM, HIGH, URGENT)
- [x] 4 status (TODO, IN_PROGRESS, REVIEW, DONE)
- [x] Sistema de comentários com paginação
- [x] Histórico de alterações (Audit Log)

### ✅ Histórico/Audit Log
- [x] Rastreamento automático de alterações
- [x] 6 tipos de ações: CREATED, UPDATED, STATUS_CHANGED, ASSIGNED, UNASSIGNED, COMMENTED
- [x] Armazena diff das mudanças (before/after)
- [x] Enriquecimento com dados do usuário
- [x] Endpoint paginado `GET /api/tasks/:id/history`

### ✅ Notificações em Tempo Real
- [x] WebSocket com Socket.io
- [x] Autenticação JWT no WebSocket
- [x] Eventos: task:created, task:updated, task:assigned, comment:new
- [x] Persistência de notificações
- [x] Badge de contagem não lidas
- [x] Marcar como lida

### ✅ Arquitetura
- [x] Monorepo com Turborepo
- [x] Arquitetura de microserviços
- [x] RabbitMQ para comunicação entre serviços
- [x] API Gateway como ponto de entrada único
- [x] Docker Compose para orquestração
- [x] Health checks nos serviços

### ✅ Qualidade de Código
- [x] TypeScript em todo o projeto
- [x] ESLint configurado
- [x] Winston para logging estruturado
- [x] Testes unitários (services e controllers)
- [x] Validação de dados com class-validator/Zod
- [x] Documentação Swagger/OpenAPI

### ✅ Frontend
- [x] React 18 com TypeScript
- [x] TanStack Router com rotas tipadas
- [x] shadcn/ui + Tailwind CSS
- [x] Autenticação com context API
- [x] Interceptor axios para refresh token
- [x] Toast notifications
- [x] Formulários com validação
- [x] WebSocket para notificações em tempo real
- [x] Interface responsiva

---

---

## 🧠 Decisões Técnicas

### Arquitetura de Microserviços

**Por que RabbitMQ?**
- Comunicação assíncrona entre serviços
- RPC (Request-Reply) para operações síncronas via API Gateway
- Publish/Subscribe para eventos (notificações)
- Desacoplamento entre serviços

**API Gateway como Único Ponto de Entrada**
- Centraliza autenticação JWT
- Simplifica CORS e rate limiting
- Roteamento inteligente para microserviços
- Facilita versionamento da API

**PostgreSQL Compartilhado**
- Trade-off: Simplicidade vs Isolamento total
- Cada serviço tem suas próprias tabelas
- Facilita joins quando necessário (ex: enriquecimento de dados)
- Em produção: considerar bancos separados

### Autenticação

**JWT com Refresh Token**
- Access Token: 15 minutos (segurança)
- Refresh Token: 7 dias (UX)
- Refresh automático no frontend (interceptor axios)

**Guards no Gateway**
- Validação JWT centralizada
- Propaga userId via RabbitMQ para microserviços
- Evita duplicação de lógica de auth

### Audit Log

**Implementação Automática**
- Rastreamento transparente em operações do TasksService
- Calcula diff automático (before/after)
- 6 tipos de ações específicas
- Útil para compliance e debugging

### Frontend

**TanStack Router**
- Type-safe routing
- Code splitting automático
- Melhor DX que React Router

**Context API vs Zustand**
- Context API para auth (simples, built-in)
- Não há necessidade de state management complexo

**WebSocket Separado do HTTP**
- Notifications Service isolado
- Evita overhead no API Gateway
- Facilita escalar apenas a parte de WebSocket

### Docker

**Build Args para Variáveis VITE**
- Variáveis `VITE_*` precisam estar disponíveis em **build time**
- Build args no docker-compose passam valores para Dockerfile
- Solução para problema comum com Vite em containers

**Single-Stage Builds**
- Inicialmente tentei multi-stage (production)
- Simplificado para facilitar desenvolvimento
- Trade-off: Imagens maiores, mas builds mais rápidos

### Logging

**Winston Estruturado**
- Logs JSON para facilitar parsing
- Níveis: error, warn, info, debug
- Context tags para rastreamento distribuído
- Facilita integração futura com ELK/Datadog

---

## 🔍 Problemas Conhecidos & Melhorias Futuras

### Limitações Atuais

1. **PostgreSQL Compartilhado**
   - Em produção: separar banco de dados por serviço
   - Considerar event sourcing para histórico

2. **Sem Cache**
   - Redis para cache de sessões JWT
   - Cache de queries frequentes (lista de usuários)

3. **Testes**
   - Testes unitários básicos implementados
   - Faltam: testes E2E, testes de integração
   - Cobertura poderia ser maior

4. **Observabilidade**
   - Logs estruturados implementados
   - Faltam: métricas (Prometheus), tracing (Jaeger)
   - Health checks básicos (podem ser expandidos)

5. **Segurança**
   - HTTPS não configurado (usar nginx reverse proxy)
   - Rate limiting implementado, mas sem controle por usuário
   - Falta helmet.js para headers de segurança

### Melhorias Futuras

**Backend:**
- [ ] Implementar CQRS para separar reads/writes
- [ ] Event sourcing para audit log mais robusto
- [ ] GraphQL Gateway (alternativa ao REST)
- [ ] Implementar saga pattern para transações distribuídas
- [ ] Redis para cache e sessions
- [ ] Elasticsearch para busca full-text em tarefas
- [ ] Background jobs com Bull/BullMQ
- [ ] Versionamento da API (v1, v2)

**Frontend:**
- [ ] TanStack Query para cache de API
- [ ] Otimistic updates
- [ ] Offline-first com service workers
- [ ] Drag & drop para reordenar tarefas (Kanban)
- [ ] Dark mode
- [ ] Filtros avançados (data range, múltiplos status)
- [ ] Export de tarefas (PDF, CSV)

**DevOps:**
- [ ] CI/CD com GitHub Actions
- [ ] Kubernetes manifests
- [ ] Terraform para infraestrutura
- [ ] Monitoring com Grafana + Prometheus
- [ ] Log aggregation com ELK stack
- [ ] Multi-stage Docker builds para produção

**Segurança:**
- [ ] OAuth2/OIDC (Google, GitHub login)
- [ ] 2FA
- [ ] RBAC (roles: admin, user, viewer)
- [ ] Audit log também para auth service
- [ ] Rate limiting por usuário
- [ ] Input sanitization adicional

---

## ⏱️ Tempo de Desenvolvimento

| Tarefa | Tempo Estimado |
|--------|----------------|
| Setup inicial do monorepo | 1h |
| Auth Service (JWT, bcrypt, endpoints) | 3h |
| Tasks Service (CRUD, comentários) | 4h |
| Audit Log / TaskHistory | 2h |
| Notifications Service (WebSocket, eventos) | 3h |
| API Gateway (routing, guards) | 2h |
| Frontend (páginas, componentes, routing) | 6h |
| Integração WebSocket no frontend | 2h |
| Docker Compose e Dockerfiles | 4h |
| Debugging e ajustes (JSON.parse, env vars) | 3h |
| Winston logging e testes unitários | 3h |
| Documentação (README, Swagger) | 2h |
| **Total** | **~35h** |

---

## 🧪 Testes

### Executar Testes Localmente

```bash
# Todos os testes
pnpm test

# Testes de um serviço específico
cd apps/auth-service && pnpm test
cd apps/tasks-service && pnpm test

# Coverage
pnpm test:cov
```

### Testes Implementados

**Auth Service:**
- ✅ AuthService.register() - criação de usuário
- ✅ AuthService.login() - validação de credenciais
- ✅ AuthService.validateUser() - verificação de senha
- ✅ AuthController - endpoints

**Tasks Service:**
- ✅ TasksService.create() - criação de tarefa
- ✅ TasksService.update() - atualização de tarefa
- ✅ TasksService.findAll() - listagem com filtros
- ✅ TasksController - message patterns

**API Gateway:**
- ✅ Health check endpoint
- ✅ JWT Guard funcionamento

---

## 📊 Estrutura do Banco de Dados

### Users (auth-service)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tasks (tasks-service)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  status ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'),
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
  due_date TIMESTAMP,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE task_users_user (
  tasks_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  users_id UUID,
  PRIMARY KEY (tasks_id, users_id)
);
```

### Comments (tasks-service)
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Task History (tasks-service)
```sql
CREATE TABLE task_history (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  action ENUM('CREATED', 'UPDATED', 'STATUS_CHANGED', 'ASSIGNED', 'UNASSIGNED', 'COMMENTED'),
  user_id UUID NOT NULL,
  changes JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Notifications (notifications-service)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  user_id UUID NOT NULL,
  related_task_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📦 Scripts Disponíveis

```bash
# Monorepo
pnpm install          # Instala todas as dependências
pnpm build            # Build de todos os apps
pnpm dev              # Modo desenvolvimento (Turborepo)
pnpm lint             # ESLint em todos os projetos
pnpm test             # Testes unitários

# Serviços individuais
cd apps/auth-service
pnpm dev              # Desenvolvimento com hot reload
pnpm build            # Build de produção
pnpm start:prod       # Rodar build de produção
pnpm test             # Testes do serviço
pnpm migration:generate  # Gerar migration
pnpm migration:run    # Executar migrations

# Docker
./docker.sh build     # Build das imagens
./docker.sh start     # Start containers
./docker.sh stop      # Stop e remove containers
./docker.sh logs      # Ver logs de todos os serviços
./docker.sh clean     # Limpeza total
```

---

## 🌐 Variáveis de Ambiente

### API Gateway (.env)
```env
PORT=3001
JWT_SECRET=seu-secret-aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=seu-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
RABBITMQ_URL=amqp://admin:admin@localhost:5672
AUTH_QUEUE=auth_queue
TASKS_QUEUE=tasks_queue
NOTIFICATIONS_QUEUE=notifications_queue
EVENTS_QUEUE=events_queue
CORS_ORIGIN=http://localhost:3000
```

### Auth Service (.env)
```env
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=challenge_db
JWT_SECRET=seu-secret-aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=seu-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
RABBITMQ_URL=amqp://admin:admin@localhost:5672
AUTH_QUEUE=auth_queue
```

### Tasks Service (.env)
```env
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=challenge_db
RABBITMQ_URL=amqp://admin:admin@localhost:5672
TASKS_QUEUE=tasks_queue
EVENTS_QUEUE=events_queue
```

### Notifications Service (.env)
```env
PORT=3004
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=challenge_db
RABBITMQ_URL=amqp://admin:admin@localhost:5672
EVENTS_QUEUE=events_queue
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3004
```

---

## 🤝 Contribuindo

Este é um projeto de desafio técnico, mas sugestões são bem-vindas:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/melhoriaX`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona melhoriaX'`)
4. Push para a branch (`git push origin feature/melhoriaX`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto foi desenvolvido como parte de um desafio técnico.

```
.
├── apps/
│   ├── web/                     
│   │   ├── src/                  # React + TanStack Router + shadcn + Tailwind
│   │   ├── Dockerfile   
│   │   ├── .env.example          # variáveis de ambiente do frontend
│   │   ├── package.json              
│   ├── api-gateway/   
│   │   ├── src/                  # HTTP + WebSocket + Swagger
│   │   ├── Dockerfile
│   │   ├── .env.example          # variáveis do API Gateway (Nest.js)
│   │   ├── package.json
│   ├── auth-service/            
│   │   ├── src/                  # Nest.js (microserviço de autenticação)
│   │   ├── migrations/
│   │   ├── Dockerfile
│   │   ├── .env.example          # variáveis do serviço de autenticação
│   │   ├── package.json
│   ├── tasks-service/   
│   │   ├── src/                  # Nest.js (microserviço RabbitMQ)
│   │   ├── migrations/
│   │   ├── Dockerfile        
│   │   ├── .env.example          # variáveis do serviço de tarefas
│   │   ├── package.json
│   └── notifications-service/   
│       ├── src/                  # Nest.js (microserviço RabbitMQ + WebSocket)
│       ├── migrations/
│       ├── Dockerfile
│       ├── .env.example          # variáveis do serviço de notificações
│       ├── package.json                
├── packages/
│   ├── types/                   
│   ├── utils/                   
│   ├── eslint-config/           
│   └── tsconfig/                
├── docker-compose.yml
├── turbo.json
├── package.json
└── README.md
```

---

## 🧭 Front-end (exigências)

* **React.js** com **TanStack Router**.
* **UI:** mínimo 5 componentes com **shadcn/ui** + **Tailwind CSS**.
* **Páginas obrigatórias:**
  * Login/Register com validação (Pode ser um modal)
  * Lista de tarefas com filtros e busca
  * Detalhe da tarefa com comentários
* **Estado:** Context API ou Zustand para auth.
* **WebSocket:** conexão para notificações em tempo real.
* **Validação:** `react-hook-form` + `zod`.
* **Loading/Error:** Skeleton loaders (shimmer effect) e toast notifications.

> **Diferencial:** TanStack Query.

---

## 🛠️ Back-end (exigências)

* **Nest.js** com **TypeORM** (PostgreSQL).
* **JWT** com Guards e estratégias Passport.
* **Swagger** completo no Gateway (`/api/docs`).
* **DTOs** com `class-validator` e `class-transformer`.
* **Microserviços** Nest.js com **RabbitMQ**.
* **WebSocket** Gateway para eventos real-time.
* **Migrations** com TypeORM.
* **Rate limiting** no API Gateway (10 req/seg).

> **Diferencial:** health checks, Logging com Winston ou Pino, testes unitários.

---

## 🐳 Docker & Compose (sugerido)

```yaml
version: '3.8'

services:
  # Frontend React Application
  web:
    container_name: web
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
      target: development
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
    networks:
      - challenge-network
    command: npm run dev -- --host 0.0.0.0

  # API Gateway
  api-gateway:
    container_name: api-gateway
    build:
      context: .
      dockerfile: ./apps/api-gateway/Dockerfile
      target: development
    ports:
      - '3001:3001'
    volumes:
      - .:/app
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/api-gateway/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3001
    depends_on:
      db:
        condition: service_started
      rabbitmq:
        condition: service_started
    networks:
      - challenge-network

  # Auth Service
  auth-service:
    container_name: auth-service
    build:
      context: .
      dockerfile: ./apps/auth-service/Dockerfile
      target: development
    ports:
      - '3002:3002'
    volumes:
      - .:/app
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/auth-service/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3002
    depends_on:
      db:
        condition: service_started
      rabbitmq:
        condition: service_started
    networks:
      - challenge-network

  # Tasks Service
  tasks-service:
    container_name: tasks-service
    build:
      context: .
      dockerfile: ./apps/tasks-service/Dockerfile
      target: development
    ports:
      - '3003:3003'
    volumes:
      - .:/app
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/tasks-service/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3003
    depends_on:
      db:
        condition: service_started
      rabbitmq:
        condition: service_started
    networks:
      - challenge-network

  # Notifications Service
  notifications-service:
    container_name: notifications-service
    build:
      context: .
      dockerfile: ./apps/notifications-service/Dockerfile
      target: development
    ports:
      - '3004:3004'
    volumes:
      - .:/app
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/notifications-service/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3004
    depends_on:
      db:
        condition: service_started
      rabbitmq:
        condition: service_started
    networks:
      - challenge-network

  # Postgres Database
  db:
    image: postgres:17.5-alpine3.21
    container_name: db
    attach: false
    ports:
      - '5432:5432'
    networks:
      - challenge-network
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_USER: postgres
      POSTGRES_DB: challenge_db

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: rabbitmq
    attach: false
    restart: always
    ports:
      - '5672:5672'
      - '15672:15672'
    networks:
      - challenge-network
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin
    volumes: ['rabbitmq_data:/var/lib/rabbitmq']

volumes:
  postgres_data:
    driver: local
  rabbitmq_data:
    driver: local

networks:
  challenge-network:
    driver: bridge
```

---

## 📝 Documentação Esperada

No seu README, inclua:

1. **Arquitetura** (diagrama simples ASCII ou imagem)
2. **Decisões técnicas** e trade-offs
3. **Problemas conhecidos** e o que melhoraria
4. **Tempo gasto** em cada parte
5. **Instruções específicas** se houver

---

## 📚 Material de Referência

Para auxiliar no desenvolvimento deste desafio, disponibilizamos alguns conteúdos que podem ser úteis:

### Vídeos Recomendados

* **[Autenticação centralizada em microsserviços NestJS](https://www.youtube.com/watch?v=iiSTB0btEgA)** - Como implementar autenticação centralizada em uma arquitetura de microsserviços usando NestJS.
* **[Tutorial de Microservices com Nest.js em 20 Minutos](https://www.youtube.com/watch?v=C250DCwS81Q)** - Passo a passo rápido para criar e conectar microsserviços no NestJS.

Estes materiais são sugestões para apoiar seu desenvolvimento, mas sinta-se livre para buscar outras referências que julgar necessárias.

---

## ❓ FAQ

**Posso usar NextJS ao invés de React puro?**
Não. React com TanStack Router é obrigatório.

**Preciso implementar reset de senha?**
Não é obrigatório, mas seria um diferencial.

**WebSocket é obrigatório?**
Sim, para notificações em tempo real.

**Posso usar Prisma ou MikroORM ao invés de TypeORM?**
Não. TypeORM é requisito obrigatório.

---

## 📧 Suporte e Dúvidas

Caso tenha alguma dúvida sobre o teste ou precise de esclarecimentos:

* Entre em contato com o **recrutador que enviou este teste**
* Ou envie um e-mail para: **recruitment@junglegaming.io**

Responderemos o mais breve possível para garantir que você tenha todas as informações necessárias para realizar o desafio.

---

## 🕒 Prazo

* **Entrega:** 14 dias corridos a partir do recebimento

---

## 💡 Dicas Finais

* **Comece pelo básico:** Auth → CRUD → RabbitMQ → WebSocket.
* **Logs claros:** Facilita debug do fluxo assíncrono.

---

**Boa sorte!** 🚀
