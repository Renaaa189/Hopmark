// api/src/models/Materia.js
module.exports = (sequelize, DataTypes) => {
  const Materia = sequelize.define('Materia', {
    id_materia: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: { type: DataTypes.STRING(200), allowNull: false },
    anio_cursada: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.ENUM('Teorica','Practica'), allowNull: false },
    id_carrera: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'materias',
    indexes: [
      { fields: ['id_carrera'] },
      { fields: ['anio_cursada'] }
    ]
  });

  Materia.associate = (models) => {
    Materia.belongsTo(models.Carrera, { foreignKey: 'id_carrera', as: 'carrera' });
    Materia.hasMany(models.Estudiante_Materia, { foreignKey: 'id_materia', as: 'est_materias' });
    Materia.hasMany(models.Correlatividad, { foreignKey: 'id_materia', as: 'correlativas' });
    Materia.hasMany(models.Conejo, { foreignKey: 'id_materia', as: 'conejos' });
    // Relación many-to-many con Estudiante a través de Estudiante_Materia
    Materia.belongsToMany(models.Estudiante, {
      through: models.Estudiante_Materia,
      foreignKey: 'id_materia',
      otherKey: 'id_estudiante'
    });
  };

  return Materia;
};
