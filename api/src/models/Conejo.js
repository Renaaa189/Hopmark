// api/src/models/Conejo.js
module.exports = (sequelize, DataTypes) => {
  const Conejo = sequelize.define('Conejo', {
    id_conejo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    id_estudiante: { type: DataTypes.INTEGER, allowNull: true },
    id_materia: { type: DataTypes.INTEGER, allowNull: true },
    id_tipo: { type: DataTypes.INTEGER, allowNull: true },

    id_estudiante_materia: { type: DataTypes.INTEGER, allowNull: true },

    anio_cursada: { type: DataTypes.INTEGER, allowNull: true },
    nota_origen: { type: DataTypes.FLOAT, allowNull: true },

    fecha_asignacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

    placa: {
      type: DataTypes.STRING(10),
      unique: true,
      allowNull: true
    }

  }, {
    tableName: 'conejos',
    indexes: [
      { fields: ['id_estudiante'] },
      { fields: ['id_tipo'] }
    ]
  });

  Conejo.associate = (models) => {
    Conejo.belongsTo(models.Estudiante, { foreignKey: 'id_estudiante', as: 'estudiante' });
    Conejo.belongsTo(models.Materia, { foreignKey: 'id_materia', as: 'materia' });
    Conejo.belongsTo(models.TipoConejo, { foreignKey: 'id_tipo', as: 'tipo' });
    Conejo.belongsTo(models.Estudiante_Materia, { foreignKey: 'id_estudiante_materia', as: 'estudiante_materia' });
  };

  return Conejo;
};
