// src/services/conejoService.js
const { Conejo, Estudiante, Estudiante_Materia, TipoConejo } = require("../models");

module.exports = {

  // Define el tipo de conejo según una nota
  obtenerTipo(nota) {
    if (nota >= 9) return 1;  // Excelente
    if (nota >= 7) return 2;  // Bueno
    if (nota >= 4) return 3;  // Zafable
    return 4;                 // Desastre
  },

  // Asigna conejos a todos los estudiantes según TODAS SUS NOTAS
  async asignarConejosDesdeNotas() {
    const em = await Estudiante_Materia.findAll();
    const conejosParaInsertar = [];

    for (const row of em) {
      const notas = [
        { campo: "nota_1", valor: row.nota_1 },
        { campo: "nota_2", valor: row.nota_2 },
        { campo: "nota_final", valor: row.nota_final }
      ];

      for (const n of notas) {
        if (n.valor !== null && n.valor !== undefined) {
          conejosParaInsertar.push({
            estudianteId: row.estudianteId,
            tipoId: this.obtenerTipo(n.valor),
            materiaId: row.materiaId,
            nota: n.valor,
            descripcion: `Conejo generado desde ${n.campo}`
          });
        }
      }
    }

    // Inserción masiva
    await Conejo.bulkCreate(conejosParaInsertar);

    return conejosParaInsertar.length; // devuelve cuántos se crearon
  },

  // Estadísticas globales de conejos
  async estadisticasGlobales() {
    const total = await Conejo.count();
    const tipos = await TipoConejo.findAll();

    const data = {};

    for (const tipo of tipos) {
      const count = await Conejo.count({ where: { tipoId: tipo.id } });
      data[tipo.nombre] = count;
    }

    data.total = total;

    return data;
  },

  // Conejos de un solo estudiante
  async conejosDeEstudiante(id) {
    return await Conejo.findAll({
      where: { estudianteId: id },
      include: [{ model: TipoConejo }]
    });
  }

};
