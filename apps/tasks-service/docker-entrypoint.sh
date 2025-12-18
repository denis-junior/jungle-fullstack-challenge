#!/bin/sh
set -e

echo "Aguardando banco de dados estar pronto..."
until nc -z $DB_HOST $DB_PORT; do
  echo "Banco ainda não está pronto - aguardando..."
  sleep 2
done

echo "Banco de dados está pronto!"

echo "Executando migrations..."
npm run migration:run || echo "Migrations já executadas ou erro (continuando...)"

echo "Iniciando aplicação..."
exec npm run start:dev
