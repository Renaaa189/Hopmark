// src/controllers/materiaController.js

const { Materia, Carrera, Estudiante_Materia, Estudiante } = require("../models");

// =======================
//  OBTENER TODAS
// =======================
async function getAll(req, res) {
  try {
    const materias = await Materia.findAll({
      include: [{ model: Carrera, as: "carrera" }]
    });
    res.json(materias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener materias" });
  }
}

// =======================
//  OBTENER POR ID
// =======================
async function getById(req, res) {
  try {
    const materia = await Materia.findByPk(req.params.id, {
      include: [
        { model: Carrera, as: "carrera" },
        {
          model: Estudiante_Materia,
          as: "estudiantes_materia",
          include: [{ model: Estudiante, as: "estudiante" }]
        }
      ]
    });

    if (!materia)
      return res.status(404).json({ error: "Materia no encontrada" });

    res.json(materia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener materia" });
  }
}

// =======================
//  CREAR
// =======================
async function create(req, res) {
  try {
    const nueva = await Materia.create(req.body);
    res.json(nueva);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear materia" });
  }
}

// =======================
//  ACTUALIZAR
// =======================
async function update(req, res) {
  try {
    const materia = await Materia.findByPk(req.params.id);
    if (!materia)
      return res.status(404).json({ error: "Materia no encontrada" });

    await materia.update(req.body);
    res.json(materia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar materia" });
  }
}

// =======================
//  ELIMINAR
// =======================
async function remove(req, res) {
  try {
    const materia = await Materia.findByPk(req.params.id);
    if (!materia)
      return res.status(404).json({ error: "Materia no encontrada" });

    await materia.destroy();
    res.json({ mensaje: "Materia eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar materia" });
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
  delete: remove,
};
