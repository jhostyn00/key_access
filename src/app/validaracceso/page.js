"use client";

import { useState, useEffect, useRef } from "react";
import supabase from "../../lib/supabaseClient";

export default function ValidarAccesoPage() {
  const [visitantes, setVisitantes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVisitantes, setFilteredVisitantes] = useState([]);
  const [selectedVisitante, setSelectedVisitante] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [isValidating, setIsValidating] = useState(false); // Estado para controlar la validación
  const dropdownRef = useRef(null);

  useEffect(() => {
    const cargarVisitantes = async () => {
      const { data, error } = await supabase
        .from("visitante")
        .select("id_visitante, persona(nombre, apellido)");

      if (error) {
        console.error("Error al cargar visitantes:", error);
        return;
      }

      const formateados = data.map((v) => ({
        id_visitante: v.id_visitante,
        nombre:
          v.persona?.nombre && v.persona?.apellido
            ? `${v.persona.nombre} ${v.persona.apellido}`
            : "Sin nombre",
      }));

      setVisitantes(formateados);
      setFilteredVisitantes(formateados);
    };

    cargarVisitantes();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVisitantes(visitantes);
      return;
    }

    const resultados = visitantes.filter((v) =>
      v.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVisitantes(resultados);
  }, [searchTerm, visitantes]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFilteredVisitantes([]); // Cerrar la lista al hacer clic fuera
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectVisitante = async (visitante) => {
    setSelectedVisitante(visitante);  // Guardamos el visitante seleccionado
    setSearchTerm(visitante.nombre);  // Actualizamos el campo de búsqueda con el nombre del visitante
    setFilteredVisitantes([]);       // Cerramos la lista de resultados
    setMensaje("");  // Limpiar el mensaje de acceso anterior si hubiera
  };

  const validarAcceso = async () => {
    if (!selectedVisitante) {
      setMensaje("❌ Por favor, selecciona un visitante.");
      return;
    }

    setIsValidating(true);  // Empezamos la validación

    const { data, error } = await supabase
      .from("visitante")
      .select("inicio, fin, dias_permitidos")
      .eq("id_visitante", selectedVisitante.id_visitante)
      .single();

    if (error || !data) {
      setMensaje("❌ Error al obtener los datos del visitante.");
      setIsValidating(false);  // Terminamos la validación
      return;
    }

    const ahora = new Date();

    const [fechaInicioStr, fechaFinStr] = data.dias_permitidos.split(",");
    const fechaInicio = new Date(fechaInicioStr);
    const fechaFin = new Date(fechaFinStr);

    const dentroDeFechas = ahora >= fechaInicio && ahora <= fechaFin;

    const [horaInicio, minutoInicio] = data.inicio.split(":").map(Number);
    const [horaFin, minutoFin] = data.fin.split(":").map(Number);

    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    const minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFin = horaFin * 60 + minutoFin;

    const dentroDeHorario =
      minutosActuales >= minutosInicio && minutosActuales <= minutosFin;

    if (dentroDeFechas && dentroDeHorario) {
      setMensaje("✅ Acceso permitido");
    } else {
      setMensaje("❌ Acceso denegado: fuera de horario o fechas permitidas");
    }

    setIsValidating(false);  // Terminamos la validación
  };

  return (
    <main className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-lg p-10 border border-gray-200">
        <h2 className="text-4xl font-bold mb-10 text-center text-gray-800">
          Validación de Acceso
        </h2>

        {/* Mensaje */}
        {mensaje && (
          <p
            className={`mb-6 text-center font-medium py-3 px-5 rounded-xl border ${
              mensaje.startsWith("✅")
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {mensaje}
          </p>
        )}

        {/* Búsqueda del visitante */}
        <div className="mb-6 relative" ref={dropdownRef}>
          <label className="block mb-2 font-semibold text-gray-700 text-lg">
            Buscar visitante
          </label>
          <input
            type="text"
            placeholder="Escribe para buscar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setMensaje("");  // Limpiar mensaje cuando cambia la búsqueda
            }}
            onFocus={() => setFilteredVisitantes(visitantes)} // Mostrar resultados al enfocar
            className="w-full text-gray-900 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
          />
          {filteredVisitantes.length > 0 && (
            <ul className="absolute z-10 w-full max-h-48 overflow-auto bg-white border border-gray-300 rounded-xl mt-1 shadow-lg">
              {filteredVisitantes.map((v) => (
                <li
                  key={v.id_visitante}
                  onClick={() => handleSelectVisitante(v)}
                  className="cursor-pointer px-4 py-2 hover:bg-blue-100 text-black"
                >
                  {v.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Botón de validación */}
        <button
          onClick={validarAcceso}
          disabled={isValidating}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-md transition-all text-lg"
        >
          {isValidating ? "Validando..." : "Validar Acceso"}
        </button>
      </div>
    </main>
  );
}
