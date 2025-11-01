const path = require("path");
const XLSX = require("xlsx");
const fs = require("fs");

const workbook = XLSX.readFile(
  path.join(__dirname, "../data/raw/compras_sp.xlsx"),
);
const sheet = workbook.Sheets["Planilha1"];
const jsonData = XLSX.utils.sheet_to_json(sheet);

console.log(jsonData, "Extração concluída!");

// salva o array em um arquivo
const outputPath = path.join(__dirname, "../data/raw/compras_sp.json");
fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), "utf8");

console.log("Extração concluída e arquivo salvo!");
