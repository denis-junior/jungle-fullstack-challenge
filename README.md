# Sistema de Gestão de Tarefas Colaborativo

Sistema completo de gestão de tarefas com autenticação JWT, notificações em tempo real via WebSocket e histórico de auditoria. Desenvolvido em arquitetura de microserviços com **NestJS**, **React**, **RabbitMQ** e **PostgreSQL**.

---

## 🚀 Como Rodar

### Com Docker (Recomendado)

```bash
# Clone o repositório
git clone <repo-url>
cd jungle-fullstack-challenge

# Suba todos os serviços
docker compose up -d

# Ou use o script helper
chmod +x docker.sh
./docker.sh start
```

**Serviços disponíveis:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:3001
- Swagger: http://localhost:3001/api/docs
- RabbitMQ UI: http://localhost:15672 (admin/admin)

### Desenvolvimento Local

```bash
pnpm install
docker compose up -d db rabbitmq

# Em terminais separados:
cd apps/auth-service && pnpm dev
cd apps/tasks-service && pnpm dev
cd apps/notifications-service && pnpm dev
cd apps/api-gateway && pnpm dev
cd apps/web && pnpm dev
```

---

### Tarefas

```http
GET /api/tasks?page=1&limit=10&status=TODO&priority=HIGH

## 🏗️ Arquitetura

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

**Fluxo:**
1. Frontend → HTTP → API Gateway
2. API Gateway → RabbitMQ (RPC) → Auth/Tasks Services
3. Tasks Service → Publica eventos → RabbitMQ → Notifications Service
4. Notifications Service → WebSocket → Frontend

**Banco de Dados:**
- PostgreSQL compartilhado
- Cada serviço tem suas próprias tabelas
- `auth-service`: users
- `tasks-service`: tasks, comments, task_history
- `notifications-service`: notifications

---

## 🧠 Decisões Técnicas e Trade-offs

### 1. PostgreSQL Compartilhado
**Decisão:** Um único banco PostgreSQL para todos os microserviços.
**Trade-off:** Simplicidade vs Isolamento
- ✅ Facilita desenvolvimento e deploy
- ✅ Joins diretos quando necessário (enriquecimento de dados)
- ❌ Acoplamento no nível de dados
- **Produção:** Separar bancos por serviço

### 2. RabbitMQ para Comunicação
**Decisão:** RPC para operações síncronas, Pub/Sub para eventos.
- ✅ Desacoplamento completo entre serviços
- ✅ Retry automático e dead-letter queues
- ✅ Permite escalar serviços independentemente
- ❌ Complexidade adicional vs HTTP direto
- ❌ Latência adicional em operações síncronas

### 3. API Gateway Centralizado
**Decisão:** Único ponto de entrada HTTP com autenticação JWT.
- ✅ Autenticação centralizada
- ✅ Rate limiting global
- ✅ Swagger em um único lugar
- ❌ Pode virar gargalo (mitigar com cache/load balancer)

### 4. WebSocket Separado
**Decisão:** Notifications Service isolado para WebSocket.
- ✅ Não sobrecarrega API Gateway
- ✅ Facilita escalar apenas conexões WS
- ✅ Isolamento de falhas
- ❌ Mais um serviço para gerenciar

### 5. Audit Log Automático
**Decisão:** TaskHistory com rastreamento transparente.
- ✅ Não esquece de registrar mudanças
- ✅ Diff automático (before/after)
- ❌ Performance: INSERT adicional em cada operação
- **Alternativa futura:** Event sourcing

### 6. Build Args para Vite no Docker
**Decisão:** Passar VITE_API_URL via build args.
- ✅ Variáveis disponíveis em build time
- ✅ Solução simples para problema comum
- ❌ Requer rebuild se mudar URL da API
- **Alternativa:** Runtime config com injeção de variáveis

### 7. Single-Stage Docker Builds
**Decisão:** Builds simples sem etapa de produção.
- ✅ Builds muito mais rápidos
- ✅ Facilita debugging
- ❌ Imagens maiores (~500MB vs ~200MB)
- **Produção:** Implementar multi-stage builds

### 8. Winston para Logging
**Decisão:** Logs estruturados em JSON.
- ✅ Facilita parsing e agregação
- ✅ Context tags para rastreamento
- ✅ Preparado para ELK/Datadog
- ❌ Menos legível em desenvolvimento (pode usar pretty-print)

---

## 🔍 Problemas Conhecidos e Melhorias

### Limitações Atuais

**1. Sem Cache**
- ❌ Todas as consultas batem no banco
- 💡 **Melhoria:** Redis para cache de sessões e queries frequentes

**2. Testes Incompletos**
- ✅ Testes unitários básicos (AuthService, TasksService)
- ❌ Faltam testes E2E e de integração
- ❌ Cobertura baixa (~30%)
- 💡 **Melhoria:** Testes E2E com Playwright, coverage >80%

**3. Observabilidade Básica**
- ✅ Logs estruturados com Winston
- ✅ Health checks simples
- ❌ Sem métricas (latência, throughput)
- ❌ Sem tracing distribuído
- 💡 **Melhoria:** Prometheus + Grafana + Jaeger

**4. Segurança**
- ✅ JWT com refresh token
- ✅ Bcrypt para senhas
- ✅ Rate limiting básico (10 req/s global)
- ❌ Sem HTTPS
- ❌ Rate limiting não é por usuário
- ❌ Sem helmet.js
- 💡 **Melhoria:** HTTPS, helmet, rate limit por IP/user, 2FA

**5. Performance**
- ❌ N+1 queries em algumas listagens
- ❌ Sem paginação cursor-based (usa offset)
- ❌ Frontend sem cache (TanStack Query)
- 💡 **Melhoria:** Eager loading, cursor pagination, optimistic updates

**6. DevOps**
- ✅ Docker Compose funcional
- ❌ Sem CI/CD
- ❌ Sem monitoramento de containers
- 💡 **Melhoria:** GitHub Actions, Kubernetes, Prometheus

### O que Melhoraria com Mais Tempo

**Backend (Prioridade Alta):**
- [ ] Redis para cache de sessões e queries
- [ ] Testes E2E e integração (coverage >80%)
- [ ] RBAC (roles: admin, manager, user)
- [ ] Soft delete em todas as entidades
- [ ] Migrations versionadas e documentadas
- [ ] Background jobs para emails/notificações pesadas

**Backend (Prioridade Média):**
- [ ] GraphQL Gateway como alternativa ao REST
- [ ] Event sourcing para audit log robusto
- [ ] Saga pattern para transações distribuídas
- [ ] Elasticsearch para busca full-text
- [ ] Rate limiting por usuário/IP
- [ ] Helmet.js e security headers

**Frontend (Prioridade Alta):**
- [ ] TanStack Query (cache, optimistic updates)
- [ ] Skeleton loaders consistentes
- [ ] Filtros avançados (datas, múltiplos filtros)
- [ ] Kanban board com drag & drop
- [ ] Dark mode

**Frontend (Prioridade Média):**
- [ ] Internacionalização (i18n)
- [ ] Export de tarefas (PDF, Excel)
- [ ] Offline-first com service workers
- [ ] Notificações push do navegador
- [ ] Gráficos de produtividade

**DevOps (Prioridade Alta):**
- [ ] CI/CD pipeline completo
- [ ] Multi-stage Docker builds
- [ ] Kubernetes manifests
- [ ] Monitoring (Grafana + Prometheus)
- [ ] Healthchecks avançados (liveness/readiness)

**DevOps (Prioridade Média):**
- [ ] Terraform para IaC
- [ ] Blue-green deployment
- [ ] Log aggregation (ELK stack)
- [ ] APM (Datadog/New Relic)
- [ ] Auto-scaling configurado

---

## ⏱️ Tempo Gasto

| Parte | Tempo | Observações |
|-------|-------|-------------|
| Setup do monorepo (Turborepo, estrutura) | 1h | Configuração inicial, packages shared |
| Auth Service (JWT, bcrypt, guards) | 3h | Registro, login, refresh token |
| Tasks Service (CRUD básico) | 2h | Entidades, DTOs, endpoints |
| Sistema de Comentários | 1h | Relacionamento, paginação |
| **Audit Log / TaskHistory** | 2h | Rastreamento automático, diff before/after |
| Notifications Service (WebSocket) | 3h | Socket.io, autenticação JWT, eventos |
| API Gateway (routing, Swagger) | 2h | Proxy RPC, guards centralizados |
| Frontend - Setup + Routing | 2h | TanStack Router, shadcn/ui |
| Frontend - Telas (Login, Tasks, Detail) | 4h | Componentes, formulários, validação |
| Integração WebSocket no Frontend | 2h | Context, toast, badge de notificações |
| **Docker Compose** | 2h | Dockerfiles, docker-compose.yml |
| **Debug Docker (Vite env vars, JSON.parse)** | 3h | Build args, validação localStorage |
| Winston Logging | 2h | Configuração em todos os serviços |
| Testes Unitários | 2h | AuthService, TasksService, controllers |
| Documentação (README, Swagger) | 2h | Este README, comentários inline |
| **TOTAL** | **~33-35h** | |

**Distribuição:**
- Backend: ~18h (55%)
- Frontend: ~8h (24%)
- DevOps/Docker: ~5h (15%)
- Testes/Docs: ~4h (12%)

---

## 📝 Instruções Específicas

### 1. Primeiro Acesso

Após subir os containers, acesse http://localhost:3000 e:
1. Clique em "Registrar"
2. Crie sua conta (os campos são validados)
3. Faça login automaticamente após registro
4. Crie sua primeira tarefa

### 2. Testar Notificações em Tempo Real

1. Abra http://localhost:3000 em **duas abas/navegadores**
2. Faça login com **dois usuários diferentes** (um em cada aba)
3. Na primeira aba: crie uma tarefa e atribua ao segundo usuário
4. Na segunda aba: veja a notificação aparecer em tempo real (badge no ícone)
5. Teste também: comentar em uma tarefa, mudar status

### 3. Ver Histórico de Auditoria

1. Entre em qualquer tarefa (clique na lista)
2. Role até o final da página
3. Veja todas as alterações registradas:
   - Quem criou
   - Quem atualizou (com diff do before/after)
   - Quem comentou
   - Quem atribuiu/desatribuiu usuários

### 4. Acessar Swagger

1. Acesse http://localhost:3001/api/docs
2. Clique em "Authorize" no canto superior direito
3. Faça login via `/auth/login` endpoint
4. Copie o `accessToken` do response
5. Cole no formato: `Bearer <accessToken>`
6. Agora pode testar todos os endpoints autenticados

### 5. Monitorar RabbitMQ

1. Acesse http://localhost:15672
2. Login: `admin` / `admin`
3. Veja as filas: `auth_queue`, `tasks_queue`, `events_queue`
4. Monitore mensagens sendo processadas em tempo real

### 6. Scripts Docker Úteis

```bash
# Ver logs em tempo real
./docker.sh logs

# Rebuild apenas um serviço
docker compose build web --no-cache
docker compose up -d web --force-recreate

# Resetar banco de dados (cuidado!)
docker compose down -v
docker compose up -d

# Verificar health dos serviços
docker compose ps
```

### 7. Desenvolvimento Local (Sem Docker)

Se preferir rodar localmente para hot reload mais rápido:

```bash
# Terminal 1: Infra
docker compose up -d db rabbitmq

# Terminal 2-5: Serviços
cd apps/auth-service && pnpm dev
cd apps/tasks-service && pnpm dev
cd apps/notifications-service && pnpm dev
cd apps/api-gateway && pnpm dev

# Terminal 6: Frontend
cd apps/web && pnpm dev
```

**Atenção:** Ajuste os `.env` de cada serviço para apontar para `localhost` ao invés dos nomes dos containers.

### 8. Troubleshooting Comum

**Erro: "Cannot connect to RabbitMQ"**
- Aguarde ~10s após `docker compose up` (health checks)
- Verifique: `docker compose ps` - RabbitMQ deve estar "healthy"

**Erro: Frontend mostra "undefined is not valid JSON"**
- Limpe localStorage: DevTools → Application → Local Storage → Clear
- Isso já foi corrigido, mas pode acontecer em builds antigos

**Erro: "Port 3000 already in use"**
- Algum serviço está usando a porta
- `docker compose down` ou mude a porta no docker-compose.yml

**Build do Docker muito lento?**
- Use `./docker.sh build` que já tem `--parallel`
- Primeira vez demora ~5-10min (npm install em 5 serviços)
- Builds subsequentes são mais rápidos (cache)

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
