# Guia de Desenvolvimento do TicketSafe

## Introdução ao Guia do Desenvolvimento

   Este guia tem como objetivo fornecer uma visão geral do processo de desenvolvimento do sistema TicketSafe, detalhando as etapas, tecnologias e práticas recomendadas a serem seguidas durante o desenvolvimento.

## Estrutura do Projeto

   O projeto TicketSafe é organizado nas seguintes pastas principais:  
     
-  **/discipline\_exercises**: Contém atividades relacionadas a disciplina Sistemas Distribuídos, na qual o projeto em questão se baseia.
-   **/docs**: Inclui documentação, diagramas e informações adicionais ou relevantes sobre o projeto.
-   **/implementation**: Inclui o repositorio com o ambiente atual de desenvolvimento da solução, necessário para deploy dos componentes criados ou que forem alterados.

## Configuração do Ambiente de Desenvolvimento

   Para configurar o ambiente de desenvolvimento do TicketSafe, siga estas etapas:  
   
## Configurando o ambiente Oracle Cloud Infrastructure
1.   Crie um cadastro no ambiente da Oracle Cloud Infrastructure: https://www.oracle.com/br/cloud/ (R$ 1500 e 30 dias disponíveis de FREE TIER).
2.   Acesse a aba **My Profile** no canto direito e crie um **Auth Token** que será usado em varias fases nesse ambiente de teste.
3.   Pesquise na barra de pesquisas pelo serviço **Container Registry** e crie esse repositório, ele será usado para push das imagens docker contendo os micro-serviços.
4.   Pesquise na barra de pesquisas pelo serviço **Kubernetes Clusters (OKE)** e crie um cluster no modo **Quick Create**, selecione um **Public Endpoint e Public Workers** para facilitar o desenvolvimento inicialmente.
5.   Após o recurso cluster criado acesse-o localmente **(Access Cluster - Local Access)**, lá terá os comandos necessários para autenticação local no cluster.
6.   Após o acesso confirmado já será possivel utilizar os comandos **(kubectl)** para prosseguir com as configurações do cluster e posterior deploy dos serviços.

## Configurando e fazendo deploy de serviços na nuvem Oracle
1.   Em um terminal localmente execute o comando a seguir para criação do secret-key para pull de imagens do docker, caso esteja utilizando um container registry privado **(kubectl create secret docker-registry my-registry-secret --docker-server=gru.ocir.io --docker-username=container-registry-namespace/Default/you-username@gmail.com --docker-password='AUTH-TOKEN' --docker-email= YOUR-EMAIL)**
2.   Para fazer o login do docker no container remoto da Oracle execute o comando **(docker login gru.ocir.io)** ele irá pedir o username que deve seguir o formato: - username: container-registry-namespace/Default/username - senha: AUTH-TOKEN
3.   No diretorio **deployments** dentro de **implementation** você encontrará os arquivos usados para deploy dos serviços e tambem os nomes utilizados nas imagens docker (procure por image: no formato: **"gru.ocir.io/container-registry-namespace/service-name:latest"**) modifique nos arquivos de deploy para incluir o seu namespace.
4.   **Atenção:** no arquivo redis-deployment.yaml certifique de alterar além do nome da imagem alterar tambem o **OCID (volumeHandle)** referente ao seu blockvolume alocado na Oracle Cloud (esse volume será usado para persistir o backup do banco REDIS).
5.   Após os deployments configurados você deve agora configurar o arquivo **docker-compose.yaml** para que os caminhos das imagens correspondam ao caminho definido nos arquivos de deployment.
6.   A seguir já será possível iniciar o build das imagens dos containeres usando o arquivo docker-compose e os comandos **(docker-compose build)** e depois **(docker-compose push)**, após o push todas as imagens estarão disponíveis no seu Container Registry da Oracle.
7.   Com todas as imagens no seu Container Registry já é possível iniciar os deployments utilizando um script pronto de deploy que ja está configurado com o nome de **"script-deploy-solucao"** encontrado na pasta **implementation**.
8.   Execute o script e o aguarde terminar, se estiver em um ambiente Windows use o Powershell com o comando **("& "C:\Program Files\Git\bin\bash.exe" ./script-deploy-solucao.sh")**.
9.   Após esses passos concluidos com sucesso você já terá o cluster escalando seus serviços para Running e criando os Pods (containeres) separadamente dentro do seu ambiente, ao mesmo tempo estará sendo alocado os LoadBalancers para que os usuários acessem os serviços externamente.
10.   **Atenção:** no ambiente FREE TIER da Oracle tem um limite de 3 Loud Balancers, para essa solução teste decidimos manter o **evento-service** sobre um NODEPORT porta: 32000 que deve ser configurada dentro dos security policies dos nós publicos do cluster, com essa porta liberada o evento-service poderá ser acessado diretamente no **IP EXTERNO** de qualquer NÓ seguido da porta :32000.
11.   Os outros serviços essenciais terão suas portas e IPS alocados dinamicamente pelo Cluster, para acessar essas outras informações siga para a próxima sessão de comandos do ambiente Oracle.
   
## Sessão com comandos essenciais para navegação via Terminal no Ambiente Cloud da Oracle (OCI)
1.   **kubectl get pods** (retorna os pods criados para os respectivos serviços com seu respectivo status e nome).
2.   **kubectl get nodes** (retorna os nós alocados no seu node pool do Cluster com seu respectivo status e nome).
3.   **kubectl get services** (retorna todos os serviços que foram criados com os arquivos deployments, com seu tipo, nome e ip externo para acesso (serviços externos: auth-service, evento-service, pagamento-service e reserva-service), os demais serviços são para manter o ecosistema saudável e tolerante a falhas).
4.   **kubectl logs <nome-pod>** (acesso aos logs do serviço específico).
5.   **kubectl describe pod <nome-pod>** (acesso aos logs do container rodando aquele serviço).
6.   **kubectl exec -it <nome-pod> -- /bin/bash** (acessar o container diretamente para checagem de arquivos ou execução de outros comandos internos).
7.   **kubectl delete pod <nome-pod>** (Deletar um pod para forçar a recriação do mesmo pelo Cluster, ele irá refazer o pull da imagem docker).

## Sessão com alguns comandos do banco REDIS
1.   Dentro do container do redis execute **(redis-cli)** para acessar o cliente/banco redis.
2.   **"keys *"** (lista todas as chaves presentes no redis)
3.   **get key** (captura o valor de uma chave)


## Tecnologias Necessárias
   
   O projeto TicketSafe utiliza as seguintes tecnologias: 

   ### Backend

* Redis
* Cluster kubernetes (OCI)
* LoadBalancers
* Nodeports
* Postgresql
* Node JS
* Docker
* Deployments (.yaml)


   ### Frontend

* 


   ### Orquestração e Implantação

* **Kubernetes**: Para gerenciar os microsserviços e escalar automaticamente.  
* **Oracle Cloud**: Plataforma de nuvem onde o sistema será hospedado.  
* 

## Referências para Estudo

   Aqui estão algumas referências úteis para aprofundar o conhecimento nas tecnologias utilizadas no projeto:  
     
* [Kubernetes](https://kubernetes.io/pt-br/)
* [REDIS](https://redis.io/docs/latest/)
* 
