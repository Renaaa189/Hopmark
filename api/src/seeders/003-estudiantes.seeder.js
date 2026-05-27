// api/src/seeders/003-generarEstudianteMaterias.js
const { Op } = require("sequelize");

const {
  Estudiante,
  Estudiante_Carrera,
  Materia,
  Estudiante_Materia,
  sequelize
} = require("../models");

module.exports = {
  up: async () => {
    console.log("📚 Generando Estudiante_Materia según AÑO y CARRERA...");

    const t = await sequelize.transaction();

    try {
      // 1) Traer estudiantes con su carrera y año_actual
      const estudiantes = await Estudiante_Carrera.findAll({
        include: [
          { model: Estudiante, as: "estudiante" }
        ],
        transaction: t
      });

      // 2) Recorremos cada estudiante
      for (const ec of estudiantes) {
        const id_estudiante = ec.id_estudiante;
        const id_carrera = ec.id_carrera;
        const anio_actual = ec.anio_actual || 1;

        console.log(`👨‍🎓 Estudiante ${id_estudiante} — carrera ${id_carrera} — año ${anio_actual}`);

        // 3) Traer todas las materias de la carrera hasta su año actual
        const materias = await Materia.findAll({
          where: {
            id_carrera,
            anio_cursada: {
            [Op.lte]: anio_actual}
          },
          transaction: t
        });

        // 4) Insertar ESTUDIANTE_MATERIA
        for (const materia of materias) {
          // evitar duplicados
          const existe = await Estudiante_Materia.findOne({
            where: {
              id_estudiante,
              id_materia: materia.id_materia
            },
            transaction: t
          });
          if (existe) continue;

          // generar notas al azar 1–10
          const np1 = Math.floor(Math.random() * 10) + 1;
          const np2 = Math.floor(Math.random() * 10) + 1;
          const nf = Math.floor(Math.random() * 10) + 1;

          const promedio = (np1 + np2 + nf) / 3;

          await Estudiante_Materia.create(
            {
              id_estudiante,
              id_materia: materia.id_materia,
              id_estudiante_carrera: ec.id_estudiante_carrera,
              anio_cursada: materia.anio_cursada,

              nota_parcial_1: np1,
              nota_parcial_2: np2,
              nota_final: nf,

              estado_regularidad:
                promedio >= 4 ? "Regular" : "Libre",

              estado_materia:
                promedio >= 7 ? "Aprobada" : "Reprobada",
            },
            { transaction: t }
          );
        }
      }

      await t.commit();
      console.log("📚✔️ Estudiante_Materia generado correctamente.");

    } catch (error) {
      console.error("❌ Error en generarEstudianteMaterias:", error);
      await t.rollback();
      throw error;
    }
  },

  down: async () => {
    await Estudiante_Materia.destroy({ truncate: true, restartIdentity: true });
  }
};
