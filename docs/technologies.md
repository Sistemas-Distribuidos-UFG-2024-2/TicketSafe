Tecnologias do Projeto TicketSafe

1. **Back-End**

Essas tecnologias serão utilizadas para construir e gerenciar os serviços do lado do servidor e da lógica de negócios.

- *Node express*: Biblioteca para construção dos endpoints de API para acesso dos usuários.
- *Redis*: Gerenciamento de filas para processamento assíncrono, caching de dados e balanceamento de carga entre microsserviços.
- *Nginx*: Proxy para balanceamento de carga de acesso entre cada endpoint de serviços.
- *Postgresql*: Banco relacional durável para armazenamento de reservas de ingressos que tiveram seu pagamento confirmado.
- *Docker*: Orquestração dos containeres contendo os microsserviços da solução, utilizando docker-compose.

2. **Infraestrutura e Suporte**

Tecnologias e ferramentas de suporte para garantir o monitoramento, segurança e gerenciamento de dados do sistema.

- *Gatling*: Ferranenta utilizada para teste de carga no modelo RAMPING.
- *Apache Jmeter*: Ferramenta utilizada para teste de carga no modelo constante.
- *Postman*: Software para interface de conexão e teste dos endpoints de API, simulação de uso da solução manualmente.
- *Backup e Recuperação de Dados*:
		- Redis com RDB e Append only files a cada segundo (every sec).
- *Balanceamento de Carga*:
		- Algoritmos como Round Robin ou Least Connections, implementados para distribuir o tráfego entre instâncias de microsserviços usando o Nginx.
