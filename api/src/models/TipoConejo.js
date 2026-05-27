// api/src/models/TipoConejo.js
module.exports = (sequelize, DataTypes) => {
  const TipoConejo = sequelize.define('TipoConejo', {
    id_tipo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    descripcion: { type: DataTypes.STRING(255) }
  }, {
    tableName: 'tipo_conejos'
  });

  TipoConejo.associate = (models) => {
    TipoConejo.hasMany(models.Conejo, { foreignKey: 'id_tipo', as: 'conejos' });
  };

  return TipoConejo;
};
