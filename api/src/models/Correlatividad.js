// api/src/models/Correlatividad.js
module.exports = (sequelize, DataTypes) => {
  const Correlatividad = sequelize.define('Correlatividad', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_materia: { type: DataTypes.INTEGER, allowNull: false },
    id_materia_correlativa: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'correlatividades',
    indexes: [{ fields: ['id_materia'] }, { fields: ['id_materia_correlativa'] }]
  });

  Correlatividad.associate = (models) => {
    Correlatividad.belongsTo(models.Materia, { foreignKey: 'id_materia', as: 'materia' });
    Correlatividad.belongsTo(models.Materia, { foreignKey: 'id_materia_correlativa', as: 'materia_correlativa' });
  };

  return Correlatividad;
};
