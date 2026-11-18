const app = require("./app");
const port = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    await require('./config/database').consultar('SELECT 1');
    app.listen(port, () => console.log(`VeterinariaSegura disponible en http://localhost:${port}`));
  } catch (error) {
    console.error("Error al iniciar el servidor:", error.message);
    process.exit(1);
  }
}

iniciarServidor();
