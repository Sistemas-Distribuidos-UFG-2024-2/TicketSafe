#!/bin/bash
echo "Executando o deploy... aguarde a mensagem DEPLOY FINALIZADO!"
# Aplicando o serviço de banco POSTGRES
kubectl apply -f ./deployments/db-deployments/postgres-deployment.yaml

# Aguarde até que o serviço de banco POSTGRES esteja ativo
kubectl wait --for=condition=available --timeout=60s deployment/postgres

# Aplicando o serviço REDIS
kubectl apply -f ./deployments/redis-deployments/redis-deployment.yaml
kubectl apply -f ./deployments/redis-deployments/redis-service.yaml

# Aguarde até que o serviço REDIS esteja ativo
kubectl wait --for=condition=available --timeout=60s deployment/redis

# Aplicando os serviços de aplicação dependentes  
kubectl apply -f ./deployments/app-deployments/auth-deployment.yaml
kubectl apply -f ./deployments/app-deployments/cancelworker-deployment.yaml
kubectl apply -f ./deployments/app-deployments/confirmworker-deployment.yaml
kubectl apply -f ./deployments/app-deployments/retryworker-deployment.yaml
kubectl apply -f ./deployments/app-deployments/sync-deployment.yaml
kubectl apply -f ./deployments/app-deployments/eventos-deployment.yaml
kubectl apply -f ./deployments/app-deployments/reserve-deployment.yaml
kubectl apply -f ./deployments/app-deployments/payment-deployment.yaml

echo "DEPLOY FINALIZADO! Execute os comandos abaixo para checar:"
echo "kubectl get deployments"
echo "kubectl get services"
echo "kubectl get pods"

