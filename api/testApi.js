const axios = require("axios");  

const BASE_URL = "http://localhost:3000/api";

async function test() {
  try {
    console.log("✅ Probando API...");

    // --- 1️⃣ Estudiantes ---
    console.log("\n--- Estudiantes ---");
    
    // Crear estudiante (con todos los campos obligatorios)
    let estudiante = (await axios.post(`${BASE_URL}/estudiantes`, {
      nombre: "Estudiante Test",
      apellido: "Apellido Test",
      dni: "12345678"
    })).data;
    console.log("Creado:", estudiante);

    // Obtener todos
    let allEstudiantes = (await axios.get(`${BASE_URL}/estudiantes`)).data;
    console.log("Total estudiantes:", allEstudiantes.length);

    // Obtener por ID
    let getEst = (await axios.get(`${BASE_URL}/estudiantes/${estudiante.id_estudiante}`)).data;
    console.log("Obtenido por ID:", getEst.nombre, getEst.apellido);

    // Actualizar
    let updated = (await axios.put(`${BASE_URL}/estudiantes/${estudiante.id_estudiante}`, {
      nombre: "Estudiante Test Actualizado",
      apellido: "Apellido Actualizado"
    })).data;
    console.log("Actualizado:", updated.nombre, updated.apellido);

    // Asignar materias (IDs 1,2)
    await axios.post(`${BASE_URL}/estudiantes/${estudiante.id_estudiante}/asignar-materias`, {
      materias: [1,2]
    });
    console.log("Materias asignadas");

    // Historial
    let historial = (await axios.get(`${BASE_URL}/estudiantes/${estudiante.id_estudiante}/historial`)).data;
    console.log("Historial obtenido. Materias:", historial.est_materias ? historial.est_materias.length : 0);

    // --- 2️⃣ Carreras ---
    console.log("\n--- Carreras ---");
    let carrera = (await axios.post(`${BASE_URL}/carreras`, { nombre: "Carrera Test" })).data;
    console.log("Carrera creada:", carrera.nombre);

    let carreras = (await axios.get(`${BASE_URL}/carreras`)).data;
    console.log("Total carreras:", carreras.length);

    // --- 3️⃣ Materias ---
    console.log("\n--- Materias ---");
    let materia = (await axios.post(`${BASE_URL}/materias`, { nombre: "Materia Test" })).data;
    console.log("Materia creada:", materia.nombre);

    let materias = (await axios.get(`${BASE_URL}/materias`)).data;
    console.log("Total materias:", materias.length);

    // --- 4️⃣ Conejos ---
    console.log("\n--- Conejos ---");
    // Crear conejo
    let conejo = (await axios.post(`${BASE_URL}/conejos`, {
      id_estudiante: estudiante.id_estudiante,
      id_materia: materia.id_materia,
      puntaje: 8,
      id_tipo: 1
    })).data;
    console.log("Conejo creado:", conejo.id);

    // Generar conejos desde notas
    let generado = (await axios.post(`${BASE_URL}/conejos/asignar`)).data;
    console.log("Generación automática:", generado.total);

    // Obtener todos
    let allConejos = (await axios.get(`${BASE_URL}/conejos`)).data;
    console.log("Total conejos:", allConejos.length);

    console.log("\n🎉 Todas las rutas probadas correctamente!");
    
  } catch (err) {
    if (err.response) {
      console.error("Error en request:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

test();
