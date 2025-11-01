const fs = require("fs");
const path = require("path");

// caminho da pasta com os arquivos .json
const inputDir = path.join(__dirname, "../data/raw");
const outputDir = path.join(__dirname, "../data/processed");

// listar os arquivos .json da pasta raw
const jsonFiles = fs
  .readdirSync(inputDir)
  .filter((file) => file.endsWith(".json"));

if (jsonFiles.length === 0) {
  console.log("nenhum arquivo .json encontrado em /data/raw.");
  process.exit(0);
}

// função que normaliza os dados
function normalizeData(data) {
  // criar um novo array para guardar os dados limpos
  const normalizeList = [];

  // percorrer cada item do array original
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const novoItem = {}; // montar o objeto limpo aqui

    // padronizar as chaves
    for (let chave in item) {
      // transforma a chave com regex
      let novaChave = chave
        .toLowerCase()
        .normalize("NFD") // separa acentos
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/\s+/g, "_"); // substitui espaços por "_"

      // adiciona no novo objeto
      novoItem[novaChave] = item[chave];
    }

    // garantir que quantidade e valor_unitario sejam números
    novoItem.quantidade = Number(novoItem.quantidade);
    novoItem.valor_unitario = Number(novoItem.valor_unitario);

    // adiciona o objeto limpo na nova lista
    normalizeList.push(novoItem);
  }

  // retorna o array novo
  return normalizeList;
}

// percorrer cada arquivo e aplicar a normalização
for (const file of jsonFiles) {
  const inputPath = path.join(inputDir, file);
  console.log(`\nprocessando arquivo: ${file}`);

  try {
    // ler o conteúdo e converter em objeto
    const rawData = fs.readFileSync(inputPath, "utf8");
    const data = JSON.parse(rawData);
    console.log(`dados lidos com sucesso: ${data.length} registros`);

    // normalizar
    const resultado = normalizeData(data);

    // definir nome do arquivo de saída
    const baseName = path.basename(file, ".json");
    const outputPath = path.join(outputDir, `${baseName}_normalized.json`);

    // salvar o novo arquivo
    fs.writeFileSync(outputPath, JSON.stringify(resultado, null, 2));
    console.log(
      `normalização concluída: ${resultado.length} registros processados.`,
    );
  } catch (error) {
    console.error(`erro ao processar ${file}: ${error.message}`);
  }
}

console.log("\nprocessamento concluído para todos os arquivos!");
