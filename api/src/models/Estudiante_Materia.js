// api/src/models/Estudiante_Materia.js
module.exports = (sequelize, DataTypes) => {
  const Estudiante_Materia = sequelize.define('Estudiante_Materia', {
    id_estudiante_materia: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_estudiante: { type: DataTypes.INTEGER, allowNull: false },
    id_materia: { type: DataTypes.INTEGER, allowNull: false },
    id_estudiante_carrera: { type: DataTypes.INTEGER, allowNull: false }, // vínculo al ciclo/carrera
    anio_cursada: { type: DataTypes.INTEGER, allowNull: false },
    estado_regularidad: { type: DataTypes.ENUM('Regular','Libre','Condicional'), allowNull: false, defaultValue: 'Regular' },
    nota_parcial_1: { type: DataTypes.INTEGER, allowNull: true },
    nota_parcial_2: { type: DataTypes.INTEGER, allowNull: true },
    nota_final: { type: DataTypes.INTEGER, allowNull: true },
    estado_materia: { type: DataTypes.ENUM('Promocionada','Aprobada','Reprobada','Pendiente'), defaultValue: 'Pendiente' },
    fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'estudiante_materias',
    indexes: [
      { fields: ['id_estudiante'] },
      { fields: ['id_materia'] },
      { fields: ['id_estudiante_carrera'] }
    ]
  });

  Estudiante_Materia.associate = (models) => {
    Estudiante_Materia.belongsTo(models.Estudiante, { foreignKey: 'id_estudiante', as: 'estudiante' });
    Estudiante_Materia.belongsTo(models.Materia, { foreignKey: 'id_materia', as: 'materia' });
    Estudiante_Materia.belongsTo(models.Estudiante_Carrera, { foreignKey: 'id_estudiante_carrera', as: 'estudiante_carrera' });
    Estudiante_Materia.hasMany(models.Conejo, { foreignKey: 'id_estudiante_materia', as: 'conejos' });
  };

  return Estudiante_Materia;
};
