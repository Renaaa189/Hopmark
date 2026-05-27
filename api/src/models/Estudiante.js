module.exports = (sequelize, DataTypes) => {
  const Estudiante = sequelize.define('Estudiante', {
    id_estudiante: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    dni: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    direccion: { type: DataTypes.STRING(255), allowNull: true },
    telefono: { type: DataTypes.STRING(50), allowNull: true },
    fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: true }
  }, {
    tableName: 'estudiantes',
    timestamps: true
  });

  Estudiante.associate = (models) => {
    // Pivote: estudiante -> estudiante_carreras / estudiante_materias
    Estudiante.hasMany(models.Estudiante_Carrera, { foreignKey: 'id_estudiante', as: 'estudiante_carreras' });
    Estudiante.hasMany(models.Estudiante_Materia, { foreignKey: 'id_estudiante', as: 'est_materias' });
    Estudiante.hasMany(models.Conejo, { foreignKey: 'id_estudiante', as: 'conejos' });

    // Relación many-to-many con Carrera y Materia (a través de tablas pivote)
    // Definimos belongsToMany para que podamos usar include: { model: Carrera } y include: { model: Materia }
    Estudiante.belongsToMany(models.Carrera, {
      through: models.Estudiante_Carrera,
      foreignKey: 'id_estudiante',
      otherKey: 'id_carrera'
    });

    Estudiante.belongsToMany(models.Materia, {
      through: models.Estudiante_Materia,
      foreignKey: 'id_estudiante',
      otherKey: 'id_materia'
    });
  };

  return Estudiante;
};
