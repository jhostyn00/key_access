"use client";

import { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { DateRange } from "react-date-range";
import { addDays, format } from "date-fns";
import Select from "react-select";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function AccesoVisitaPage() {
  const [visitantes, setVisitantes] = useState([]);
  const [selectedVisitante, setSelectedVisitante] = useState(null);
  const [range, setRange] = useState([
    { startDate: new Date(), endDate: addDays(new Date(), 0), key: "selection" },
  ]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [message, setMessage] = useState("");
  const [isClient, setIsClient] = useState(false);

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
          id_visitante: v.id_visitante,
          nombre: v.persona
            ? `${v.persona.nombre} ${v.persona.apellido}`
            : "Sin nombre",
        }));
        setVisitantes(formatted);
      } catch (err) {
        console.error("Error al cargar visitantes:", err);
      }
    };
    cargarVisitantes();
  }, []);

  const guardarHorario = async () => {
    if (!selectedVisitante) return alert("Selecciona un visitante");
    if (!inicio || !fin) return alert("Selecciona horario completo");

    const fechaInicio = format(range[0].startDate, "yyyy-MM-dd");
    const fechaFin = format(range[0].endDate, "yyyy-MM-dd");

    try {
      const { error } = await supabase
        .from("visitante")
        .update({
          inicio,
          fin,
          dias_permitidos: `${fechaInicio},${fechaFin}`
        })
        .eq("id_visitante", selectedVisitante.id_visitante);

      if (error) {
        setMessage(`❌ Error al guardar horario: ${error.message}`);
        return;
      }

      // 🔹 Mostrar mensaje de éxito
      setMessage("✅ Horario guardado correctamente!");

      // 🔹 Resetear campos automáticamente después de 5 segundos
      setTimeout(() => {
        setSelectedVisitante(null);
        setInicio("");
        setFin("");
        setRange([{ startDate: new Date(), endDate: addDays(new Date(), 0), key: "selection" }]);
        setShowCalendar(false);
        setMessage(""); // limpiar mensaje
      }, 5000);

    } catch (err) {
      console.error("Error inesperado al guardar horario:", err);
      setMessage("❌ Error inesperado al guardar horario");
    }
  };

  const handleRangeChange = (item) => {
    setRange([item.selection]);
    const { startDate, endDate } = item.selection;
    if (startDate && endDate && startDate.getTime() !== endDate.getTime()) {
      setShowCalendar(false);
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

        {/* Select buscable visitante */}
        <div className="mb-8">
          <label className="block mb-3 font-semibold text-gray-700 text-lg">
            Selecciona Visitante
          </label>
          {isClient && (
            <Select
              inputId="visitante-select"
              options={visitantes.map((v) => ({ value: v.id_visitante, label: v.nombre }))}
              value={
                selectedVisitante
                  ? { value: selectedVisitante.id_visitante, label: selectedVisitante.nombre }
                  : null
              }
              onChange={(option) => {
                const visitante = visitantes.find((v) => v.id_visitante === option.value);
                setSelectedVisitante(visitante);
              }}
              placeholder="Buscar visitante..."
              isClearable
              className="text-gray-900"
            />
          )}
        </div>

        {/* Rango de fechas */}
        <div className="mb-8">
          <label className="block mb-3 font-semibold text-gray-700 text-lg text-center">
            Días Permitidos
          </label>
          <div className="flex justify-center space-x-4 mb-3">
            <input
              type="text"
              readOnly
              value={format(range[0].startDate, "dd/MM/yyyy")}
              onClick={() => setShowCalendar(true)}
              className="w-44 text-center border border-gray-300 rounded-xl p-3 text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition"
            />
            <input
              type="text"
              readOnly
              value={format(range[0].endDate, "dd/MM/yyyy")}
              onClick={() => setShowCalendar(true)}
              className="w-44 text-center border border-gray-300 rounded-xl p-3 text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition"
            />
          </div>

          {showCalendar && (
            <div className="flex justify-center mb-8">
              <div className="shadow-md rounded-xl overflow-hidden">
                <DateRange
                  editableDateInputs={true}
                  onChange={handleRangeChange}
                  moveRangeOnFirstSelection={false}
                  ranges={range}
                  className="transform scale-90"
                />
              </div>
            </div>
          )}
        </div>

        {/* Horarios */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Hora Inicio</label>
            <input
              type="time"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Hora Fin</label>
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
