const {
  Estudiante,
  Estudiante_Materia,
  Materia,
  Carrera,
  Conejo,
  TipoConejo
} = require("../models");

// Calcula promedio
function promedioFrom(em) {
  const n1 = Number(em.nota_parcial_1 || 0);
  const n2 = Number(em.nota_parcial_2 || 0);
  const nf = Number(em.nota_final || 0);
  if (!em.nota_parcial_1 && !em.nota_parcial_2 && !em.nota_final) return null;
  return Math.round(((n1 + n2 + nf) / ((em.nota_parcial_1 ? 1 : 0) + (em.nota_parcial_2 ? 1 : 0) + (em.nota_final ? 1 : 0) || 3)) * 10) / 10;
}

// =======================
// CRUD
// =======================
async function getAll(req, res) {
  try {
    const estudiantes = await Estudiante.findAll();
    res.json(estudiantes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener estudiantes" });
  }
}

async function getById(req, res) {
  try {
    const estudiante = await Estudiante.findByPk(req.params.id);
    if (!estudiante) return res.status(404).json({ error: "No encontrado" });
    res.json(estudiante);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener estudiante" });
  }
}

async function getByDni(req, res) {
  try {
    const estudiante = await Estudiante.findOne({
      where: {
        dni: req.params.dni
      },
      include: [
        {
          model: Estudiante_Carrera,
          as: "estudiante_carreras",
          include: [
            {
              model: Carrera,
              as: "carrera"
            }
          ]
        },
        {
          model: Estudiante_Materia,
          as: "est_materias",
          include: [
            {
              model: Materia,
              as: "materia"
            }
          ]
        },
        {
          model: Conejo,
          as: "conejos"
        }
      ]
    });

    if (!estudiante) {
      return res.status(404).json({
        error: "Estudiante no encontrado"
      });
    }

    res.json(estudiante);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Error buscando estudiante por DNI"
    });
  }
}

async function create(req, res) {
  try {
    const nuevo = await Estudiante.create(req.body);
    res.json(nuevo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear estudiante" });
  }
}

async function update(req, res) {
  try {
    const estudiante = await Estudiante.findByPk(req.params.id);
    if (!estudiante) return res.status(404).json({ error: "No encontrado" });
    await estudiante.update(req.body);
    res.json(estudiante);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar estudiante" });
  }
}

async function deleteEstudiante(req, res) {
  try {
    const estudiante = await Estudiante.findByPk(req.params.id);
    if (!estudiante) return res.status(404).json({ error: "No encontrado" });
    await estudiante.destroy();
    res.json({ mensaje: "Eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar estudiante" });
  }
}

// =======================
// Materias y asignaciones
// =======================
async function asignarMaterias(req, res) {
  try {
    const { id } = req.params;
    const { materias } = req.body;
    const estudiante = await Estudiante.findByPk(id);
    if (!estudiante) return res.status(404).json({ error: "No encontrado" });

    await Estudiante_Materia.destroy({ where: { id_estudiante: id } });

    const asignaciones = materias.map(m => ({ id_estudiante: id, id_materia: m }));
    await Estudiante_Materia.bulkCreate(asignaciones);

    res.json({ mensaje: "Materias asignadas" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al asignar materias" });
  }
}

async function historialAcademico(req, res) {
  try {
    const id = req.params.id;
    const estudiante = await Estudiante.findByPk(id);
    if (!estudiante) return res.status(404).json({ error: "No encontrado" });

    const materias = await Estudiante_Materia.findAll({
      where: { id_estudiante: id },
      include: [{ model: Materia, as: "materia" }]
    });

    res.json({ estudiante, materias });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener historial" });
  }
}

// =======================
// Materias filtrables por año
// =======================
async function materiasPorAnio(req, res) {
  try {
    const { id } = req.params;
    const { anio, filtro, page = 1, limit = 100 } = req.query;
    const where = { id_estudiante: id };
    if (anio) where.anio_cursada = Number(anio);

    const rows = await Estudiante_Materia.findAll({
      where,
      include: [{ model: Materia, as: "materia" }],
      order: [["anio_cursada", "DESC"], ["id_estudiante_materia", "ASC"]]
    });

    const mapped = rows.map(r => {
      const prom = promedioFrom(r);
      return {
        id_estudiante_materia: r.id_estudiante_materia || r.id,
        id_materia: r.id_materia,
        nombre: r.materia ? r.materia.nombre : null,
        anio_cursada: r.anio_cursada,
        nota_parcial_1: r.nota_parcial_1,
        nota_parcial_2: r.nota_parcial_2,
        nota_final: r.nota_final,
        promedio: prom
      };
    });

    let filtered = mapped;
    if (filtro) {
      if (filtro === "brain") filtered = mapped.filter(x => x.promedio !== null && x.promedio >= 8 && x.promedio <= 10);
      if (filtro === "easy") filtered = mapped.filter(x => x.promedio !== null && x.promedio >= 4 && x.promedio <= 7);
      if (filtro === "ghost") filtered = mapped.filter(x => x.promedio !== null && x.promedio >= 1 && x.promedio <= 3);
    }

    const start = (Number(page) - 1) * Number(limit);
    const pageData = filtered.slice(start, start + Number(limit));

    res.json({ total: filtered.length, page: Number(page), limit: Number(limit), data: pageData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo materias" });
  }
}

// =======================
// Conejos filtrables por año y tipo
// =======================
async function conejosPorAnio(req, res) {
  try {
    const { id } = req.params;
    const { anio, tipo, page = 1, limit = 100 } = req.query;
    const where = { id_estudiante: id };
    if (anio) where.anio_cursada = Number(anio);

    const conejos = await Conejo.findAll({
      where,
      include: [{ model: TipoConejo, as: "tipo" }, { model: Materia, as: "materia" }],
      order: [["fecha_asignacion", "DESC"], ["id_conejo", "ASC"]]
    });

    let data = conejos.map(c => ({
      id_conejo: c.id_conejo || c.id,
      placa: c.placa,
      id_tipo: c.id_tipo,
      tipo: c.tipo ? c.tipo.nombre : null,
      nota_origen: c.nota_origen,
      anio_cursada: c.anio_cursada,
      descripcion: c.descripcion,
      materia: c.materia ? c.materia.nombre : null,
      fecha_asignacion: c.fecha_asignacion
    }));

    if (tipo) {
      data = data.filter(d => String(d.tipo).toLowerCase() === String(tipo).toLowerCase());
    }

    const start = (Number(page) - 1) * Number(limit);
    const pageData = data.slice(start, start + Number(limit));

    res.json({ total: data.length, page: Number(page), limit: Number(limit), data: pageData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo conejos" });
  }
}

// =======================
// Exportar
// =======================
module.exports = {
  getAll,
  getById,
  getByDni,
  create,
  update,
  delete: deleteEstudiante,
  asignarMaterias,
  historialAcademico,
  materiasPorAnio,
  conejosPorAnio
};
