const express = require("express");
const router = express.Router();
const conejoController = require("../controllers/conejoController");

// CRUD básico
router.get("/", conejoController.getAll);
router.get("/:id", conejoController.getById);
router.post("/", conejoController.create);
router.delete("/:id", conejoController.delete);

// Generación automática de conejos desde notas (bulk, con placas únicas)
router.post("/asignar", conejoController.asignarConejosDesdeNotas);

module.exports = router;
