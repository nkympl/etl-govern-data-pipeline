// importar módulos necessários fs, path, pg
const { log } = require("console");
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

// Carrega as variáveis do arquivo .env
require("dotenv").config();

// criar cliente do pg usando dados do .env
const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ETAPA 1: LER SCHEMA SQL (SÍNCRONA)

// definir caminho para o arquivo schema.sql
const schemaPath = path.join(__dirname, "../db/schema.sql");

// abrir e ler o arquivo schema.sql
let sqlContent = null;

try {
  sqlContent = fs.readFileSync(schemaPath, "utf8");
  console.log("Arquivo lido com sucesso.");
} catch (readError) {
  console.error("\nFalha ao ler o arquivo schema.sql.");
  if (readError.code === "ENOENT") {
    console.error(`Caminho não encontrado: ${schemaPath}`);
  } else {
    console.error(readError.message);
  }
  process.exit(1);
}

// ETAPA 2: LER ARQUIVOS JSON E VALIDAR DADOS (SÍNCRONA)

// definir caminho da pasta /data/processed
const dataProcessed = path.join(__dirname, "../data/processed");

// processar todos os arquivos com a extensão.json
let jsonFiles = [];
let allData = [];

// tentar listar os arquivos na pasta
try {
  const allFiles = fs.readdirSync(dataProcessed);
  console.log(`${allFiles.length} itens encontrados na pasta.`);

  // agora listar arquivos com extensão .json
  jsonFiles = allFiles.filter((name) => path.extname(name) === ".json");

  if (jsonFiles.length === 0) {
    console.log("Nenhum arquivo .json encontrado.");
  } else {
    console.log(`${jsonFiles.length} arquivos .json para processar.`);
  }
} catch (readDirError) {
  console.error("\n Erro: falha ao ler a pasta /data/processed.");
  if (readDirError.code === "ENOENT") {
    console.error("O diretório não foi encontrado.");
  } else {
    console.error(readDirError.message);
  }
  process.exit(1);
}

// Para cada arquivo encontrado: processar
for (const fileName of jsonFiles) {
  const completeFile = path.join(dataProcessed, fileName);

  console.log(`Processando arquivo: ${fileName}`);

  try {
    const jsonString = fs.readFileSync(completeFile, "utf8");

    // converter JSON para array de objetos
    const dataArray = JSON.parse(jsonString);

    if (Array.isArray(dataArray)) {
      console.log(`Sucesso. Lidos ${dataArray.length} registros.`);
      allData.push(...dataArray);
    } else {
      console.warn(
        "O arquivo JSON lido não é um array (esperado array de objetos).",
      );
    }
  } catch (processError) {
    console.error(`Erro ao ler ou fazer parse do arquivo ${fileName}:`);
    console.error(`Mensagem: ${processError.message}`);
  }
}

console.log(`Processamento de arquivos finalizado.`);
console.log(
  `Total de registros lidos e prontos para validação: ${allData.length}`,
);

// validar e preparar dados

const dataReadyForDB = [];
const requiredFields = ["uf", "orgao", "item", "quantidade", "valor_unitario"];
let skippedRegister = 0;

for (let i = 0; i < allData.length; i++) {
  const register = allData[i];
  let validRegister = true;

  // garantir que a quantidade e valor_unitario
  let quantidade = Number(register.quantidade);
  let valorUnitario = Number(register.valor_unitario);

  // trata valores que podem vir como string vazia ou nulo
  if (isNaN(quantidade) || quantidade <= 0) {
    console.warn(
      `Aviso (Registro ${i + 1}): 'quantidade' inválida ou ausente (${register.quantidade}). Pulando.`,
    );
    skippedRegister++;
    continue;
  }

  if (isNaN(valorUnitario) || valorUnitario < 0) {
    console.warn(
      `Aviso (Registro ${i + 1}): 'valor_unitario' inválido ou ausente (${register.valor_unitario}). Pulando.`,
    );
    skippedRegister++;
    continue;
  }

  // se algum campo obrigatório estiver ausente
  for (const field of requiredFields) {
    // verifica se o campo não existe, é null, ou é uma string vazia após trim
    if (!register[field] || String(register[field]).trim() === "") {
      console.warn(
        `Aviso (Registro ${i + 1}): Campo obrigatório '${field}' ausente ou vazio. Pulando.`,
      );
      validRegister = false;
      break;
    }
  }

  if (!validRegister) {
    skippedRegister++;
    continue;
  }

  // se o registro for válido:
  // montar lista de tuplas (uf, orgao, item, quantidade, valor_unitario)
  const tupla = [
    String(register.uf).toUpperCase().trim(),
    String(register.orgao).trim(),
    String(register.item).trim(),
    quantidade,
    valorUnitario,
  ];

  dataReadyForDB.push(tupla);
}

// Resumo
console.log(`Validação concluída.`);
console.log(`- Registros originais: ${allData.length}`);
console.log(`- Registros validados: ${dataReadyForDB.length}`);
console.log(`- Registros pulados:   ${skippedRegister}`);

// ETAPA 3: CONEXÃO E INSERÇÃO NO BANCO (ASSÍNCRONA)

// define o tamanho do lote de inserção
const batchSize = 500;
const allRegister = dataReadyForDB.length;
let insertedRegisters = 0;

// constrói a query de INSERT otimizada para múltiplos registros (lote)
function buildQueryBatch(batch) {
  const columns = ["uf", "orgao", "item", "quantidade", "valor_unitario"];
  const planValues = [];
  const placeholders = [];

  let parametersCount = 1;

  for (const tupla of batch) {
    const tuplaPlaceholders = [];
    for (let i = 0; i < columns.length; i++) {
      tuplaPlaceholders.push(`$${parametersCount++}`);
      planValues.push(tupla[i]);
    }
    placeholders.push(`(${tuplaPlaceholders.join(", ")})`);
  }

  const queryText = `INSERT INTO compras_publicas (${columns.join(", ")}) 
                       VALUES ${placeholders.join(", ")}`;

  return {
    text: queryText,
    values: planValues,
  };
}

// função principal para iniciar a lógica do banco de dados (assíncrona)
function startDatabaseProcess() {
  // abrir conexão com o banco e executar schema.sql
  client
    .connect()
    .then(() => {
      console.log("Conexão com o PostgreSQL aberta.");
      return client.query(sqlContent);
    })
    .then(() => {
      console.log("Schema SQL executado com sucesso.");
      console.log("Schema aplicado com sucesso.");

      // se não houver dados para inserir, finaliza aqui
      if (dataReadyForDB.length === 0) {
        console.log("Nenhum registro válido para inserção. Finalizando.");
        return Promise.resolve(false); // retorna false para sinalizar que não houve inserção
      }

      // INICIAR TRANSAÇÃO: client.query('BEGIN')
      return client.query("BEGIN");
    })
    .then((result) => {
      // verifica se a etapa de inserção deve ser pulada (se o result for false)
      if (result === false) {
        return Promise.resolve(false);
      }

      console.log("Transação iniciada (BEGIN).");

      // cria um array de 'lotes' (fatias do dataReadyForDB)
      const batches = [];
      for (let i = 0; i < allRegister; i += batchSize) {
        batches.push(dataReadyForDB.slice(i, i + batchSize));
      }

      console.log(
        `Serão processados ${batches.length} lotes de até ${batchSize} registros.`,
      );

      // inicializa uma promise resolvida para começar o encadeamento
      let promiseChain = Promise.resolve();

      // itera sobre cada lote e adiciona a inserção ao encadeamento
      batches.forEach((batch, index) => {
        promiseChain = promiseChain.then(() => {
          const query = buildQueryBatch(batch);

          // envia a query do lote ao banco
          return client.query(query.text, query.values).then((res) => {
            insertedRegisters += res.rowCount;
            console.log(
              `Lote ${index + 1}/${batches.length} inserido (${res.rowCount} registros).`,
            );
          });
        });
      });

      // retorna a promise que representa a execução de TODOS os lotes
      return promiseChain;
    })

    // COMMIT (se todas as inserções de lote foram bem-sucedidas)
    .then((result) => {
      if (result === false) {
        return Promise.resolve();
      }
      return client.query("COMMIT");
    })

    // se tudo der certo
    .then(() => {
      if (insertedRegisters > 0) {
        console.log("\nTransação concluída com sucesso. (COMMIT executado).");
        console.log(
          `Total de ${insertedRegisters} registros inseridos na tabela compras_publicas.`,
        );
      }
    })

    // se ocorrer erro em qualquer etapa (conexão, schema, BEGIN, Lote, COMMIT)
    .catch((error) => {
      console.error("\nErro: Falha durante a transação.");
      console.error(`Registros inseridos antes da falha: ${insertedRegisters}`);
      console.error(`Mensagem de Erro: ${error.message}`);

      // se o erro ocorreu após o BEGIN, tentar o ROLLBACK
      if (
        error.message.includes("cannot connect") ||
        error.message.includes('relation "compras_publicas"')
      ) {
        console.log(
          "Não foi possível tentar ROLLBACK: erro de conexão ou schema inicial.",
        );
      } else {
        client
          .query("ROLLBACK")
          .catch((rollbackErr) => {
            console.error(
              "Erro adicional ao tentar ROLLBACK:",
              rollbackErr.message,
            );
          })
          .finally(() => {
            console.log("Transação abortada (ROLLBACK executado).");
          });
      }
      // rejeita a promise pra garantir que o .finally saiba que houve falha
      return Promise.reject(error);
    })

    // garante que a conexão seja sempre fechada
    .finally(() => {
      if (client && !client._ending) {
        client.end();
        console.log("Conexão com o banco de dados fechada.");
      }
      // exibir o resumo
      console.log("RESUMO FINAL DA CARGA");
      console.log(`Total de arquivos processados: ${jsonFiles.length}`);
      console.log(`Total de registros inseridos: ${insertedRegisters}`);

      // exibir "carga concluída!" e terminar a execução
      console.log("CARGA CONCLUÍDA!");
      process.exit(0); // Termina o script com código de sucesso
    });
}

startDatabaseProcess();
