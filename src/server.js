const app = require("./app");
const usuariosService = require("./services/usuarios.service");
const port = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    await usuariosService.crearAdministradorInicial();
    app.listen(port, () => console.log(`VeterinariaSegura disponible en http://localhost:${port}`));
  } catch (error) {
    console.error("Error al iniciar el servidor:", error.message);
    process.exit(1);
  }
}

iniciarServidor();
