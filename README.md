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