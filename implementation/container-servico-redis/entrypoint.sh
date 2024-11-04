#!/bin/bash

# Inicie o Redis em segundo plano com o arquivo de configuração
redis-server /usr/local/etc/redis/redis.conf &

# Aguarde o Redis estar disponível antes de continuar
until redis-cli -h localhost -p 6379 ping | grep -q PONG; do
  echo "Aguardando o Redis iniciar..."
  sleep 1
done

echo "Redis está ativo."

# Aplique as permissões corretas ao diretório /data após a inicialização do Redis
chmod -R 777 /data

# Verifique se o arquivo appendonly.aof existe
if [ ! -f /data/appendonly.aof ]; then
    echo "Arquivo de backup não encontrado. Iniciando sincronização com PostgreSQL."

    # Execute o script de sincronização
    if [ -f /usr/src/app/sync-script.js ]; then
        echo "Executando sync-script.js..."
        node /usr/src/app/sync-script.js 
    else
        echo "sync-script.js não encontrado!"
    fi

    echo "Sincronização concluída."
else
    echo "Arquivo de backup encontrado. Sincronização não é necessária."
fi

wait # Espera que o Redis continue ativo no container.
