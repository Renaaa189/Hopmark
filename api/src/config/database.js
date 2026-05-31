const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "universidad",  // DB NAME
  "root",         // DB USER
  "",         // DB PASS
  {
    host: "localhost",
    dialect: "mysql",
    logging: false,
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000,
      evict: 10000
    },
    define: {
      timestamps: false,
      underscored: true
    }
  }
);

module.exports = sequelize;
