// api/src/models/Estudiante_Carrera.js
module.exports = (sequelize, DataTypes) => {
  const Estudiante_Carrera = sequelize.define('Estudiante_Carrera', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_estudiante: { type: DataTypes.INTEGER, allowNull: false },
    id_carrera: { type: DataTypes.INTEGER, allowNull: false },
    anio_ingreso: { type: DataTypes.INTEGER, allowNull: true },
    anio_actual: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    estado: { type: DataTypes.ENUM('activo','pausado','egresado'), defaultValue: 'activo' },
    regularidad: { type: DataTypes.STRING(50), defaultValue: 'Regular' }
  }, {
    tableName: 'estudiante_carreras',
    indexes: [{ fields: ['id_estudiante'] }, { fields: ['id_carrera'] }]
  });

  Estudiante_Carrera.associate = (models) => {
    Estudiante_Carrera.belongsTo(models.Estudiante, { foreignKey: 'id_estudiante', as: 'estudiante' });
    Estudiante_Carrera.belongsTo(models.Carrera, { foreignKey: 'id_carrera', as: 'carrera' });
    Estudiante_Carrera.hasMany(models.Estudiante_Materia, { foreignKey: 'id_estudiante_carrera', as: 'materias_historial' });
  };

  return Estudiante_Carrera;
};
