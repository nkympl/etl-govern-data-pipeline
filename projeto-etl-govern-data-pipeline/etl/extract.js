import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const workbook = XLSX.readFile("../data/raw/compras_sp.xlsx");
const sheet = workbook.Sheets["Planilha1"];
const jsonData = XLSX.utils.sheet_to_json(sheet);

console.log(jsonData, "Extração concluída!");
