const fs = require("fs");
const path = require("path");

// Caminho para o arquivo compras_sp.json
const inputPath = path.join(__dirname, "../data/raw/compras_sp.json");
const rawData = fs.readFileSync(inputPath, "utf8");
const data = JSON.parse(rawData);
console.log(`Dados lidos com sucesso: " ${data.length} registros`);

function normalizeData(data) {
  // criar um novo array para guardar os dados limpos
  const normalizeList = [];

  // percorrer cada item do array original
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const novoItem = {}; //montar o objeto limpo aqui

    // padronizar as chaves
    for (let chave in item) {
      //transforma a chave com regex
      let novaChave = chave
        .toLowerCase()
        .normalize("NFD") //separa acentos
        .replace(/[\u0300-\u036f]/g, "") //remove acentos
        .replace(/\s+/g, "_"); // substitui espaços por "_"

      //adiciona no novo objeto
      novoItem[novaChave] = item[chave];
    }

    // calcular valor_total
    const quantidade = Number(novoItem.quantidade);
    const valorUnitario = Number(novoItem.valor_unitario);

    //caso consiga calcular, adiciona o valor_total
    if (!isNaN(quantidade) && !isNaN(valorUnitario)) {
      novoItem.valor_total = quantidade * valorUnitario;
    } else {
      novoItem.valor_total = 0; //caso falte algum dado
    }

    // adiciona o objeto limpo na nova lista
    normalizeList.push(novoItem);
  }
  // retorna o array novo
  return normalizeList;
}

const resultado = normalizeData(data);

// salvando o novo arquivo
fs.writeFileSync(
  path.join(__dirname, "../data/processed/compras_sp_normalized.json"),
  JSON.stringify(resultado, null, 2),
);

console.log(
  "Normalização concluída: ",
  resultado.length,
  " registros processados.",
);
