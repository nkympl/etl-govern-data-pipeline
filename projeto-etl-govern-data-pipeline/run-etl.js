// importar módulo child_process
const { exec } = require("child_process");

// função que executa os três scripts em sequência
exec(
  "node etl/extract.js && node etl/transform.js && node etl/load.js",
  (error, stdout, stderr) => {
    if (error) {
      console.error(`erro: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
    console.log("pipeline etl concluído com sucesso!");
  },
);
