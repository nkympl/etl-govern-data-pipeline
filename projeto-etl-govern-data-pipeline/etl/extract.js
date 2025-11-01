const path = require("path");
const XLSX = require("xlsx");
const fs = require("fs");

// caminho da pasta de planilhas
const rawDir = path.join(__dirname, "../data/raw");

// listar todos os arquivos .xlsx na pasta
const excelFiles = fs
  .readdirSync(rawDir)
  .filter((file) => path.extname(file).toLowerCase() === ".xlsx");

// se não houver arquivos, informar e sair
if (excelFiles.length === 0) {
  console.log("Nenhum arquivo .xlsx encontrado em /data/raw.");
  process.exit(0);
}

console.log(`Foram encontrados ${excelFiles.length} arquivos para processar.`);

// percorrer cada arquivo encontrado
for (const file of excelFiles) {
  const filePath = path.join(rawDir, file);
  console.log(`\nLendo arquivo: ${file}`);

  try {
    // ler planilha
    const workbook = XLSX.readFile(filePath);

    // pega a primeira aba (sheet)
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    // converte para JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    console.log(`${jsonData.length} registros lidos.`);

    // definir nome do arquivo de saída
    const baseName = path.basename(file, ".xlsx");
    const outputPath = path.join(rawDir, `${baseName}.json`);

    // salvar JSON
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(`Arquivo salvo: ${baseName}.json`);
  } catch (error) {
    console.error(`Erro ao processar ${file}: ${error.message}`);
  }
}

console.log("\nExtração concluída para todos os arquivos!");
