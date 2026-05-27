import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";


const API = "http://localhost:3000/api";

function App() {
  // =========================
  // STATES
  // =========================

  const [dni, setDni] = useState("");

  const [estudiante, setEstudiante] = useState(null);

  const [materias, setMaterias] = useState([]);
  const [conejos, setConejos] = useState([]);

  const [anioMaterias, setAnioMaterias] = useState(1);
  const [anioConejos, setAnioConejos] = useState(1);

  const [filtroMaterias, setFiltroMaterias] = useState("");
  const [filtroConejos, setFiltroConejos] = useState("");

  const [loading, setLoading] = useState(false);

  // =========================
  // BUSCAR ESTUDIANTE
  // =========================

  const buscarEstudiante = async () => {
    if (!dni.trim()) {
      alert("Ingresá un DNI");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(
        `${API}/estudiantes/dni/${dni}`
      );

      console.log("✅ Estudiante encontrado:", response.data);

      setEstudiante(response.data);

      // reiniciar datos
      setMaterias([]);
      setConejos([]);

      setAnioMaterias(1);
      setAnioConejos(1);

    } catch (error) {
      console.error(error);

      alert("Estudiante no encontrado");

      setEstudiante(null);
      setMaterias([]);
      setConejos([]);

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CARGAR MATERIAS
  // =========================

  const cargarMaterias = async () => {
    if (!estudiante?.id_estudiante) return;

    try {
      const response = await axios.get(
        `${API}/estudiantes/${estudiante.id_estudiante}/materias`,
        {
          params: {
            anio: anioMaterias,
            filtro: filtroMaterias
          }
        }
      );

      console.log("📚 Materias:", response.data);

      setMaterias(response.data.data || []);

    } catch (error) {
      console.error("❌ Error cargando materias:", error);
    }
  };

  // =========================
  // CARGAR CONEJOS
  // =========================

  const cargarConejos = async () => {
    if (!estudiante?.id_estudiante) return;

    try {
      const response = await axios.get(
        `${API}/estudiantes/${estudiante.id_estudiante}/conejos`,
        {
          params: {
            anio: anioConejos,
            tipo: filtroConejos
          }
        }
      );

      console.log("🐰 Conejos:", response.data);

      setConejos(response.data.data || []);

    } catch (error) {
      console.error("❌ Error cargando conejos:", error);
    }
  };

  // =========================
  // EFFECTS
  // =========================

  useEffect(() => {
    cargarMaterias();
  }, [estudiante, anioMaterias, filtroMaterias]);

  useEffect(() => {
    cargarConejos();
  }, [estudiante, anioConejos, filtroConejos]);

  // =========================
  // CAMBIAR AÑO
  // =========================

  const cambiarAnio = (setter, actual, direccion) => {
    const nuevo = actual + direccion;

    if (nuevo >= 1 && nuevo <= 5) {
      setter(nuevo);
    }
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="app-container">

      <h1 className="title">
        Buscar Estudiante
      </h1>

      {/* ========================= */}
      {/* BUSCADOR */}
      {/* ========================= */}

      <div className="search-box">

        <input
          type="text"
          placeholder="DNI del estudiante"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
        />

        <button onClick={buscarEstudiante}>
          {loading ? "Buscando..." : "Buscar"}
        </button>

      </div>

      {/* ========================= */}
      {/* DATOS ESTUDIANTE */}
      {/* ========================= */}

      {estudiante && (

        <>
          <div className="card student-card">

            <h2>
              {estudiante.nombre} {estudiante.apellido}
            </h2>

            <p>
              <strong>DNI:</strong> {estudiante.dni}
            </p>

          </div>

          <div className="dual-sections">

            {/* ========================= */}
            {/* MATERIAS */}
            {/* ========================= */}

            <div className="card section-card">

              <h3>
                Materias — Año {anioMaterias}
              </h3>

              <div className="controls">

                <button
                  onClick={() =>
                    cambiarAnio(
                      setAnioMaterias,
                      anioMaterias,
                      -1
                    )
                  }
                >
                  ⬅
                </button>

                <button
                  onClick={() =>
                    cambiarAnio(
                      setAnioMaterias,
                      anioMaterias,
                      1
                    )
                  }
                >
                  ➡
                </button>

              </div>

              <div className="filters">

                <label>Filtrar:</label>

                <select
                  value={filtroMaterias}
                  onChange={(e) =>
                    setFiltroMaterias(e.target.value)
                  }
                >
                  <option value="">
                    Todas
                  </option>

                  <option value="brain">
                    Brain Hunter (8-10)
                  </option>

                  <option value="easy">
                    Easy (4-7)
                  </option>

                  <option value="ghost">
                    Ghost (1-3)
                  </option>

                </select>

              </div>

              <ul className="list">

                {materias.length === 0 && (
                  <p>No hay materias.</p>
                )}

                {materias.map((m) => (

                  <li
                    key={m.id_estudiante_materia}
                    className="list-item"
                  >

                    <div className="item-title">
                      {m.nombre}
                    </div>

                    <div className="item-details">

                      <span>
                        P1: {m.nota_parcial_1 ?? "-"}
                      </span>

                      <span>
                        P2: {m.nota_parcial_2 ?? "-"}
                      </span>

                      <span>
                        Final: {m.nota_final ?? "-"}
                      </span>

                    </div>

                    <div className="item-details">

                      <span>
                        Promedio: {m.promedio ?? "-"}
                      </span>

                    </div>

                  </li>

                ))}

              </ul>

            </div>

            {/* ========================= */}
            {/* CONEJOS */}
            {/* ========================= */}

            <div className="card section-card">

              <h3>
                Conejos — Año {anioConejos}
              </h3>

              <div className="controls">

                <button
                  onClick={() =>
                    cambiarAnio(
                      setAnioConejos,
                      anioConejos,
                      -1
                    )
                  }
                >
                  ⬅
                </button>

                <button
                  onClick={() =>
                    cambiarAnio(
                      setAnioConejos,
                      anioConejos,
                      1
                    )
                  }
                >
                  ➡
                </button>

              </div>

              <div className="filters">

                <label>Filtrar:</label>

                <select
                  value={filtroConejos}
                  onChange={(e) =>
                    setFiltroConejos(e.target.value)
                  }
                >
                  <option value="">
                    Todos
                  </option>

                  <option value="Bebe">
                    Conejo Bebé
                  </option>

                  <option value="Joven">
                    Conejo Joven
                  </option>

                  <option value="Adulto">
                    Conejo Adulto
                  </option>

                </select>

              </div>

              <ul className="list">

                {conejos.length === 0 && (
                  <p>No hay conejos.</p>
                )}

                {conejos.map((c) => (

                  <li
                    key={c.id_conejo}
                    className="list-item"
                  >

                    <div className="item-title">
                      {c.tipo}
                    </div>

                    <div className="item-details">

                      <span>
                        Materia: {c.materia}
                      </span>

                      <span>
                        Nota: {c.nota_origen}
                      </span>

                    </div>

                    <em className="desc">
                      {c.descripcion}
                    </em>

                  </li>

                ))}

              </ul>

            </div>

          </div>
        </>
      )}

    </div>
  );
}

export default App;