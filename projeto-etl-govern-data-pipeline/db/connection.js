const { Client } = require("pg");
const dotenv = require("dotenv");

// Carrega as variáveis do arquivo .env
dotenv.config();

// Cria o cliente PostgreSQL com as informações do .env
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Tenta conectar ao banco
client.connect(function (err) {
  if (err) {
    console.log("Erro ao conectar ao banco de dados:", err);
  } else {
    console.log("Conexão bem-sucedida");
  }

  // Fecha a conexão(teste)
  client.end();
});
