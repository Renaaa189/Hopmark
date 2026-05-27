// api/src/models/Universidad.js
module.exports = (sequelize, DataTypes) => {
  const Universidad = sequelize.define('Universidad', {
    id_universidad: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    telefono: { type: DataTypes.STRING(50) },
    direccion: { type: DataTypes.STRING(255) }
  }, {
    tableName: 'universidades'
  });

  Universidad.associate = (models) => {
    Universidad.hasMany(models.Carrera, { foreignKey: 'id_universidad', as: 'carreras' });
  };

  return Universidad;
};
