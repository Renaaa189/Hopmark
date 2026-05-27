// src/controllers/carreraController.js

const { Carrera, Universidad, Materia, Estudiante_Carrera, Estudiante } = require("../models");

// =======================
//  OBTENER TODAS
// =======================
async function getAll(req, res) {
  try {
    const carreras = await Carrera.findAll({
      include: [
        { model: Universidad, as: "universidad" },
        { model: Materia, as: "materias" }
      ]
    });
    res.json(carreras);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener carreras" });
  }
}

// =======================
//  OBTENER POR ID
// =======================
async function getById(req, res) {
  try {
    const carrera = await Carrera.findByPk(req.params.id, {
      include: [
        { model: Universidad, as: "universidad" },
        { model: Materia, as: "materias" },
        { 
          model: Estudiante_Carrera, 
          as: "estudiantes_carrera",
          include: [{ model: Estudiante, as: "estudiante" }]
        }
      ]
    });

    if (!carrera) return res.status(404).json({ error: "Carrera no encontrada" });

    res.json(carrera);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener carrera" });
  }
}

// =======================
//  CREAR
// =======================
async function create(req, res) {
  try {
    const nueva = await Carrera.create(req.body);
    res.json(nueva);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear carrera" });
  }
}

// =======================
//  ACTUALIZAR
// =======================
async function update(req, res) {
  try {
    const carrera = await Carrera.findByPk(req.params.id);
    if (!carrera) return res.status(404).json({ error: "Carrera no encontrada" });

    await carrera.update(req.body);
    res.json(carrera);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar carrera" });
  }
}

// =======================
//  ELIMINAR
// =======================
async function remove(req, res) {
  try {
    const carrera = await Carrera.findByPk(req.params.id);
    if (!carrera) return res.status(404).json({ error: "Carrera no encontrada" });

    await carrera.destroy();
    res.json({ mensaje: "Eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar carrera" });
  }
}

// =======================
// EXPORTAR
// =======================
module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: remove
};
