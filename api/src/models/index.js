// api/src/models/index.js
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database'); // ajusta la ruta si usás /config

const db = { sequelize, Sequelize };

// importa modelos (lista explícita para control)
db.Estudiante = require('./Estudiante')(sequelize, Sequelize.DataTypes);
db.Universidad = require('./Universidad')(sequelize, Sequelize.DataTypes);
db.Carrera = require('./Carrera')(sequelize, Sequelize.DataTypes);
db.Materia = require('./Materia')(sequelize, Sequelize.DataTypes);
db.Correlatividad = require('./Correlatividad')(sequelize, Sequelize.DataTypes);
db.Estudiante_Carrera = require('./Estudiante_Carrera')(sequelize, Sequelize.DataTypes);
db.Estudiante_Materia = require('./Estudiante_Materia')(sequelize, Sequelize.DataTypes);
db.TipoConejo = require('./TipoConejo')(sequelize, Sequelize.DataTypes);
db.Conejo = require('./Conejo')(sequelize, Sequelize.DataTypes);

// Ejecutar asociaciones si existen
Object.keys(db).forEach((modelName) => {
  if (db[modelName] && typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

module.exports = db;
