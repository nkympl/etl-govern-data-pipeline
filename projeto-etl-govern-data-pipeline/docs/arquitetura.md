# arquitetura do projeto - etl govern data pipeline

este documento descreve a arquitetura e o funcionamento do projeto etl govern data pipeline, uma simulação prática e em versão mais básica, inspirada em cenários reais de integração de dados corporativos durante meu estágio no ministério da justiça e segurança pública. o objetivo é demonstrar o funcionamento completo de um pipeline etl (extract, transform, load) com node.js, json, postgresql, power bi e, com o meu progresso nos estudos, uma api feita com next.js mais pra frente (se deus quiser haha).

### módulo 1 - estrutura inicial do projeto

### objetivo

criar a estrutura de diretórios e arquivos que organiza o projeto em etapas claras do etl.

```text
etl-govern-data-pipeline
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

### dependências principais

- `xlsx` → leitura e escrita de planilhas Excel
- `pg` → integração com PostgreSQL
- `dotenv` → gerenciamento de variáveis de ambiente

### módulo 1.5 - configuração de ambiente e docker no codespaces

### o que foi feito?

inicialmente o projeto rodava no github codespaces, e o banco postgresql estava em um container docker.

```bash
docker run --name postgres-db -e POSTGRES_PASSWORD=123456 -p 5432:5432 -d postgres
```

o node.js rodava direto no codespaces, então a conexão com o banco era feita pelo host `localhost` e porta `5432`.

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456

```

### dificuldade encontrada

durante os testes, o container do postgresql passou a apresentar erros de inicialização e travamentos no codespaces. o banco parava de responder e não mantinha os dados entre execuções.

isso mostrou a limitação do ambiente remoto para esse tipo de uso e levou à decisão de migrar o projeto para a máquina local, usando o postgresql instalado diretamente no sistema.

depois dessa migração, a conexão passou a funcionar corretamente e a pipeline ficou estável.

### módulo 2 - extração (extract)

### objetivo

ler as planilhas excel de compras públicas e convertê-las em json.

### funcionamento

- o script extract.js lê todos os arquivos .xlsx em data/raw/
- converte cada um para .json com o mesmo nome
- salva os arquivos json na mesma pasta

essa etapa foi adaptada para lidar com múltiplas planilhas de diferentes ufs, mantendo a execução simples.

### módulo 3 - transformação (transform)

### objetivo

limpar e padronizar os dados, transformando as chaves em snake_case e garantindo que os valores numéricos sejam válidos.

### funcionamento

- percorre todos os arquivos .json em data/raw
- aplica normalização nas chaves e converte quantidade e valor_unitario em número
- gera arquivos \_normalized.json em data/processed

### módulo 4 - criação e conexão do banco de dados

### objetivo

criar o banco de dados etl_govern_data_pipeline e a tabela compras_publicas no postgresql.

### estrutura da tabela

- id serial primary key
- uf, orgao, item
- quantidade, valor_unitario
- valor_total (gerado automaticamente: GENERATED ALWAYS AS (quantidade \* valor_unitario) STORED)
- data_insercao (timestamp)

### resultado

a conexão node ↔ postgresql foi validada com sucesso após a migração para o ambiente local.

### módulo 5 - carga (load)

### objetivo

inserir os dados processados no banco de forma segura e controlada.

### principais decisões

1. uso de transação (BEGIN, COMMIT, ROLLBACK)
2. exclusão do campo valor_total no insert, pois o postgresql calcula automaticamente
3. uso de lotes de inserção para performance
4. verificação de campos obrigatórios antes da carga

### evolução do módulo

inicialmente o script gerava erro de permissão e conflito de schema. isso foi resolvido ajustando as permissões no banco.
depois houve um erro com o campo valor_total, resolvido ao remover o cálculo do transform.js e deixar o banco gerar automaticamente.

posteriormente, o pipeline foi ajustado para:

- evitar duplicações (ON CONFLICT DO NOTHING)
- e depois, para refletir alterações de planilha (ON CONFLICT DO UPDATE)

### resultado

ao alterar dados em uma planilha e executar novamente o etl, o banco agora atualiza automaticamente quantidade, valor_unitario e data_insercao.

### módulo 6 - idempotência e monitoramento

### objetivo

garantir que o etl possa rodar várias vezes sem causar duplicações e registrar o histórico de execução.

### implementações

- uso de ON CONFLICT para prevenir duplicatas
- criação de constraint UNIQUE (uf, orgao, item)
- limpeza das duplicatas antigas no banco
- logs simples no console para indicar sucesso e erro

a tabela de controle etl_execucoes foi planejada mas ainda não implementada. a idempotência é garantida pela constraint e pelo tratamento de conflito.

### módulo 7 - integração com power bi

### objetivo

conectar o banco postgresql ao power bi e montar um painel simples.

### configuração

- conexão via modo importar (localhost, banco etl_govern_data_pipeline)
- tabela usada: compras_publicas
- visuais:
  - cartão com soma de valor_total
  - gráfico de barras (valor_total por uf)
  - gráfico de colunas (valor_total por orgao)
  - tabela detalhada
  - filtro por uf

### observações

- o modo importar precisa de atualização manual (botão atualizar)
- o modo directquery pode ser usado para dados em tempo real, mas é mais lento
- o painel foi montado de forma simples e funcional, com layout limpo e intuitivo

### módulo 8 - api do etl com next.js (a ser estudado)

### objetivo

disponibilizar o pipeline etl por meio de rotas http usando o sistema de api do next.js.

### script auxiliar - run-etl.js

foi criado um script simples para executar todo o pipeline de uma vez, sem precisar chamar os três scripts separadamente.
