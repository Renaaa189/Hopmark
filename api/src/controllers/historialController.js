const { Estudiante, Estudiante_Materia, Materia, Carrera } = require("../models");

module.exports = {
  async getHistorial(req, res) {
    try {
      const estudiante = await Estudiante.findByPk(req.params.id, {
        include: [
          {
            model: Materia,
            through: {
              attributes: [
                "nota_parcial_1",
                "nota_parcial_2",
                "nota_final"
              ]
            }
          },
          {
            model: Carrera,
            through: { attributes: [] }
          }
        ]
      });

      if (!estudiante) {
        return res.status(404).json({ error: "Estudiante no encontrado" });
      }

      const materias = estudiante.Materia.map(m => ({
        id: m.id,
        nombre: m.nombre,
       nota_parcial_1: m.Estudiante_Materia.nota_parcial_1,
        nota_parcial_2: m.Estudiante_Materia.nota_parcial_2,
        nota_final: m.Estudiante_Materia.nota_final
      }));

      res.json({
        estudiante,
        carreras: estudiante.Carrera,
        materias
      });

    } catch (error) {
      res.status(500).json({ error: "Error obteniendo historial", details: error.message });
    }
  }
};
