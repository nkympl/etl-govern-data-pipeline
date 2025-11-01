# Arquitetura do Projeto - ETL govern data pipeline

Este documento descreve a arquitetura técnica e o fluxo de dados do projeto **ETL govern data pipeline**, uma simulação do projeto de pipeline corporativo do qual fiz parte durante meu estágio no Ministério da Justiça e Segurança Pública para tratamento e integração de dados de compras públicas utilizando Node.js, JSON, PostgreSQL e Power BI.

---

## Módulo 1 - Estrutura Inicial do Projeto

### Objetivo

Definir a **arquitetura de diretórios e arquivos** que organiza o projeto de forma modular, clara e escalável.

### Descrição

O projeto é estruturado para refletir as etapas clássicas de um pipeline ETL (_Extract, Transform, Load_), bem como separar documentação, dados e scripts de forma lógica.

### Estrutura

```text
📦 etl-govern-data-pipeline
├── 📁 data
│ ├── 📁 raw → planilhas originais (entrada)
│ └── 📁 processed → dados limpos e padronizados
│
├── 📁 etl
│ ├── extract.js → código de extração dos arquivos Excel
│ ├── transform.js → código de limpeza e padronização
│ └── load.js → código de inserção no banco
│
├── 📁 db
│ └── schema.sql → script SQL de criação das tabelas
│
├── 📁 docs
│ └── arquitetura.md → documentação técnica
│
├── .env.example → variáveis de ambiente
├── package.json → dependências e scripts
└── README.md → guia geral do projeto
```

### Tecnologias instaladas

- `xlsx` → leitura e escrita de planilhas Excel
- `pg` → integração com PostgreSQL
- `dotenv` → gerenciamento de variáveis de ambiente

### Resultados

Ambiente inicial funcional com estrutura modular e dependências configuradas.

## Módulo 1.5 - Configuração de Ambiente

### Objetivo

Definir variáveis de ambiente que parametrizam a execução do pipeline sem expor dados sensíveis.

### Estrutura do `.env.example`

```bash
# Configurações do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=etl_govern_data_pipeline
DB_USER=postgres
DB_PASSWORD=senha_segura

# Caminhos internos
RAW_DATA_PATH=./data/raw
PROCESSED_DATA_PATH=./data/processed

# Ambiente de execução
NODE_ENV=development
```

### Observação sobre o ambiente de desenvolvimento

Este projeto foi criado e executado em ambiente **GitHub Codespaces**, e o banco de dados PostgreSQL roda em um contêiner Docker separado.  
Essa abordagem simula a estrutura de deploy em microserviços, onde o backend e o banco residem em contêineres distintos, comunicando-se via rede interna.

**Configuração Docker usada:**

```bash
docker run --name postgres -e POSTGRES_PASSWORD=123456 -p 5432:5432 -d postgres
```

### Nota sobre comunicação Node ↔ PostgreSQL no Codespaces

Durante os testes de conexão, verifiquei que o Codespaces executa o Node.js diretamente no ambiente base,
enquanto o PostgreSQL roda em um container Docker separado.

Isso significa que a comunicação entre o Node e o banco **ocorre via porta publicada no host (localhost)**, e não pela rede Docker interna.

**Configuração final adotada no .env:**

```bash
DB_HOST=localhost
DB_PORT=5432
```

## Módulo 2 - Extração dos Dados (E)

### Objetivo

Ler planilhas Excel contendo dados de compras públicas e converter seu conteúdo em objetos manipuláveis (JSON) dentro do Node.js.

### Descrição

A etapa de Extração (Extract) coleta dados brutos das fontes originais, neste caso, arquivos Excel localizados em `data/raw/`.
O script `etl/extract.js` lê cada planilha, seleciona a primeira aba e transforma as linhas em um array de objetos JavaScript.

### Ferramentas e métodos

- Biblioteca `xlsx`
- Funções principais:
  - `readFile()` - carrega a planilha;
  - `sheet_to_json()` - converte a aba em JSON.

### Fluxo lógico

```text
📁 data/raw/compras_sp.xlsx
   ↓
Node.js + XLSX → Leitura e Conversão
   ↓
Array de Objetos JSON → Saída no Console
```

### Módulo 3 - Etapa de Transformação (T)

Responsável por:

- Padronizar nomes de colunas (remoção de acentos e uso de snake_case);
- Calcular o campo `valor_total`;
- Gerar arquivos JSON limpos prontos para carga no banco de dados.

**Entrada:** planilhas Excel convertidas em JSON.  
**Saída:** arquivos JSON padronizados em `/data/processed`.

## Módulo 4 - Criação e Conexão com o Banco de Dados (L - Parte 1)

### Objetivo

Estabelecer a camada de persistência do pipeline ETL utilizando PostgreSQL, definindo o schema e testando a conexão com o Node.js.

### Estrutura criada

Arquivo `db/schema.sql` com definição da tabela `compras_publicas`:

- **id:** chave primária sequencial;
- **uf, orgao, item:** campos de identificação e descrição;
- **quantidade, valor_unitario:** campos numéricos com validação;
- **valor_total:** coluna gerada automaticamente pelo banco;
- **data_insercao:** registro de data e hora de inserção.

### Conexão

Arquivo `db/connection.js` implementa a integração Node ↔ PostgreSQL usando o módulo `pg` e variáveis de ambiente definidas em `.env`.

### Resultado esperado

Execução do script confirma a conexão com o banco exibindo:
