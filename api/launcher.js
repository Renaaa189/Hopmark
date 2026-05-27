console.log("🚀 Iniciando proceso completo...");

const { exec } = require("child_process");

console.log("🧠 Ejecutando app.js para crear tablas y cargar seeds...");
exec("node src/app.js", (err, stdout, stderr) => {
  if (err) console.error(err);
  console.log(stdout);

  console.log("🌐 Iniciando servidor...");
  exec("node src/server.js", (err2, stdout2, stderr2) => {
    if (err2) console.error(err2);
    console.log(stdout2);
  });
});
