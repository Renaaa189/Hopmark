module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Materias', [
      { nombre: 'Anatomía', anio_cursada: 1, id_carrera: 1, createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Algoritmos', anio_cursada: 1, id_carrera: 2, createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Introducción a la Economía', anio_cursada: 1, id_carrera: 3, createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Materias', null, {});
  }
};
