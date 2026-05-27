const express = require("express");
const router = express.Router();
const historialController = require("../controllers/historialController");

router.get("/:id", historialController.getHistorial);

module.exports = router;
