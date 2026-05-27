const express = require("express");
const router = express.Router();
const materiaController = require("../controllers/materiaController");

router.get("/", materiaController.getAll);
router.get("/:id", materiaController.getById);
router.post("/", materiaController.create);
router.put("/:id", materiaController.update);
router.delete("/:id", materiaController.delete);

module.exports = router;
