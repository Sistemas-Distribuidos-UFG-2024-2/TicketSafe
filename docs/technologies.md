Tecnologias do Projeto TicketSafe

1. **Back-End**

Essas tecnologias serão utilizadas para construir e gerenciar os serviços do lado do servidor e da lógica de negócios.

- *FastAPI*: Framework para construir as APIs REST, conhecido por sua alta performance e suporte a operações assíncronas.
- *Redis*: Gerenciamento de filas para processamento assíncrono, caching de dados e balanceamento de carga entre microsserviços.
- *Orquestrador de Contêineres (Kubernetes)*: Ferramenta para escalonamento automático e gerenciamento de contêineres dos microsserviços, garantindo alta disponibilidade.
- *Banco de Dados Distribuído*:
		- MongoDB ou Cassandra: Banco de dados distribuído para armazenamento de dados de eventos, ingressos e usuários, com suporte a replicação para garantir alta disponibilidade.
- *WebSockets/Server-Sent Events (SSE):* Utilizados para notificações em tempo real, enviando atualizações instantâneas sobre o status das compras e reservas para os usuários.
2. **Front-End**

O front-end será a interface direta para os usuários, permitindo a interação com o sistema.

- *Framework/Library JavaScript*:
		- React, Vue.js ou Angular: Frameworks populares para construção de interfaces web dinâmicas e interativas.
- *Estilização*:
		- CSS3/SASS: Estilos personalizados para criar uma interface responsiva.
		- Frameworks de Estilo: Tailwind CSS ou Bootstrap para agilidade e consistência no design.
- *Comunicação com Back-End*:
		- Axios ou Fetch API: Para fazer chamadas HTTP e se comunicar com as APIs REST do FastAPI.
- *Gerenciamento de Estado*:
		- Redux (React) ou Vuex (Vue.js): Para gerenciamento de estados globais, especialmente para controle de dados compartilhados entre diferentes componentes.
- *Notificações em Tempo Real*:
		- WebSockets/SSE: Para mostrar notificações instantâneas aos usuários, como confirmações de compra e atualizações de status.
3. **Infraestrutura e Suporte**

Tecnologias e ferramentas de suporte para garantir o monitoramento, segurança e gerenciamento de dados do sistema.

- *Monitoramento e Métricas*:
		- Prometheus: Ferramenta de monitoramento e coleta de métricas do sistema.
		- Grafana: Para visualização das métricas e criação de dashboards de monitoramento em tempo real.
- *Backup e Recuperação de Dados*:
		- Amazon S3 Glacier ou Ceph: Soluções de armazenamento para backup distribuído, com replicação de dados para recuperação em caso de falhas.
- *Balanceamento de Carga*:
		- Algoritmos como Round Robin ou Least Connections, implementados para distribuir o tráfego entre instâncias de microsserviços.
- *Segurança*:
		- Criptografia AES: Para proteção de dados sensíveis, como informações pessoais e de pagamento.
		- HTTPS: Para comunicação segura entre o front-end e o back-end..
