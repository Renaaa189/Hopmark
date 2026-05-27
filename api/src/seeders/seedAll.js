// api/src/seeders/seedAll.js
// Ejecutar desde carpeta api: node src/seeders/seedAll.js

require('dotenv').config();
const path = require('path');
const { faker } = require('@faker-js/faker');

const db = require(path.join(__dirname, '..', 'models'));
const {
  sequelize,
  Universidad,
  Carrera,
  Materia,
  Estudiante,
  Estudiante_Carrera,
  Estudiante_Materia,
  TipoConejo,
  Conejo
} = db;

/** CONFIG */
const DISTRIB = { medicina: 800, ingenieria: 700, economia: 500 }; // total 2000
const BATCH_SIZE = 1000;

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// helper defensivo para obtener id de modelo (soporta id / id_xxx / idXxx)
function getId(obj, ...possible) {
  for (const p of possible) {
    if (obj == null) continue;
    if (obj[p] !== undefined && obj[p] !== null) return obj[p];
  }
  // fallback common fields
  return obj && (obj.id || obj.id_materia || obj.id_carrera || obj.id_estudiante || obj.id_estudiante_materia) || null;
}

// ======================
// Generador de placas
// ======================
// Usamos 5 letras A-Z -> 26^5 = 11.881.376 combinaciones (más que suficiente para 4M)
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

// ======================
// Función para crear conejos (fuera de la gran transacción)
// ======================
async function crearConejosAsignadosYLibres(TOTAL = 4_000_000) {
  console.log("🐇 Iniciando creación masiva de conejos (asignados + libres)");

  // Si Tipos no existen, los creamos (idempotente)
  const tipos = [
    { nombre: 'Adulto', descripcion: 'Notas 1-3' },
    { nombre: 'Joven', descripcion: 'Notas 4-7' },
    { nombre: 'Bebe', descripcion: 'Notas 8-10' }
  ];
  await TipoConejo.bulkCreate(tipos, { ignoreDuplicates: true }).catch(() => {});
  const tiposDB = await TipoConejo.findAll();
  const tipoMap = {};
  tiposDB.forEach(tt => tipoMap[tt.nombre] = getId(tt, 'id_tipo', 'id'));

  // Traemos solo las columnas que necesitamos del historial
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
    ],
    raw: true
  });

  // Parámetros de batch
  const ASSIGN_CHUNK = 5000;
  const FREE_CHUNK = 10000;

  // 1) Crear conejos asignados (1 por nota no nula)
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
        id_estudiante: getId(em, 'id_estudiante', 'estudiante_id', 'id'),
        id_materia: getId(em, 'id_materia', 'materia_id', 'id'),
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
        // bulkCreate parcial
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
}

// ======================
// RUN: crear datos + conejos
// ======================
async function run() {
  console.log('🔄 Iniciando seedAll inteligente (creación de datos) ...');
  try {
    // 1) reset DB (recrear tablas)
    console.log('🔁 sync({force:true}) — recreando tablas desde modelos');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    await sequelize.sync({ force: true });

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2) universidades
    console.log('🏫 creando universidades...');
    const uniRows = [
      { nombre: 'UBA', telefono: '', direccion: '' },
      { nombre: 'UTN', telefono: '', direccion: '' },
      { nombre: 'UADE', telefono: '', direccion: '' }
    ];
    const unis = await Universidad.bulkCreate(uniRows, { returning: true });

    // 3) carreras (mantener orden: 1 Medicina, 2 Ingenieria, 3 Economia)
    console.log('🎓 creando carreras...');
    const carrerasRows = [
      { nombre: 'Medicina', duracion: 6, id_universidad: getId(unis[0], 'id_universidad', 'id') || 1 },
      { nombre: 'Ingeniería en Sistemas', duracion: 5, id_universidad: getId(unis[1], 'id_universidad', 'id') || 2 },
      { nombre: 'Economía / Contador Público', duracion: 5, id_universidad: getId(unis[2], 'id_universidad', 'id') || 3 }
    ];
    const carreras = await Carrera.bulkCreate(carrerasRows, { returning: true });

    // helper map carrera name -> id
    const carreraMap = {
      medicina: getId(carreras[0], 'id_carrera', 'id') || 1,
      ingenieria: getId(carreras[1], 'id_carrera', 'id') || 2,
      economia: getId(carreras[2], 'id_carrera', 'id') || 3
    };

    // 4) materias (usa la lista completa que ya tenías)
    console.log('📚 creando materias completas...');
    const materiasData = [
      // MEDICINA (lista completa — reemplaza/añade si querés más)
      { nombre: 'Química', anio_cursada: 1, id_carrera: carreraMap.medicina },
      { nombre: 'Introducción al Conocimiento de la Sociedad y el Estado', anio_cursada: 1, id_carrera: carreraMap.medicina },
      { nombre: 'Introducción al Pensamiento Científico', anio_cursada: 1, id_carrera: carreraMap.medicina },
      { nombre: 'Matemática', anio_cursada: 1, id_carrera: carreraMap.medicina },
      { nombre: 'Física e Introducción a la Biofísica', anio_cursada: 1, id_carrera: carreraMap.medicina },
      { nombre: 'Biología e Introducción a la Biología Celular', anio_cursada: 1, id_carrera: carreraMap.medicina },
      { nombre: 'Anatomía', anio_cursada: 1, id_carrera: carreraMap.medicina },
      { nombre: 'Histología - Biología Celular - Embriología - Genética', anio_cursada: 1, id_carrera: carreraMap.medicina },
      { nombre: 'Salud Mental', anio_cursada: 1, id_carrera: carreraMap.medicina },
      { nombre: 'Bioética I', anio_cursada: 1, id_carrera: carreraMap.medicina },
      { nombre: 'Medicina Familiar I', anio_cursada: 1, id_carrera: carreraMap.medicina },
      { nombre: 'Química Biológica', anio_cursada: 2, id_carrera: carreraMap.medicina },
      { nombre: 'Fisiología y Biofísica', anio_cursada: 2, id_carrera: carreraMap.medicina },
      { nombre: 'Microbiología - Parasitología - Inmunología', anio_cursada: 3, id_carrera: carreraMap.medicina },
      { nombre: 'Patología I', anio_cursada: 3, id_carrera: carreraMap.medicina },
      { nombre: 'Farmacología I', anio_cursada: 3, id_carrera: carreraMap.medicina },
      { nombre: 'Medicina 1 (Semiología - Fisiopatología)', anio_cursada: 4, id_carrera: carreraMap.medicina },
      { nombre: 'Patología II', anio_cursada: 4, id_carrera: carreraMap.medicina },
      { nombre: 'Farmacología II', anio_cursada: 4, id_carrera: carreraMap.medicina },
      { nombre: 'Salud Pública I', anio_cursada: 4, id_carrera: carreraMap.medicina },
      { nombre: 'Bioética II', anio_cursada: 4, id_carrera: carreraMap.medicina },
      { nombre: 'Medicina 2 (Medicina Interna)', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Nutrición', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Diagnóstico por Imágenes', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Dermatología', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Infectología', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Neumonología', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Neurología', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Cirugía General', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Urología', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Ortopedia - Traumatología', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Oftalmología', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Otorrinolaringología', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Neurocirugía', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Obstetricia', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Ginecología', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Pediatría', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Salud Pública II', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Psiquiatría', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Medicina Legal - Deontología Médica', anio_cursada: 5, id_carrera: carreraMap.medicina },
      { nombre: 'Toxicología', anio_cursada: 5, id_carrera: carreraMap.medicina },
      // IAR prácticas (6)
      { nombre: 'Medicina (IAR)', anio_cursada: 6, id_carrera: carreraMap.medicina, tipo: 'Practica' },
      { nombre: 'Cirugía (IAR)', anio_cursada: 6, id_carrera: carreraMap.medicina, tipo: 'Practica' },
      { nombre: 'Tocoginecología (IAR)', anio_cursada: 6, id_carrera: carreraMap.medicina, tipo: 'Practica' },
      { nombre: 'Pediatría (IAR)', anio_cursada: 6, id_carrera: carreraMap.medicina, tipo: 'Practica' },
      { nombre: 'Salud Mental (IAR)', anio_cursada: 6, id_carrera: carreraMap.medicina, tipo: 'Practica' },
      { nombre: 'Atención Primaria en Áreas Progr. (Medicina Familiar II)', anio_cursada: 6, id_carrera: carreraMap.medicina, tipo: 'Practica' },

      // INGENIERÍA (ejemplos completos)
      { nombre: 'Sistemas y Procesos de Negocio', anio_cursada: 1, id_carrera: carreraMap.ingenieria },
      { nombre: 'Introducción a la Programación', anio_cursada: 1, id_carrera: carreraMap.ingenieria },
      { nombre: 'Matemática I', anio_cursada: 1, id_carrera: carreraMap.ingenieria },
      { nombre: 'Análisis Matemático II', anio_cursada: 2, id_carrera: carreraMap.ingenieria },
      { nombre: 'Física II', anio_cursada: 2, id_carrera: carreraMap.ingenieria },
      { nombre: 'Ingeniería y Sociedad', anio_cursada: 2, id_carrera: carreraMap.ingenieria },
      { nombre: 'Inglés II', anio_cursada: 2, id_carrera: carreraMap.ingenieria },
      { nombre: 'Sintaxis y Semántica de los Lenguajes', anio_cursada: 2, id_carrera: carreraMap.ingenieria },
      { nombre: 'Paradigmas de Programación', anio_cursada: 2, id_carrera: carreraMap.ingenieria },
      { nombre: 'Sistemas Operativos', anio_cursada: 2, id_carrera: carreraMap.ingenieria },
      { nombre: 'Análisis de Sistemas de Información', anio_cursada: 2, id_carrera: carreraMap.ingenieria },
      { nombre: 'Probabilidad y Estadística', anio_cursada: 3, id_carrera: carreraMap.ingenieria },
      { nombre: 'Economía', anio_cursada: 3, id_carrera: carreraMap.ingenieria },
      { nombre: 'Bases de Datos', anio_cursada: 3, id_carrera: carreraMap.ingenieria },
      { nombre: 'Desarrollo de Software', anio_cursada: 3, id_carrera: carreraMap.ingenieria },
      { nombre: 'Comunicación de Datos', anio_cursada: 3, id_carrera: carreraMap.ingenieria },
      { nombre: 'Análisis Numérico', anio_cursada: 3, id_carrera: carreraMap.ingenieria },
      { nombre: 'Diseño de Sistemas de Información', anio_cursada: 3, id_carrera: carreraMap.ingenieria },
      { nombre: 'Legislación', anio_cursada: 4, id_carrera: carreraMap.ingenieria },
      { nombre: 'Ingeniería y Calidad de Software', anio_cursada: 4, id_carrera: carreraMap.ingenieria },
      { nombre: 'Redes de Datos', anio_cursada: 4, id_carrera: carreraMap.ingenieria },
      { nombre: 'Investigación Operativa', anio_cursada: 4, id_carrera: carreraMap.ingenieria },
      { nombre: 'Simulación', anio_cursada: 4, id_carrera: carreraMap.ingenieria },
      { nombre: 'Tecnologías para la automatización', anio_cursada: 4, id_carrera: carreraMap.ingenieria },
      { nombre: 'Administración de Sistemas de Información', anio_cursada: 4, id_carrera: carreraMap.ingenieria },
      { nombre: 'Inteligencia Artificial', anio_cursada: 5, id_carrera: carreraMap.ingenieria },
      { nombre: 'Ciencia de Datos', anio_cursada: 5, id_carrera: carreraMap.ingenieria },
      { nombre: 'Sistemas de Gestión', anio_cursada: 5, id_carrera: carreraMap.ingenieria },
      { nombre: 'Gestión Gerencial', anio_cursada: 5, id_carrera: carreraMap.ingenieria },
      { nombre: 'Seguridad en los Sistemas de Información', anio_cursada: 5, id_carrera: carreraMap.ingenieria },
      { nombre: 'Proyecto Final', anio_cursada: 5, id_carrera: carreraMap.ingenieria },

      // ECONOMIA (ejemplos)
      { nombre: 'Introducción al Pensamiento Crítico', anio_cursada: 1, id_carrera: carreraMap.economia },
      { nombre: 'Introducción a la Economía', anio_cursada: 1, id_carrera: carreraMap.economia },
      { nombre: 'Análisis Matemático I', anio_cursada: 1, id_carrera: carreraMap.economia },
      { nombre: 'Administración I', anio_cursada: 1, id_carrera: carreraMap.economia },
      { nombre: 'Derecho I', anio_cursada: 1, id_carrera: carreraMap.economia },
      { nombre: 'Estructura Económica Territorial', anio_cursada: 1, id_carrera: carreraMap.economia },
      { nombre: 'Análisis Matemático II', anio_cursada: 1, id_carrera: carreraMap.economia },
      { nombre: 'Contabilidad I', anio_cursada: 1, id_carrera: carreraMap.economia },
      { nombre: 'Filosofía Política y Social', anio_cursada: 2, id_carrera: carreraMap.economia },
      { nombre: 'Historia Económica Argentina y Mundial', anio_cursada: 2, id_carrera: carreraMap.economia },
      { nombre: 'Estadística', anio_cursada: 2, id_carrera: carreraMap.economia },
      { nombre: 'Finanzas', anio_cursada: 2, id_carrera: carreraMap.economia },
      { nombre: 'Derecho II', anio_cursada: 2, id_carrera: carreraMap.economia },
      { nombre: 'Economía de Empresas', anio_cursada: 2, id_carrera: carreraMap.economia },
      { nombre: 'Contabilidad II', anio_cursada: 2, id_carrera: carreraMap.economia },
      { nombre: 'Administración II', anio_cursada: 2, id_carrera: carreraMap.economia },
      { nombre: 'Teoría y Política Macroeconómica', anio_cursada: 3, id_carrera: carreraMap.economia },
      { nombre: 'Marketing y Análisis de los Mercados', anio_cursada: 3, id_carrera: carreraMap.economia },
      { nombre: 'Costos', anio_cursada: 3, id_carrera: carreraMap.economia },
      { nombre: 'Administración III', anio_cursada: 3, id_carrera: carreraMap.economia },
      { nombre: 'Derecho III', anio_cursada: 3, id_carrera: carreraMap.economia },
      { nombre: 'Proyectos de Inversión', anio_cursada: 3, id_carrera: carreraMap.economia },
      { nombre: 'Impuestos', anio_cursada: 3, id_carrera: carreraMap.economia },
      { nombre: 'Administración IV', anio_cursada: 3, id_carrera: carreraMap.economia },
      { nombre: 'Investigación Operativa', anio_cursada: 4, id_carrera: carreraMap.economia },
      { nombre: 'Contabilidad Gerencial', anio_cursada: 4, id_carrera: carreraMap.economia },
      { nombre: 'Administración V', anio_cursada: 4, id_carrera: carreraMap.economia },
      { nombre: 'Dirección General', anio_cursada: 4, id_carrera: carreraMap.economia },
      { nombre: 'Simulación de Negocios', anio_cursada: 4, id_carrera: carreraMap.economia },
      { nombre: 'Administración VI', anio_cursada: 4, id_carrera: carreraMap.economia },
      { nombre: 'Sistemas de Costos y Gestión', anio_cursada: 5, id_carrera: carreraMap.economia },
      { nombre: 'Técnica Impositiva', anio_cursada: 5, id_carrera: carreraMap.economia },
      { nombre: 'Estados Contables', anio_cursada: 5, id_carrera: carreraMap.economia },
      { nombre: 'Sindicatura Concursal y Actuación en la Justicia', anio_cursada: 5, id_carrera: carreraMap.economia },
      { nombre: 'Contabilidad y Presupuesto en Actividades Diferenciadas', anio_cursada: 5, id_carrera: carreraMap.economia },
      { nombre: 'Auditoría', anio_cursada: 5, id_carrera: carreraMap.economia },
      { nombre: 'Contabilidad y Presupuesto en el Sector Público', anio_cursada: 5, id_carrera: carreraMap.economia }
    ];

    // default tipo = 'Teorica'
    materiasData.forEach(m => { if (!m.tipo) m.tipo = 'Teorica'; });

    // bulk create materias en batches
    for (let i = 0; i < materiasData.length; i += BATCH_SIZE) {
      await Materia.bulkCreate(materiasData.slice(i, i + BATCH_SIZE));
    }

    const materiasAll = await Materia.findAll();

    // 5) tipos de conejos (los creamos ya, pero la generación masiva la haremos fuera del transaction)
    console.log('🐇 creando tipos de conejos (registro)...');
    const tiposRows = [
      { nombre: 'Adulto', descripcion: 'Notas 1-3' },
      { nombre: 'Joven', descripcion: 'Notas 4-7' },
      { nombre: 'Bebe', descripcion: 'Notas 8-10' }
    ];
    await TipoConejo.bulkCreate(tiposRows, { ignoreDuplicates: true });

    // 6) crear 2000 estudiantes
    console.log('👩‍🎓 generando 2000 estudiantes...');
    const total = DISTRIB.medicina + DISTRIB.ingenieria + DISTRIB.economia;
    const estudiantesRows = [];
    const nombres = ['Sofía','Valentina','Camila','Martina','Isabella','Mateo','Benjamín','Santiago','Luca','Matías','Juan','Pedro','Lucía','Julieta','Agustina','Nicolás','Facundo','Agustín','Franco','Federico'];
    const apellidos = ['González','Rodríguez','Gómez','Fernández','López','Martínez','García','Silva','Pérez','Díaz','Rossi','Vázquez','Sánchez','Torres','Álvarez'];

    for (let i = 0; i < total; i++) {
      estudiantesRows.push({
        dni: String(30000000 + i),
        nombre: nombres[rnd(0, nombres.length - 1)],
        apellido: apellidos[rnd(0, apellidos.length - 1)],
        direccion: faker.location.streetAddress(),
        telefono: faker.phone.number('9########'),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    const estudiantesInsertados = await Estudiante.bulkCreate(estudiantesRows, { returning: true});

    // 7) asignar estudiante_carrera (por bloques)
    console.log('🧾 asignando estudiantes a carreras (estudiante_carreras)...');
    const estudianteCarreraRows = [];
    let idx = 0;

    // Medicina
    for (let i = 0; i < DISTRIB.medicina; i++, idx++) {
      const est = estudiantesInsertados[idx];
      const anio_actual = rnd(1, carreras[0].duracion || 6);
      estudianteCarreraRows.push({
        id_estudiante: getId(est, 'id_estudiante', 'id'),
        id_carrera: carreraMap.medicina,
        anio_ingreso: new Date().getFullYear() - (anio_actual - 1),
        anio_actual,
        estado: 'activo',
        regularidad: 'Regular',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    // Ingeniería
    for (let i = 0; i < DISTRIB.ingenieria; i++, idx++) {
      const est = estudiantesInsertados[idx];
      const anio_actual = rnd(1, carreras[1].duracion || 5);
      estudianteCarreraRows.push({
        id_estudiante: getId(est, 'id_estudiante', 'id'),
        id_carrera: carreraMap.ingenieria,
        anio_ingreso: new Date().getFullYear() - (anio_actual - 1),
        anio_actual,
        estado: 'activo',
        regularidad: 'Regular',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    // Economía
    for (let i = 0; i < DISTRIB.economia; i++, idx++) {
      const est = estudiantesInsertados[idx];
      const anio_actual = rnd(1, carreras[2].duracion || 5);
      estudianteCarreraRows.push({
        id_estudiante: getId(est, 'id_estudiante', 'id'),
        id_carrera: carreraMap.economia,
        anio_ingreso: new Date().getFullYear() - (anio_actual - 1),
        anio_actual,
        estado: 'activo',
        regularidad: 'Regular',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await Estudiante_Carrera.bulkCreate(estudianteCarreraRows, { returning: true });
    const estCarrDB = await Estudiante_Carrera.findAll();

    // 8) generar Estudiante_Materia: para cada estudiante_carrera, crear materias con anio <= anio_actual
    console.log('📑 generando estudiante_materias (historial) — puede tardar unos momentos...');
    const estMatRows = [];

    // agrupar materias por carrera (por id numérico)
    const materiasByCarr = {};
    materiasAll.forEach(m => {
      const idCarr = getId(m, 'id_carrera', 'carrera_id', 'carreraId');
      if (!materiasByCarr[idCarr]) materiasByCarr[idCarr] = [];
      materiasByCarr[idCarr].push(m);
    });

    for (const esc of estCarrDB) {
      const id_est = getId(esc, 'id_estudiante', 'estudiante_id', 'id');
      const id_carr = getId(esc, 'id_carrera', 'carrera_id', 'id_carrera');
      const anio_actual = esc.anio_actual;
      const lista = materiasByCarr[id_carr] || [];

      // IMPORTANT: asignar TODAS las materias del año y anteriores
      for (const m of lista) {
        const anioMateria = m.anio_cursada || m.anio || m.anioCursada || 1;
        if (anioMateria > anio_actual) continue;

        const n1 = rnd(1, 10);
        const n2 = rnd(1, 10);
        const nf = rnd(1, 10);
        const prom = Math.round(((n1 + n2 + nf) / 3) * 10) / 10;

        estMatRows.push({
          id_estudiante: id_est,
          id_materia: getId(m, 'id_materia', 'id'),
          id_estudiante_carrera: getId(esc, 'id', 'id_estudiante_carrera'),
          anio_cursada: anioMateria,
          nota_parcial_1: n1,
          nota_parcial_2: n2,
          nota_final: nf,
          estado_regularidad: prom >= 4 ? 'Regular' : 'Libre',
          estado_materia: prom >= 8 ? 'Promocionada' : (prom >= 4 ? 'Aprobada' : 'Reprobada'),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // flush en batches para no quedarnos sin memoria
      if (estMatRows.length >= 2000) {
        const chunk = estMatRows.splice(0, 2000);
        await Estudiante_Materia.bulkCreate(chunk);
      }
    }
    if (estMatRows.length) {
      await Estudiante_Materia.bulkCreate(estMatRows);
    }

    // 9) asegurar minimo 23 alumnos por materia
    console.log('🔎 verificando mínimo 23 alumnos por materia...');
    const allMateriasDB = await Materia.findAll();
    for (const mat of allMateriasDB) {
      const matId = getId(mat, 'id_materia', 'id');
      const anioMat = mat.anio_cursada || mat.anio || 1;
      const count = await Estudiante_Materia.count({ where: { id_materia: matId } });
      if (count >= 23) continue;

      const faltan = 23 - count;
      const candidatos = await sequelize.query(
        `SELECT ec.id_estudiante, ec.id AS id_estudiante_carrera, ec.anio_actual
         FROM estudiante_carreras ec
         WHERE ec.id_carrera = :id_carrera AND ec.anio_actual >= :anio
         AND ec.id_estudiante NOT IN (
           SELECT em.id_estudiante FROM estudiante_materias em WHERE em.id_materia = :id_materia
         )
         LIMIT :limit`, {
          replacements: { id_carrera: mat.id_carrera, anio: anioMat, id_materia: matId, limit: faltan * 5 },
          type: sequelize.QueryTypes.SELECT,

        }
      );

      let seleccion = candidatos.slice(0, faltan);
      if (seleccion.length < faltan) {
        const candidatos2 = await sequelize.query(
          `SELECT ec.id_estudiante, ec.id AS id_estudiante_carrera, ec.anio_actual
           FROM estudiante_carreras ec
           WHERE ec.id_carrera = :id_carrera
           AND ec.id_estudiante NOT IN (SELECT em.id_estudiante FROM estudiante_materias em WHERE em.id_materia = :id_materia)
           LIMIT :limit`, {
            replacements: { id_carrera: mat.id_carrera, id_materia: matId, limit: faltan },
            type: sequelize.QueryTypes.SELECT,

          }
        );
        seleccion = seleccion.concat(candidatos2).slice(0, faltan);
      }

      const nuevas = [];
      for (const s of seleccion) {
        const n1 = rnd(1, 10);
        const n2 = rnd(1, 10);
        const nf = rnd(1, 10);
        const prom = Math.round(((n1 + n2 + nf) / 3) * 10) / 10;
        nuevas.push({
          id_estudiante: s.id_estudiante,
          id_materia: matId,
          id_estudiante_carrera: s.id_estudiante_carrera || null,
          anio_cursada: anioMat,
          nota_parcial_1: n1,
          nota_parcial_2: n2,
          nota_final: nf,
          estado_regularidad: prom >= 4 ? 'Regular' : 'Libre',
          estado_materia: prom >= 8 ? 'Promocionada' : (prom >= 4 ? 'Aprobada' : 'Reprobada'),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      if (nuevas.length) await Estudiante_Materia.bulkCreate(nuevas);
    }

    // commit de la creación de datos (antes de la masiva de conejos)
    console.log('✅ Datos base creados y commit realizados. Ahora voy a crear los 4M de conejos (fuera de la transacción).');

    // 10) Crear conejos asignados y libres (fuera de la transacción)
    await crearConejosAsignadosYLibres(4_000_000);

    console.log('✅ Seed completo: universidades, carreras, materias, 2000 estudiantes, historial y 4M conejos generados correctamente.');
    process.exit(0);

  } catch (err) {
    // si está abierta la transacción, la deshacemos
    try { rollback() } catch (e) {}
    console.error('❌ Error en seedAll:', err);
    process.exit(1);
  }
}

module.exports = run; 