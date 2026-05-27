// src/services/asignacionService.js
const { Estudiante, Carrera, Materia, Estudiante_Materia } = require("../models");

module.exports = {

  async asignarMateriasAEstudiante(estudianteId) {
    const estudiante = await Estudiante.findByPk(estudianteId, {
      include: [{ model: Carrera }]
    });

    if (!estudiante) throw new Error("Estudiante no encontrado");

    const carrera = estudiante.Carreras[0];
    if (!carrera) throw new Error("El estudiante no tiene carrera asignada");

    const materias = await Materia.findAll({
      where: { carreraId: carrera.id }
    });

    const asignaciones = [];

    for (const m of materias) {
      asignaciones.push({
        estudianteId,
        materiaId: m.id,
        nota_1: Math.floor(Math.random() * 11),
        nota_2: Math.floor(Math.random() * 11),
        nota_final: Math.floor(Math.random() * 11)
      });
    }

    // Inserta TODO de una sola vez
    await Estudiante_Materia.bulkCreate(asignaciones);

    return asignaciones.length;
  },

  async asignarMateriasATodos() {
    const estudiantes = await Estudiante.findAll();
    let total = 0;

    for (const e of estudiantes) {
      total += await this.asignarMateriasAEstudiante(e.id);
    }

    return total;
  }

};
