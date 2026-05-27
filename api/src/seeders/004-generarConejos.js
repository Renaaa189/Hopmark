// migrations/xxxx-create-and-assign-conejos.js  (ó donde lo ejecutes)
const { Estudiante_Materia, Conejo, TipoConejo } = require("../models");

// =========
// PLAQUITAS (AHORA 5 LETRAS)
// =========
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function generarPlaca(i, len = 5) {
  // genera placas base26 de `len` letras. i debe ser único incremental.
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
  return obj.id || obj.id_materia || obj.id_carrera || obj.id_estudiante || obj.id_estudiante_materia || null;
}

module.exports = {
  up: async () => {
    console.log("🐇 Iniciando: CREAR 4M conejos + asignar notas (placas 5 letras)");

    const TOTAL = 4_000_000;
    const ASSIGN_CHUNK = 5000;   // chunk para conejos asignados
    const FREE_CHUNK = 10000;    // chunk para conejos libres

    // map de tipos (si existen)
    const tiposDB = await TipoConejo.findAll().catch(() => []);
    const tipoMap = {};
    tiposDB.forEach(t => {
      tipoMap[t.nombre] = getId(t, 'id_tipo', 'id');
    });

    // traigo solo lo necesario del historial
    console.log("🐇 Leyendo historial (Estudiante_Materia)...");
    const historial = await Estudiante_Materia.findAll({
      attributes: [
        'id_estudiante_materia',
        'id_estudiante',
        'id_materia',
        'nota_parcial_1',
        'nota_parcial_2',
        'nota_final',
        'anio_cursada'
      ]
    });

    // 1) Crear conejos directamente ASIGNADOS (1 por nota no nula)
    console.log("🐇 Generando conejos asignados (uno por cada nota no nula)...");
    let placaIndex = 0;
    let asignadosCount = 0;
    const asignadosBatch = [];

    function tipoParaNota(n) {
      if (n <= 3) return 'Adulto';
      if (n <= 7) return 'Joven';
      return 'Bebe';
    }

    for (const em of historial) {
      const notas = [
        { val: em.nota_parcial_1, label: 'Parcial 1' },
        { val: em.nota_parcial_2, label: 'Parcial 2' },
        { val: em.nota_final,    label: 'Final' }
      ];

      for (const nObj of notas) {
        const n = nObj.val;
        if (n === null || n === undefined) continue;

        const tipoNombre = tipoParaNota(Number(n));
        const id_tipo = tipoMap[tipoNombre] || null;

        asignadosBatch.push({
          id_estudiante_materia: getId(em, 'id_estudiante_materia', 'id'),
          id_estudiante: getId(em, 'id_estudiante', 'id_estudiante', 'id'),
          id_materia: getId(em, 'id_materia', 'id'),
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
        asignadosCount++;

        if (asignadosBatch.length >= ASSIGN_CHUNK) {
          await Conejo.bulkCreate(asignadosBatch.splice(0, asignadosBatch.length), { validate: false, hooks: false });
        }
      }
    }

    if (asignadosBatch.length) {
      await Conejo.bulkCreate(asignadosBatch, { validate: false, hooks: false });
      asignadosBatch.length = 0;
    }

    console.log(`🐇✔ Concluido: conejos asignados creados = ${asignadosCount.toLocaleString()}`);

    // 2) Crear conejos libres restantes hasta TOTAL
    const restantes = TOTAL - asignadosCount;
    if (restantes <= 0) {
      console.log(`⚠️ Ya tenés ${asignadosCount.toLocaleString()} conejos asignados >= ${TOTAL.toLocaleString()}`);
    } else {
      console.log(`🐇 Creando ${restantes.toLocaleString()} conejos libres en batches de ${FREE_CHUNK.toLocaleString()}...`);
      let creados = 0;
      const freeBatch = [];
      for (let i = 0; i < restantes; i++) {
        freeBatch.push({
          id_estudiante: null,
          id_materia: null,
          id_tipo: null,
          id_estudiante_materia: null,
          anio_cursada: null,
          nota_origen: null,
          placa: generarPlaca(placaIndex),
          fecha_asignacion: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        placaIndex++;
        if (freeBatch.length >= FREE_CHUNK) {
          await Conejo.bulkCreate(freeBatch.splice(0, freeBatch.length), { validate: false, hooks: false });
          creados += FREE_CHUNK;
          if (creados % 200_000 === 0) {
            console.log(` → ${creados.toLocaleString()} conejos libres creados...`);
          }
        }
      }
      if (freeBatch.length) {
        await Conejo.bulkCreate(freeBatch, { validate: false, hooks: false });
        creados += freeBatch.length;
      }
      console.log(`🐇✔ Finalizado: conejos libres creados = ${creados.toLocaleString()}`);
    }

    // 3) resumen final
    const totalEnTabla = await Conejo.count();
    console.log(`🐇🟢 PROCESO COMPLETO. Total conejos en tabla: ${totalEnTabla.toLocaleString()} (esperado: ${TOTAL.toLocaleString()})`);
  },

  down: async () => {
    console.log("🐇 Revirtiendo: truncando tabla conejos...");
    await Conejo.destroy({ truncate: true, restartIdentity: true });
    console.log("🐇✔ Conejos eliminados.");
  }
};
