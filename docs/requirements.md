### **Documento de Requisitos \- Sistema Distribuído de Gerenciamento de Ingressos para Eventos (TICKETSAFE)**

#### **1\. Histórico de Versões**

| Versão | Data | Descrição | Autor |
| :---- | :---- | :---- | :---- |
| *1.0* | *11/10/2024* | *Criação do documento de requisitos funcionais e não funcionais* | *Fabio* |
|  |  |  |  |
|  |  |  |  |

#### 


#### **2\. Introdução**

O presente documento detalha os requisitos de um sistema distribuído para a venda, reserva e gerenciamento de ingressos para diversos tipos de eventos. O sistema é projetado para atender uma grande quantidade de usuários simultâneos, com o objetivo de oferecer alta disponibilidade, escalabilidade, tolerância a falhas e robustez. Ele será implementado como um sistema web, garantindo fácil acesso por meio de navegadores, utilizando diversas tecnologias de sistemas distribuídos, como microsserviços, filas com Redis, escalonamento automático, e outras.


#### 2.1 *Objetivo do Sistema*

O objetivo do sistema é oferecer uma plataforma eficiente e escalável para venda, reserva e gerenciamento de ingressos de eventos. Ele deve permitir o gerenciamento completo de eventos por parte dos organizadores e facilitar o processo de compra de ingressos para os usuários finais.


#### 2.2 *Escopo*

O sistema oferece as seguintes funcionalidades principais:

* Venda de ingressos para eventos (concertos, shows, teatros, esportes, etc.).  
* Reserva de ingressos para diferentes categorias de usuários.  
* Gestão de eventos por parte dos organizadores (criação de eventos, gerenciamento de ingressos, etc.).  
* Notificações em tempo real para usuários (confirmações de compra, lembretes de eventos, etc.).  
* Sistema de backup e recuperação distribuídos utilizando REDIS.
* Funcionalidades de escalabilidade e alta disponibilidade.


2.3 *Definições, Acrônimos e Abreviações*

* Redis: Sistema de armazenamento em estrutura de dados em memória, usado para gerenciamento de filas e caching.


#### 

#### **3\. Visão Geral do Sistema**

O sistema será construído com uma arquitetura de microsserviços, utilizando tecnologias open-source. Ele oferecerá escalonamento automático, disponibilidade e tolerância a falhas. Abaixo estão as principais tecnologias e conceitos a serem utilizados:

* **Microsserviços**: Cada funcionalidade (venda, reserva, gerenciamento) será desenvolvida como um serviço independente, facilitando a manutenção e o desenvolvimento ágil.  
* **Redis para Filas**: Redis será utilizado para gerenciar filas de tarefas assíncronas e distribuição de carga entre os microsserviços, melhorando a eficiência do sistema.  
* **Notificações em Tempo Real**: Utilizando Canais de PUB/SUB do Redis para fornecer atualizações instantâneas aos usuários sobre o status de suas compras e reservas.  
* **Backup e Recuperação Simples**: RDB combinado com AOF (append only file), além de um banco POSTGRESQL durável para armazenamento de reservas confirmadas.


#### **4\. Requisitos Funcionais**

4.1 *Venda de Ingressos*

* **RF001**: O sistema deve permitir que os usuários comprem ingressos para diferentes eventos.  
* **RF002**: O sistema deve garantir que as transações sejam seguras e processadas em tempo real.  
* **RF003**: O sistema deve enviar notificações em tempo real para confirmar a compra.  
* **RF004**: O sistema deve fornecer uma interface de busca para encontrar eventos disponíveis.


4.2 *Reserva de Ingressos*

* **RF005**: O sistema deve permitir que os usuários reservem ingressos para eventos, mantendo as reservas válidas por um tempo específico (10 minutos).
* **RF006**: O sistema deve notificar os usuários sobre o status de suas reservas (confirmação, expiração, etc.).


4.3 *Gerenciamento de Eventos*

* **RF007**: O sistema deve permitir que os organizadores criem e gerenciem eventos, definindo o número de ingressos disponíveis, categorias e preços.  
* **RF008**: O sistema deve fornecer painéis de controle para visualizar e acompanhar as estatísticas de vendas e reservas de ingressos.


4.4 *Notificações em Tempo Real*

* **RF009**: O sistema deve enviar notificações em tempo real para informar os usuários sobre mudanças no evento, atualizações de status dos ingressos e lembretes de eventos.


4.5 *Backup e Recuperação Distribuídos*

* **RF010**: O sistema deve implementar um sistema de backup distribuído que garanta a recuperação rápida de dados críticos em caso de falhas.



#### **5\. Requisitos Não Funcionais**


5.1 *Escalabilidade*

* **RNF001**: O sistema deve ser capaz de suportar milhares de usuários simultâneos.  


5.2 *Disponibilidade*

* **RNF003**: O sistema deve garantir um alto nível de disponibilidade para atender a milhares de usuários simultaneamente, especialmente durante períodos de alta demanda, como a venda de ingressos para eventos populares.


5.3 *Tolerância a Falhas*

* **RNF004**: O sistema deve ser projetado para tolerar falhas em componentes individuais, garantindo que a funcionalidade crítica permaneça disponível, mesmo em caso de falhas.


5.4 *Segurança*

* **RNF005**: As transações devem ser protegidas por protocolos seguros, como HTTPS e criptografia dos dados sensíveis.  
* **RNF006**: O sistema deve garantir a segurança dos dados dos usuários e das transações.  
* **RNF007**: O sistema deve implementar autenticação e autorização para usuários e administradores.


5.5 *Desempenho*

* **RNF008**: As operações críticas (como a compra de ingressos) devem ser processadas em tempo real, com latência mínima.  
* **RNF009**: O sistema deve suportar pelo menos 10.000 usuários simultâneos.  
* **RNF010**: O tempo de resposta para a compra de ingressos deve ser inferior a 2 segundos.


5.6 *Usabilidade*

* **RNF011**: A interface do usuário deve ser intuitiva e responsiva, proporcionando uma boa experiência para os usuários.


5.7 *Manutenção*

* **RNF012**: O sistema deve ser projetado para facilitar a manutenção, permitindo que atualizações e modificações sejam realizadas de maneira eficiente e sem causar interrupções significativas nas operações.

	


#### **6\. Algoritmos, Tecnologias e Arquitetura**


6.1 *Arquitetura Baseada em Microsserviços*

* O sistema será desenvolvido utilizando arquitetura de microsserviços. Cada serviço será responsável por um conjunto específico de funcionalidades, como:  
  * Serviço de reservas.
  * Serviço de eventos
  * Serviço de pagamento
  * Serviço Redis.
  * Serviço Postgresql.
  * Serviço Worker Save Reserve.
  * Serviço Worker Reserve Waiting.
  * Serviço Worker Cancel.
  * Serviço Worker Confirm.
* Esses serviços serão independentes, facilitando a escalabilidade, manutenção e atualização do sistema.


6.2 *Filas de Mensagens*

* O Redis será utilizado como sistema de broker em memória (Redis Stream) para orquestrar as comunicações entre microsserviços, garantindo baixa latência na troca de mensagens e no processamento de tarefas críticas, como a compra e reserva de ingressos.  


6.3 *Notificações em Tempo Real*

* Redis PUB/SUB será utilizado para implementar notificações em tempo real para os usuários. Isso permitirá que as atualizações sejam enviadas diretamente para os usuários sem a necessidade de atualizações manuais.


6.4 *Backup e Recuperação Distribuídos*

* O sistema implementará backups do próprio Redis como RDB e AOF, além de salvar informações de reservas confirmadas em um banco relacional durável como POSTGRESQL.
* Snapshots regulares serão realizados e replicados em várias regiões para garantir a recuperação rápida em caso de falhas.


6.5 *Balanceamento de Carga*

* O sistema utilizará algoritmos de balanceamento de carga, como **Round Robin** ou **Least Connections**, para distribuir requisições entre servidores, garantindo que o sistema suporte alta demanda.


#### **7\. Considerações sobre Sistemas Distribuídos**

7.1 *Consistência Eventual*

* Em um sistema distribuído de grande escala, a consistência eventual será aplicada, especialmente em operações que não são críticas em tempo real, como atualizações de perfis de usuário ou visualizações de eventos. A consistência eventual garante que, em um determinado momento, todas as réplicas de dados estejam sincronizadas.


7.2 *Particionamento e Tolerância a Falhas*

* O sistema será capaz de lidar com falhas de rede e nós. O particionamento dos dados será realizado para garantir que, mesmo com a falha de um nó, outros nós possam processar as requisições sem interrupções.


7.3 *Replicações de Serviços e Dados*

* Cada serviço e seus dados críticos serão replicados em vários nós e regiões geográficas para garantir alta disponibilidade. Serviços de pagamento e venda de ingressos, por exemplo, serão replicados para garantir o processamento de compras mesmo em caso de falha de um nó ou região.


#### **8\. Conclusão**

Este documento define os requisitos funcionais e não funcionais para o desenvolvimento de um sistema distribuído para a venda, reserva e gerenciamento de ingressos. A arquitetura será baseada em microsserviços, com escalonamento automático, backup e recuperação distribuídos, e filas com Redis para orquestrar as operações. Isso tudo garantirá que o sistema possa atender à demanda crescente de usuários, com alta performance, disponibilidade e tolerância a falhas.

