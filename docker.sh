#!/bin/bash

# Script para gerenciar o ambiente Docker do projeto

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

case "$1" in
    start)
        print_info "Iniciando todos os serviços..."
        docker compose up -d
        print_success "Serviços iniciados!"
        echo ""
        print_info "Serviços disponíveis:"
        echo "  - Frontend:      http://localhost:3000"
        echo "  - API Gateway:   http://localhost:3001"
        echo "  - Swagger:       http://localhost:3001/api"
        echo "  - Auth Service:  http://localhost:3002"
        echo "  - Tasks Service: http://localhost:3003"
        echo "  - Notifications: http://localhost:3004"
        echo "  - RabbitMQ UI:   http://localhost:15672 (admin/admin)"
        echo "  - PostgreSQL:    localhost:5432 (postgres/password)"
        ;;
    
    build)
        print_info "Reconstruindo todas as imagens..."
        docker compose build --no-cache
        print_success "Imagens reconstruídas!"
        ;;
    
    rebuild)
        print_info "Parando serviços..."
        docker compose down
        print_info "Reconstruindo imagens..."
        docker compose build --no-cache
        print_info "Iniciando serviços..."
        docker compose up -d
        print_success "Serviços reconstruídos e iniciados!"
        ;;
    
    stop)
        print_info "Parando todos os serviços..."
        docker compose down
        print_success "Serviços parados!"
        ;;
    
    restart)
        print_info "Reiniciando serviços..."
        docker compose restart
        print_success "Serviços reiniciados!"
        ;;
    
    logs)
        if [ -z "$2" ]; then
            docker compose logs -f
        else
            docker compose logs -f "$2"
        fi
        ;;
    
    clean)
        print_warning "Isso irá remover todos os containers, volumes e redes!"
        read -p "Tem certeza? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Limpando ambiente Docker..."
            docker compose down -v --remove-orphans
            print_success "Ambiente limpo!"
        else
            print_info "Operação cancelada."
        fi
        ;;
    
    status)
        print_info "Status dos serviços:"
        docker compose ps
        ;;
    
    shell)
        if [ -z "$2" ]; then
            print_error "Especifique o serviço: ./docker.sh shell [service-name]"
            exit 1
        fi
        docker compose exec "$2" sh
        ;;
    
    db-migrate)
        print_info "Executando migrations..."
        docker compose exec auth-service pnpm run migration:run
        docker compose exec tasks-service pnpm run migration:run
        docker compose exec notifications-service pnpm run migration:run
        print_success "Migrations executadas!"
        ;;
    
    *)
        echo "Docker Manager Script"
        echo ""
        echo "Uso: ./docker.sh [comando]"
        echo ""
        echo "Comandos disponíveis:"
        echo "  start       - Inicia todos os serviços"
        echo "  build       - Reconstrói todas as imagens"
        echo "  rebuild     - Para, reconstrói e inicia os serviços"
        echo "  stop        - Para todos os serviços"
        echo "  restart     - Reinicia todos os serviços"
        echo "  logs [svc]  - Exibe logs (opcional: de um serviço específico)"
        echo "  clean       - Remove todos os containers, volumes e redes"
        echo "  status      - Mostra o status dos serviços"
        echo "  shell [svc] - Abre um shell no serviço especificado"
        echo "  db-migrate  - Executa as migrations do banco de dados"
        echo ""
        echo "Exemplos:"
        echo "  ./docker.sh start"
        echo "  ./docker.sh logs api-gateway"
        echo "  ./docker.sh shell auth-service"
        ;;
esac
