// importar módulos necessários fs, path, pg
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

// carrega as variáveis do arquivo .env
require("dotenv").config();

// criar cliente do pg usando dados do .env
const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// etapa 1: ler schema sql
const schemaPath = path.join(__dirname, "../db/schema.sql");
let sqlContent = null;

try {
  sqlContent = fs.readFileSync(schemaPath, "utf8");
  console.log("arquivo schema.sql lido com sucesso.");
} catch (error) {
  console.error("erro ao ler o arquivo schema.sql:", error.message);
  process.exit(1);
}

// etapa 2: ler arquivos json da pasta processed
const processedDir = path.join(__dirname, "../data/processed");
let jsonFiles = [];

try {
  jsonFiles = fs.readdirSync(processedDir).filter((f) => f.endsWith(".json"));
  if (jsonFiles.length === 0) {
    console.log("nenhum arquivo .json encontrado em /data/processed.");
    process.exit(0);
  }
  console.log(`${jsonFiles.length} arquivos encontrados para inserção.`);
} catch (error) {
  console.error("erro ao listar arquivos em /data/processed:", error.message);
  process.exit(1);
}

// função para montar query de insert em lote
function buildQueryBatch(batch) {
  const columns = ["uf", "orgao", "item", "quantidade", "valor_unitario"];
  const values = [];
  const placeholders = [];
  let count = 1;

  // montar os placeholders e valores
  for (const row of batch) {
    const rowPlaceholders = [];
    for (let i = 0; i < columns.length; i++) {
      rowPlaceholders.push(`$${count++}`);
      values.push(row[i]);
    }
    placeholders.push(`(${rowPlaceholders.join(", ")})`);
  }

  // query sql: insere ou atualiza se o registro já existir
  const queryText = `INSERT INTO compras_publicas (${columns.join(", ")})
                     VALUES ${placeholders.join(", ")}
                     ON CONFLICT (uf, orgao, item)
                     DO UPDATE SET
                      quantidade = EXCLUDED.quantidade,
                      valor_unitario = EXCLUDED.valor_unitario,
                      data_insercao = CURRENT_TIMESTAMP`;
  return { text: queryText, values };
}

// etapa 3: validar e preparar os dados para o banco
function validarDados(array) {
  const validos = [];
  const obrigatorios = ["uf", "orgao", "item", "quantidade", "valor_unitario"];

  for (let i = 0; i < array.length; i++) {
    const r = array[i];
    let ok = true;
    let q = Number(r.quantidade);
    let vu = Number(r.valor_unitario);

    if (isNaN(q) || q <= 0) ok = false;
    if (isNaN(vu) || vu < 0) ok = false;

    for (const campo of obrigatorios) {
      if (!r[campo] || String(r[campo]).trim() === "") ok = false;
    }

    if (ok) {
      validos.push([
        String(r.uf).toUpperCase().trim(),
        String(r.orgao).trim(),
        String(r.item).trim(),
        q,
        vu,
      ]);
    }
  }
  return validos;
}

// função principal assíncrona
async function startDatabaseProcess() {
  try {
    await client.connect();
    console.log("conexão com o postgresql aberta.");

    // aplica o schema
    await client.query(sqlContent);
    console.log("schema aplicado com sucesso.");

    let totalInserido = 0;
    const batchSize = 500;

    // percorrer todos os arquivos .json normalizados
    for (const file of jsonFiles) {
      console.log(`\nprocessando arquivo: ${file}`);
      const filePath = path.join(processedDir, file);
      const raw = fs.readFileSync(filePath, "utf8");
      const dados = JSON.parse(raw);
      const prontos = validarDados(dados);

      console.log(
        `${prontos.length} registros válidos encontrados no arquivo ${file}.`,
      );

      if (prontos.length === 0) {
        console.log("nenhum registro válido neste arquivo. pulando.");
        continue;
      }

      await client.query("BEGIN");
      console.log("transação iniciada.");

      for (let i = 0; i < prontos.length; i += batchSize) {
        const batch = prontos.slice(i, i + batchSize);
        const query = buildQueryBatch(batch);
        const res = await client.query(query.text, query.values);
        totalInserido += res.rowCount;
        console.log(`lote inserido (${res.rowCount} registros).`);
      }

      await client.query("COMMIT");
      console.log(`arquivo ${file} inserido com sucesso.`);
    }

    console.log("\ntransação concluída. (commit executado)");
    console.log(`total geral de registros inseridos: ${totalInserido}`);
  } catch (error) {
    console.error("\nerro durante a transação:", error.message);
    try {
      await client.query("ROLLBACK");
      console.log("rollback executado.");
    } catch (rErr) {
      console.error("erro ao tentar rollback:", rErr.message);
    }
  } finally {
    await client.end();
    console.log("conexão com o banco de dados encerrada.");
    console.log("carga concluída!");
  }
}

// iniciar processo
startDatabaseProcess();
