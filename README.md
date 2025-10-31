# etl-govern-data-pipeline

Este projeto simula um pipeline corporativo de tratamento e integração de dados (*ETL — Extract, Transform, Load*) aplicado a planilhas de **compras públicas**.  
Ele foi desenvolvido com o objetivo de demonstrar, de forma prática e didática, como automatizar o fluxo de dados em um ambiente similar ao corporativo, desde a coleta até a visualização em dashboards.


## Objetivo

Construir um fluxo automatizado capaz de:
1. Ler planilhas Excel com dados de compras de diferentes órgãos públicos;
2. Padronizar e transformar as informações;
3. Armazenar os dados em um banco PostgreSQL;
4. Disponibilizar os resultados para análise e visualização no Power BI.


## Tecnologias utilizadas

- **Node.js** — motor principal da aplicação  
- **JavaScript (ES6)** — linguagem de desenvolvimento  
- **ExcelJS / XLSX** — leitura e escrita de planilhas  
- **PostgreSQL** — banco de dados relacional  
- **Power BI** — camada de visualização e análise  
- **dotenv** — gerenciamento de variáveis de ambiente  


## Estrutura do projeto

```text
📦 projeto-etl-compras-publicas
├── 📁 data
│   ├── 📁 raw            → planilhas originais (entrada)
│   └── 📁 processed      → dados limpos e padronizados
│
├── 📁 etl
│   ├── extract.js        → código de extração dos arquivos Excel
│   ├── transform.js      → código de limpeza e padronização
│   └── load.js           → código de inserção no banco
│
├── 📁 db
│   └── schema.sql        → script SQL de criação das tabelas
│
├── 📁 docs
│   └── arquitetura.md    → documentação técnica do fluxo
│
├── .env.example          → variáveis de ambiente (ex: credenciais do banco)
├── package.json          → metadados e dependências do projeto
└── README.md             → guia principal do repositório
```


## Aprendizados deste projeto

Durante o desenvolvimento deste projeto no meu estágio junto ao Ministério da Justiça e Segurança Pública, pude aprender a:
- Organizar um projeto Node.js com propósito corporativo;
- Ler e manipular planilhas Excel com JavaScript;
- Criar processos ETL (Extract, Transform, Load);
- Estruturar e popular tabelas em PostgreSQL;
- Preparar dados para visualização em ferramentas de BI;
- Documentar um pipeline de dados completo para uso no meu portfólio técnico.


## Como executar

1. Clone o repositório:
   ```bash
   git clone https://github.com/nkympl/etl-govern-data-pipeline.git
   cd etl-govern-data-pipeline

2. Instale as dependências
   ```bash
   npm install

3. Crie um arquivo .env a partir do .env.example e configure as variáveis do banco de dados.

4. Execute o módulo de extração:
   ```bash
   node etl/extract.js


## Status do projeto

Módulo atual: Leitura de planilhas Excel (Extração)
Próximo módulo: Transformação e Padronização dos Dados

## Licença

Este projeto é de uso livre para fins educacionais e faz parte de um estudo independente de automação de processos de dados corporativos.
