// src/controllers/conejoController.js
const { Conejo, TipoConejo, Estudiante, Materia, Estudiante_Materia, sequelize } = require("../models");

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function generarPlaca(i, len = 5) {
  let s = "";
  for (let pos = len - 1; pos >= 0; pos--) {
    const pow = Math.pow(26, pos);
    const idx = Math.floor(i / pow) % 26;
    s += CHARS[idx];
  }
  return s;
}

function getId(obj, ...possible) {
  if (!obj) return null;
  for (const p of possible) {
    if (obj[p] !== undefined && obj[p] !== null) return obj[p];
  }
  return obj.id || obj.id_conejo || null;
}

async function getAll(req, res) {
  try {
    const conejos = await Conejo.findAll({
      include: [
        { model: TipoConejo, as: "tipo" },
        { model: Estudiante, as: "estudiante" },
        { model: Materia, as: "materia" }
      ],
      order: [["id_conejo", "ASC"]]
    });
    res.json(conejos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo conejos" });
  }
}

async function getById(req, res) {
  try {
    const conejo = await Conejo.findByPk(req.params.id, {
      include: [{ model: TipoConejo, as: "tipo" }, { model: Estudiante, as: "estudiante" }, { model: Materia, as: "materia" }]
    });
    if (!conejo) return res.status(404).json({ error: "Conejo no encontrado" });
    res.json(conejo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo conejo" });
  }
}

async function create(req, res) {
  try {
    const nuevo = await Conejo.create(req.body);
    res.json(nuevo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando conejo" });
  }
}

async function remove(req, res) {
  try {
    const conejo = await Conejo.findByPk(req.params.id);
    if (!conejo) return res.status(404).json({ error: "Conejo no encontrado" });
    await conejo.destroy();
    res.json({ mensaje: "Conejo eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando conejo" });
  }
}

/**
 * Genera 1 conejo por cada nota no nula en Estudiante_Materia.
 * - Genera placas únicas (5 letras). Usa count() para empezar el índice.
 * - Usa batches para bulkCreate.
 */
async function asignarConejosDesdeNotas(req, res) {
  const t = await sequelize.transaction();
  try {
    // traer tipos
    const tiposDB = await TipoConejo.findAll({ transaction: t });
    const tipoMap = {};
    tiposDB.forEach(tt => tipoMap[tt.nombre] = getId(tt, 'id_tipo', 'id'));

    // traer historial (solo campos necesarios)
    const historial = await Estudiante_Materia.findAll({
      attributes: ['id_estudiante_materia', 'id_estudiante', 'id_materia', 'nota_parcial_1', 'nota_parcial_2', 'nota_final', 'anio_cursada'],
      transaction: t
    });

    // start index = cantidad existente (para evitar placas duplicadas si ya hay filas)
    let placaIndex = await Conejo.count({ transaction: t });
    const ASSIGN_CHUNK = 5000;
    const batch = [];
    let totalGenerados = 0;

    function tipoParaNota(n) {
      if (n <= 3) return 'Adulto';
      if (n <= 7) return 'Joven';
      return 'Bebe';
    }

    for (const em of historial) {
      const notas = [
        { val: em.nota_parcial_1, label: 'Parcial 1' },
        { val: em.nota_parcial_2, label: 'Parcial 2' },
        { val: em.nota_final, label: 'Final' }
      ];

      for (const nObj of notas) {
        const n = nObj.val;
        if (n === null || n === undefined) continue;
        const tipoNombre = tipoParaNota(Number(n));
        const id_tipo = tipoMap[tipoNombre] || null;

        batch.push({
          id_estudiante_materia: em.id_estudiante_materia || em.id,
          id_estudiante: em.id_estudiante,
          id_materia: em.id_materia,
          id_tipo: id_tipo,
          anio_cursada: em.anio_cursada || null,
          nota_origen: Number(n),
          descripcion: `Asignado por ${nObj.label}: ${n}`,
          placa: generarPlaca(placaIndex),
          fecha_asignacion: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        placaIndex++;
        totalGenerados++;

        if (batch.length >= ASSIGN_CHUNK) {
          await Conejo.bulkCreate(batch.splice(0, batch.length), { validate: false, hooks: false, transaction: t });
        }
      }
    }

    if (batch.length) {
      await Conejo.bulkCreate(batch, { validate: false, hooks: false, transaction: t });
    }

    await t.commit();
    res.json({ mensaje: "Conejos asignados desde notas", total: totalGenerados });
  } catch (err) {
    await t.rollback();
    console.error("Error en asignarConejosDesdeNotas:", err);
    res.status(500).json({ error: "Error generando conejos desde notas", details: err.message });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  delete: remove,
  asignarConejosDesdeNotas
};
