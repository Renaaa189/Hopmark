const express = require("express");
const router = express.Router();
const carreraController = require("../controllers/carreraController");

router.get("/", carreraController.getAll);
router.get("/:id", carreraController.getById);
router.post("/", carreraController.create);
router.put("/:id", carreraController.update);
router.delete("/:id", carreraController.delete);

module.exports = router;
