# Guia de Desenvolvimento do TicketSafe

## Introdução ao Guia do Desenvolvimento

Este guia tem como objetivo fornecer uma visão geral do processo de desenvolvimento do sistema TicketSafe, detalhando as etapas, tecnologias e práticas recomendadas a serem seguidas durante o desenvolvimento.

## Estrutura do Projeto

O projeto TicketSafe é organizado nas seguintes pastas principais:

- **/discipline_exercises**: Contém atividades relacionadas à disciplina Sistemas Distribuídos, na qual o projeto em questão se baseia.
- **/docs**: Inclui documentação, diagramas e informações adicionais ou relevantes sobre o projeto.
- **/implementation**: Inclui o repositório com o ambiente atual de desenvolvimento da solução, necessário para deploy dos componentes criados ou que forem alterados.

## Configuração do Ambiente de Desenvolvimento

Para configurar o ambiente de desenvolvimento do TicketSafe, siga estas etapas:

### Configurando e inicializando o ambiente da solução localmente.

1. Inicialmente, acesse o diretório **/implementation/ambiente-nginx**, ele será o ambiente principal usado para as demonstrações da disciplina.
2. Certifique-se de ter o Docker instalado na sua máquina (versão 4.32 em diante).
3. Caso esteja no Windows, abra o Docker Desktop e ative o 'network hosting mode' navegando em **Settings -> Resources -> Network** - (Enable host networking).
4. Com o terminal aberto nesse mesmo diretório, digite o comando `docker compose up --build` para fazer o build dos containers e já iniciar o ambiente da solução.
5. Com todos os containers em execução, o Nginx já será capaz de fazer o balanceamento de carga e proxy das rotas de cada serviço. Na próxima sessão, será mostrado como é feito o acesso em cada rota.

## Rotas e Serviços

**Serviços:**

1. Serviço de banco 'postgres'
2. Serviço de banco cache 'redis' ```container-servico-redis```
3. Serviço de autenticação 'auth_service' ```container-servico-auth```
4. Serviço para gerenciamento de eventos 'evento_service' ```container-servico-eventos```
5. Serviço para simular confirmação de pagamento 'payment_service' ```container-servico-pagamento```
6. Serviço para solicitação de reserva de ingressos 'reserve01...02...03..' ```container-servico-reserva```
7. Serviço Worker para salvar uma requisição de reserva feita no 'reserve01' em uma fila ordenada ```container-servico-workerSaveReserve```
8. Serviço Worker para consumir a fila ordenada de solicitações de reserva e efetuar a reserva de fato ```container-servico-workerReserve```
9. Serviço Worker para consumir cancelamentos de reservas de ingressos 'worker_cancel' ```container-servico-workercancel```
10. Serviço Worker para consumir confirmações de reservas de ingressos 'worker_confirmation' ```container-servico-workerconfirm```
11. Serviço Worker para sincronização do banco em cache Redis com um banco relacional Postgresql ```container-servico-workersync```

**A declaração dos serviços no docker-compose inclui uma sessão `deploy:resources` para limitação de utilização de CPU e MEMÓRIA, a fim de controlar as simulações de teste de carga e escalonamento manual de serviços.**

**Rotas:**
```A solução possui 4 serviços expostos via ENDPOINTS para os usuários que são```:

### **auth_service:**
- **Comando curl rota POST /auth/cadastrar:**
``` 
   curl --location 'http://localhost/auth/cadastrar' \
--header 'Content-Type: application/json' \
--data '{
    "username": "seu-user",
    "password": "sua-senha"
 }'
```
- **Comando curl rota POST /auth/login:**
```
   curl --location 'http://localhost/auth/login' \
--header 'Content-Type: application/json' \
--data '{
    "username": "seu-user",
    "password": "sua-senha"
 }'
```
### **evento_service**
- **Comando curl rota POST /eventos/cadastrar:**
```
   curl --location 'http://localhost/eventos/cadastrar' \
--header 'Content-Type: application/json' \
--data '{
    "nome": "show_bruno_mars",
    "ingressosDisponiveis": "1000000"
 }'
```
- **Comando curl rota DELETE /eventos/excluir:**
```
   "curl --location --request DELETE 'http://localhost/eventos/excluir' \
--header 'Content-Type: application/json' \
--data '{
    "id": 1
 }'"
```
- **Comando curl rota PUT /eventos/atualizar:**
```
   curl --location --request PUT 'http://localhost/eventos/atualizar' \
--header 'Content-Type: application/json' \
--data '{
    "id": 1,
    "ingressosDisponiveis": 10
}
'
```
- **Comando curl rota GET /eventos/listar:**
```
   "curl --location 'http://localhost/eventos/listar'"
```
### **payment_service**
- **Comando curl rota POST /pagamentos/confirmar:**
```
   curl --location 'http://localhost/pagamentos/confirmar' \
--header 'Content-Type: application/json' \
--data '{
    "eventoId": "1", 
    "timestamp": "1730766936901",
    "userId": "cec44660-96c6-4d9b-b97e-05f42b27a925",
    "quantidade":"1"
}'
```
### **reserve_service**
- **Comando curl rota POST /ingressos/reservar:**
```
   curl --location 'http://localhost/ingressos/reservar' \
--header 'Content-Type: application/json' \
--data '{
    "eventoId": "1",
    "quantidade":"1",
    "userId": "cec44660-96c6-4d9b-b97e-05f42b27a925"
}'
```
- **Comando curl rota POST /ingressos/cancelar:**
```
   curl --location 'http://localhost/ingressos/cancelar' \
--header 'Content-Type: application/json' \
--data '{
    "eventoId": "1",
    "quantidade":"1",
    "userId": "cec44660-96c6-4d9b-b97e-05f42b27a925",
    "timestamp":"1731083967441"
}'
```

## Inclusão de novos serviços ou modificação dos serviços atuais
1.   Certifique de ter o NodeJs instalado e configurado.
2.   Caso queira modificar o código e esse processo inclua novas dependencias certifique de incluir essas dependencias no arquivo **package.json** encontrado na raiz do diretório do container.
3.   Após incluir as dependencias prossiga digitando o comando (npm install) na raiz do diretório do container, para que as novas dependencias sejam incluidas no arquivo **package-lock.json**.
4.   Para incluir um novo serviço crie um novo diretório com o nome do container (container-servico-nomeservico) e certifique que dentro dele você tenha a estrutura: ('nomeservico.js', 'Dockerfile', 'package-lock.json', 'package.json').
5.   Geralmente os primeiros arquivos criados serão : 'Dockerfile' e 'nomeservico.js', após os dois definidos você digita o comando (npm init) para iniciar a criação do 'package.json' e com isso incluir as dependencias necessárias e prosseguir com o comando (npm install), caso queira após a instalação remova o diretório ```node-modules```.
6.   Em processos de inclusão de novos serviços certifique de declarar tambem no arquivo **'docker-compose.yml'** encontrado na raiz do diretório **'ambiente-nginx'**, revise tambem o arquivo **'nginx.conf'** durante esse processo.


## Sessão guia para testes de carga com Gatling (Windows)
1.   Certifique de ter a versão 17 do Java Sdk instalada.
2.   Seguindo o caminho de diretórios ```/implementation/testes de carga/gatling-maven-plugin-demo-java-main/src/test/java/io/gatling/demo``` você encontrará o arquivo ReservaSimulation.java.
3.   Ele define um programa que simula um teste de carga com uma quantidade de requisições simultâneas, o teste dura em média 4 minutos e totaliza aproximadamente 54300 requisições dentro desse período.
4.   O objetivo principal do teste é demonstrar o comportamento da solução referente ao serviço crítico de Reserva que manipula a quantidade de ingressos disponíveis para cada cliente, sendo esse um problema clássico de concorrência e condição de corrida.
5.   Para executar o teste localmente abra um terminal no diretório raiz **/gatling-maven-plugin-demo-java-main** e execute os comandos abaixo para configuração de variáveis de ambiente:
## ```$Env:JAVA_HOME = "C:\Program Files\Java\jdk-17"```
## ```$Env:PATH = "$Env:JAVA_HOME\bin;$Env:PATH"```

**Após as variáveis definidas inclua nas variáveis de ambiente do Windows um novo Path:**
## ```C:\Users\seu-user\git\TicketSafe\implementation\testes de carga\apache-maven-3.9.9-bin\apache-maven-3.9.9\bin```

***Após isso execute o comando ```mvn clean install``` e aguarde a simulação de carga.***

***No diretório ```/testes de carga/resultados``` é mostrado alguns exemplos de capacidade de resposta e tempo de resposta da solução em dois cenários diferentes de escalonamento.***
```*Os números mostrados refletem uma maquina própria, a capacidade pode variar dependendo dos recursos disponíveis!```


## Sessão com alguns comandos utilizados durante o desenvolvimento e testes da solução.
1.   ```docker compose up --build``` (Compilar imagens e executar o compose da solução)
2.   ```docker compose down```  (Destruir containeres criados)
3.   ```docker volume prune```  (Remover volumes não utilizados por containeres)
4.   ```docker volume rm $(docker volume ls -q)```  (Remover todos os volumes)
5.   ```docker rmi $(docker images -q)```  (Remover todas as imagens de containeres)
6.   ```docker stats``` (Monitorar containeres/serviços ativos e consumindo recursos)
7.   ```docker exec -it nome-container /bin/bash``` (Acessar localmente o container)
8.   ```npm install``` 
9.   ```npm init``` 

## Sessão com alguns comandos do banco REDIS
1.   Dentro do container do redis execute **(redis-cli)** para acessar o cliente/banco redis no terminal.
2.   "keys *" (lista todas as chaves presentes no redis)
3.   **get key** (captura o valor de uma chave)


## Tecnologias Necessárias
   
   O projeto TicketSafe utiliza as seguintes tecnologias: 

   ### Backend

* Redis
* Nginx (proxy LoadBalancer)
* Postgresql
* Node JS
* Docker
* Gatling (java 17)

  ### Frontend

* 


   ### Orquestração e Implantação

* **Nginx**: Para fazer o proxy das requisições e balancear no modo padrão round-robin para os containeres ativos.

## Referências para Estudo

   Aqui estão algumas referências úteis para aprofundar o conhecimento nas tecnologias utilizadas no projeto:  
     
* [REDIS](https://redis.io/docs/latest/)
* [Nginx](https://nginx.org/)
* [Postgresql](https://www.postgresql.org/)
* [NodeJs](https://nodejs.org/pt)
* [Docker](https://www.docker.com/)
* [Gatling](https://gatling.io/open-source/)
