require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());

// MODELOS + ASOCIACIONES
require("./models");

// RUTAS
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

// TEST
app.get("/", (req, res) => {
  res.send("API funcionando 🟢");
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log("DB conectada");

    await sequelize.sync({ alter: true });
    console.log("DB sync OK");

    await require("./seeders/seedAll")();

    app.listen(3000, () => {
      console.log("🚀 Backend en http://localhost:3000");
    });

  } catch (err) {
    console.error(err);
  }
}

start();