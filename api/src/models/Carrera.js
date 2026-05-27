// api/src/models/Carrera.js
module.exports = (sequelize, DataTypes) => {
  const Carrera = sequelize.define('Carrera', {
    id_carrera: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    duracion: { type: DataTypes.INTEGER, allowNull: false },
    id_universidad: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'carreras',
    timestamps: true   // 🔥 IMPORTANTE
  });

  Carrera.associate = (models) => {
    Carrera.belongsTo(models.Universidad, { foreignKey: 'id_universidad', as: 'universidad' });
    Carrera.hasMany(models.Materia, { foreignKey: 'id_carrera', as: 'materias' });
    Carrera.hasMany(models.Estudiante_Carrera, { foreignKey: 'id_carrera', as: 'estudiantes_carrera' });
    // Relación many-to-many con Estudiante a través de Estudiante_Carrera
    Carrera.belongsToMany(models.Estudiante, {
      through: models.Estudiante_Carrera,
      foreignKey: 'id_carrera',
      otherKey: 'id_estudiante'
    });
  };

  return Carrera;
};
