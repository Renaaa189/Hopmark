// src/services/validacionService.js

module.exports = {
  
  validarNota(nota) {
    if (nota === null || nota === undefined) return false;
    if (isNaN(nota)) return false;
    return nota >= 0 && nota <= 10;
  },

  validarNotas({ nota_1, nota_2, nota_final }) {
    return (
      this.validarNota(nota_1) &&
      this.validarNota(nota_2) &&
      this.validarNota(nota_final)
    );
  },

  validarEstudiante(estudiante) {
    if (!estudiante) return false;
    return !!estudiante.nombre && !!estudiante.dni;
  }

};
