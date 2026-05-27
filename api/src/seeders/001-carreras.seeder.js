module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Carreras', [
      { nombre: 'Medicina', createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Ingeniería en Sistemas', createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Economía', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Carreras', null, {});
  }
};
