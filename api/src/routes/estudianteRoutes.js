const express = require("express");
const router = express.Router();
const estudianteController = require("../controllers/estudianteController");

// -----------------------------
// ORDEN CORRECTO (esto arregla TODO)
// -----------------------------

// 1) Buscar por DNI (siempre antes del /:id)
router.get("/dni/:dni", estudianteController.getByDni);

// 2) Rutas relacionadas (antes del /:id)
router.get("/:id/materias", estudianteController.materiasPorAnio);
router.get("/:id/conejos", estudianteController.conejosPorAnio);
router.get("/:id/historial", estudianteController.historialAcademico);
router.post("/:id/asignar-materias", estudianteController.asignarMaterias);

// 3) CRUD con /:id al final
router.get("/", estudianteController.getAll);
router.get("/:id", estudianteController.getById);
router.post("/", estudianteController.create);
router.put("/:id", estudianteController.update);
router.delete("/:id", estudianteController.delete);

module.exports = router;
