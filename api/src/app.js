// src/app.js
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());

// ---------- IMPORTAR MODELOS Y ASOCIACIONES (centralizado) ----------
// El `src/models/index.js` inicializa los modelos con sequelize y ejecuta
// sus métodos associate() para crear las relaciones entre modelos.
// Cargar ese index garantiza que las asociaciones estén disponibles para
// los controllers y rutas.
require("./models");

// ---------- RUTAS ----------
const estudianteRoutes = require("./routes/estudianteRoutes");
const carreraRoutes = require("./routes/carreraRoutes");
const materiaRoutes = require("./routes/materiaRoutes");
const historialRoutes = require("./routes/historialRoutes");
const conejoRoutes = require("./routes/conejoRoutes");

app.use("/api/estudiantes", estudianteRoutes);
app.use("/api/carreras", carreraRoutes);
app.use("/api/materias", materiaRoutes);
app.use("/api/historial", historialRoutes);
app.use("/api/conejos", conejoRoutes);

app.get("/", (req, res) => {
  res.send("API funcionando correctamente 🟢");
});

// ---------- SINCRONIZAR TABLAS Y EJECUTAR SEEDS ----------
async function initDatabase() {
  try {
    console.log("🔄 Conectando base de datos...");
    
    await sequelize.authenticate();

    console.log("🟢 Base conectada correctamente.");

    console.log("🌱 Ejecutando seeders...");
    
    const cargarDatos = require("./seeders/seedAll");
    
    await cargarDatos();

    console.log("🌱 Seeders ejecutados correctamente.");

  } catch (err) {
    console.error("❌ Error al sincronizar la base de datos:", err);
  }
}

initDatabase();

module.exports = app;
