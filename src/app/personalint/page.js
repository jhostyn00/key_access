"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function TablaPersonalInterno() {
  const [personal, setPersonal] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCargo, setSelectedCargo] = useState("todos");

  useEffect(() => {
    const fetchData = async () => {
      // 🔹 Obtenemos trabajadores y sus datos personales
      const { data: trabajadores, error: errTrabajadores } = await supabase
        .from("trabajador")
        .select(`
          id_trabajador,
          cargo,
          turno,
          persona:id_trabajador (
            id_persona,
            nombre,
            apellido,
            tipo_persona
          )
        `);

      if (errTrabajadores) {
        console.error("Error al obtener trabajadores:", errTrabajadores);
        return;
      }

      // 🔹 Filtramos solo los tipo_persona = trabajador
      const soloTrabajadores = trabajadores.filter(
        (p) => p.persona?.tipo_persona?.toLowerCase() === "trabajador"
      );

      // 🔹 Obtenemos los registros de acceso
      const { data: accesos, error: errAccesos } = await supabase
        .from("acceso")
        .select("id_persona, tipo_movimiento, fecha_hora")
        .order("fecha_hora", { ascending: false });

      if (errAccesos) {
        console.error("Error al obtener accesos:", errAccesos);
        return;
      }

      // 🔹 Procesamos los accesos para sacar última entrada y salida
      const accesosPorPersona = {};
      for (const acceso of accesos) {
        if (!accesosPorPersona[acceso.id_persona]) {
          accesosPorPersona[acceso.id_persona] = {
            ingreso: null,
            salida: null,
          };
        }

        if (acceso.tipo_movimiento === "ingreso" && !accesosPorPersona[acceso.id_persona].ingreso) {
          accesosPorPersona[acceso.id_persona].ingreso = acceso.fecha_hora;
        }

        if (acceso.tipo_movimiento === "salida" && !accesosPorPersona[acceso.id_persona].salida) {
          accesosPorPersona[acceso.id_persona].salida = acceso.fecha_hora;
        }
      }

      // 🔹 Combinamos trabajadores + accesos
      const combinados = soloTrabajadores.map((t) => {
        const acceso = accesosPorPersona[t.persona.id_persona] || {};
        return {
          ...t,
          hora_ingreso: acceso.ingreso || "—",
          hora_salida: acceso.salida || "—",
        };
      });

      setPersonal(combinados);
    };

    fetchData();
  }, []);

  // 🔹 Filtro por búsqueda y cargo
  const filteredPersonal = personal.filter((p) => {
    const fullName = `${p.persona?.nombre || ""} ${p.persona?.apellido || ""}`.toLowerCase();
    const matchesName = fullName.includes(searchTerm.toLowerCase());
    const matchesCargo =
      selectedCargo === "todos" ||
      p.cargo?.toLowerCase() === selectedCargo.toLowerCase();
    return matchesName && matchesCargo;
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-7xl bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          👷‍♂️ Personal Interno
        </h2>

        {/* 🔹 Barra de búsqueda y filtro */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o apellido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={selectedCargo}
            onChange={(e) => setSelectedCargo(e.target.value)}
            className="w-full md:w-1/3 border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los cargos</option>
            <option value="limpieza">Limpieza</option>
            <option value="seguridad">Seguridad</option>
            <option value="recepcion">Recepción</option>
            <option value="watch man">Watch Man</option>
          </select>
        </div>

        {/* 🔹 Tabla de resultados */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-left text-gray-800 font-semibold">
            <thead className="bg-gray-200 text-gray-900 uppercase text-sm">
              <tr>
                <th className="px-6 py-3 border-b text-center">#</th>
                <th className="px-6 py-3 border-b">Nombre</th>
                <th className="px-6 py-3 border-b">Apellido</th>
                <th className="px-6 py-3 border-b">Cargo</th>
                <th className="px-6 py-3 border-b">Turno</th>
                <th className="px-6 py-3 border-b text-center">Hora Ingreso</th>
                <th className="px-6 py-3 border-b text-center">Hora Salida</th>
              </tr>
            </thead>

            <tbody>
              {filteredPersonal.length > 0 ? (
                filteredPersonal.map((p, index) => (
                  <tr
                    key={p.id_trabajador}
                    className="hover:bg-blue-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-3 border-b text-center">{index + 1}</td>
                    <td className="px-6 py-3 border-b">{p.persona?.nombre || "—"}</td>
                    <td className="px-6 py-3 border-b">{p.persona?.apellido || "—"}</td>
                    <td className="px-6 py-3 border-b capitalize">{p.cargo}</td>
                    <td className="px-6 py-3 border-b capitalize">{p.turno}</td>
                    <td className="px-6 py-3 border-b text-center text-green-700">
                      {p.hora_ingreso !== "—"
                        ? new Date(p.hora_ingreso).toLocaleString("es-PE", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : "—"}
                    </td>
                    <td className="px-6 py-3 border-b text-center text-red-700">
                      {p.hora_salida !== "—"
                        ? new Date(p.hora_salida).toLocaleString("es-PE", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500 font-normal">
                    No hay personal interno registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
