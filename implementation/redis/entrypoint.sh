#!/bin/bash

# Inicie o Redis em segundo plano
redis-server &

# Aguarde o Redis estar disponível antes de rodar o script de sincronização
until redis-cli -h localhost -p 6379 ping | grep -q PONG; do
  echo "Aguardando o Redis iniciar..."
  sleep 1
done

echo "Redis está ativo, iniciando sincronização com PostgreSQL."

# Execute o script de sincronização
if [ -f /usr/src/app/sync-script.js ]; then
    echo "Executando sync-script.js..."
    node /usr/src/app/sync-script.js 
else
    echo "sync-script.js não encontrado!"
fi

echo "Sincronização concluída."
wait # Espera que o Redis continue ativo no container.
