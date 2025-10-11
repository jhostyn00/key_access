"use client";

import { useEffect, useState, useRef } from "react";
import supabase from "../../lib/supabaseClient";

export default function AccesoVisitaPage() {
  const [visitantes, setVisitantes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVisitantes, setFilteredVisitantes] = useState([]);
  const [selectedVisitante, setSelectedVisitante] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [motivoVisita, setMotivoVisita] = useState("");
  const [message, setMessage] = useState("");
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const cargarVisitantes = async () => {
      try {
        const { data, error } = await supabase
          .from("visitante")
          .select("id_visitante, persona(nombre, apellido)");

        if (error) throw error;

        const formatted = data.map((v) => ({
          id_visitante: v.id_visitante.toString(),
          nombre: v.persona
            ? `${v.persona.nombre} ${v.persona.apellido}`
            : "Sin nombre",
        }));

        setVisitantes(formatted);
        setFilteredVisitantes(formatted);
      } catch (err) {
        console.error("Error al cargar visitantes:", err);
      }
    };

    cargarVisitantes();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVisitantes(visitantes);
      setSelectedVisitante(null);
      return;
    }

    const filtered = visitantes.filter((v) =>
      v.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredVisitantes(filtered);

    const exactMatch = visitantes.find(
      (v) => v.nombre.toLowerCase() === searchTerm.toLowerCase()
    );

    setSelectedVisitante(exactMatch || null);
  }, [searchTerm, visitantes]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFilteredVisitantes([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectVisitante = (visitante) => {
    setSelectedVisitante(visitante);
    setSearchTerm(visitante.nombre);
    setFilteredVisitantes([]);
  };

  const guardarHorario = async () => {
    if (!selectedVisitante) return alert("Selecciona un visitante válido");
    if (!inicio || !fin) return alert("Selecciona horario completo");
    if (!startDate || !endDate) return alert("Selecciona el rango de fechas");
    if (!motivoVisita.trim()) return alert("Escribe el motivo de la visita");

    try {
      const { error } = await supabase
        .from("visitante")
        .update({
          inicio,
          fin,
          dias_permitidos: `${startDate},${endDate}`,
          motivo_visita: motivoVisita.trim(),
        })
        .eq("id_visitante", selectedVisitante.id_visitante);

      if (error) {
        setMessage(`❌ Error al guardar horario: ${error.message}`);
        return;
      }

      setMessage("✅ Horario guardado correctamente!");

      setTimeout(() => {
        setSelectedVisitante(null);
        setSearchTerm("");
        setInicio("");
        setFin("");
        setStartDate("");
        setEndDate("");
        setMotivoVisita("");
        setMessage("");
        setFilteredVisitantes(visitantes);
      }, 5000);
    } catch (err) {
      console.error("Error inesperado al guardar horario:", err);
      setMessage("❌ Error inesperado al guardar horario");
    }
  };

  return (
    <main className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg p-10 border border-gray-200">
        <h2 className="text-4xl font-bold mb-10 text-center text-gray-800">
          Asignación de Horarios
        </h2>

        {message && (
          <p
            className={`mb-8 text-center font-medium py-3 px-5 rounded-xl border ${
              message.startsWith("✅")
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {message}
          </p>
        )}

        {/* Campo visitante con búsqueda filtrada */}
        <div className="mb-6 relative" ref={dropdownRef}>
          <label className="block mb-3 font-semibold text-gray-700 text-lg">
            Selecciona Visitante
          </label>
          <input
            type="text"
            placeholder="Escribe para buscar visitante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-gray-900 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
            autoComplete="off"
            onFocus={() => {
              if (searchTerm.trim()) {
                setFilteredVisitantes(
                  visitantes.filter((v) =>
                    v.nombre
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                );
              } else {
                setFilteredVisitantes(visitantes);
              }
            }}
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

        {/* Motivo de la visita */}
        <div className="mb-8">
          <label className="block mb-3 font-semibold text-gray-700 text-lg">
            Motivo de la Visita
          </label>
          <input
            type="text"
            placeholder="Escribe el motivo de la visita"
            value={motivoVisita}
            onChange={(e) => setMotivoVisita(e.target.value)}
            className="w-full text-gray-900 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
          />
        </div>

        {/* Rango de fechas */}
        <div className="mb-8">
          <label className="block mb-3 font-semibold text-gray-700 text-lg text-center">
            Días Permitidos
          </label>
          <div className="flex justify-center space-x-4 mb-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-44 text-center border border-gray-300 rounded-xl p-3 text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-44 text-center border border-gray-300 rounded-xl p-3 text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition"
            />
          </div>
        </div>

        {/* Horarios */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Hora Inicio
            </label>
            <input
              type="time"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Hora Fin
            </label>
            <input
              type="time"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition"
            />
          </div>
        </div>

        {/* Botón guardar */}
        <button
          onClick={guardarHorario}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-md transition-all text-lg"
        >
          Guardar Horario
        </button>
      </div>
    </main>
  );
}
