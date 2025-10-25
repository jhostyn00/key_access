'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

export default function PanelGeneral() {
  const [vista, setVista] = useState('resumen');
  const [resumen, setResumen] = useState({
    residentes: 0,
    entradasHoy: 0,
    salidasHoy: 0,
  });
  const [accesos, setAccesos] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const fechaHoy = new Date();
  const fechaFormateada = fechaHoy.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // ================= CARGA INICIAL =================
  useEffect(() => {
    const fetchDatos = async () => {
      // 1️⃣ Total residentes activos
      const { count: residentesCount } = await supabase
        .from('persona')
        .select('*', { count: 'exact', head: true })
        .eq('rol', '3');

      // 2️⃣ Entradas y salidas del día
      const hoyISO = new Date().toISOString().split('T')[0];

      const { data: accesosHoy } = await supabase
        .from('acceso')
        .select('*')
        .gte('fecha_hora', `${hoyISO}T00:00:00`)
        .lte('fecha_hora', `${hoyISO}T23:59:59`);

      const entradas = accesosHoy?.filter((a) => a.tipo === 'entrada')?.length || 0;
      const salidas = accesosHoy?.filter((a) => a.tipo === 'salida')?.length || 0;

      // 3️⃣ Últimos accesos
      const { data: ultimosAccesos } = await supabase
        .from('acceso')
        .select('*')
        .order('fecha_hora', { ascending: false })
        .limit(10);

      const accesosConPersona = await Promise.all(
        ultimosAccesos.map(async (a) => {
          const { data: persona } = await supabase
            .from('persona')
            .select('nombre, apellido, rol')
            .eq('id_persona', a.id_persona)
            .single();
          return { ...a, persona };
        })
      );

      // 4️⃣ Alertas
      const { data: alertasData } = await supabase
        .from('alerta')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(10);

      setResumen({
        residentes: residentesCount || 0,
        entradasHoy: entradas,
        salidasHoy: salidas,
      });
      setAccesos(accesosConPersona || []);
      setAlertas(alertasData || []);
    };

    fetchDatos();
  }, []);

  // ================= FORMATO DE ROL =================
  const rolTexto = (rol) => {
    switch (rol) {
      case '1':
        return 'Propietario';
      case '2':
        return 'Trabajador';
      case '3':
        return 'Residente';
      default:
        return 'Visitante';
    }
  };

  // ==================== INTERFAZ ====================
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* ====== BARRA DE MENÚ SUPERIOR ====== */}
      <header className="bg-indigo-700 text-white py-4 shadow-md">
        <nav className="flex justify-center space-x-8 text-lg font-medium">
          <button
            onClick={() => setVista('resumen')}
            className={`hover:text-yellow-300 ${
              vista === 'resumen' ? 'underline underline-offset-8 text-yellow-300' : ''
            }`}
          >
            🏠 Resumen
          </button>
          <button
            onClick={() => setVista('accesos')}
            className={`hover:text-yellow-300 ${
              vista === 'accesos' ? 'underline underline-offset-8 text-yellow-300' : ''
            }`}
          >
            📋 Últimos accesos
          </button>
          <button
            onClick={() => setVista('alertas')}
            className={`hover:text-yellow-300 ${
              vista === 'alertas' ? 'underline underline-offset-8 text-yellow-300' : ''
            }`}
          >
            🚨 Alertas
          </button>
        </nav>
      </header>

      {/* ====== CONTENIDO ====== */}
      <main className="p-6 max-w-5xl mx-auto">
        {vista === 'resumen' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 text-center">Panel General</h2>

            {/* Fecha tipo calendario */}
            <div className="text-center mb-8">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                {fechaFormateada}
              </p>
              <div className="w-16 h-1 bg-indigo-500 mx-auto rounded"></div>
            </div>

            {/* Cuadros de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="bg-indigo-800 rounded-lg p-5 shadow-md border border-indigo-600">
                <h3 className="text-lg font-semibold">👥 Residentes activos</h3>
                <p className="text-3xl font-bold mt-2">{resumen.residentes}</p>
              </div>
              <div className="bg-green-800 rounded-lg p-5 shadow-md border border-green-600">
                <h3 className="text-lg font-semibold">⬆️ Entradas de hoy</h3>
                <p className="text-3xl font-bold mt-2">{resumen.entradasHoy}</p>
              </div>
              <div className="bg-red-800 rounded-lg p-5 shadow-md border border-red-600">
                <h3 className="text-lg font-semibold">⬇️ Salidas de hoy</h3>
                <p className="text-3xl font-bold mt-2">{resumen.salidasHoy}</p>
              </div>
            </div>
          </section>
        )}

        {vista === 'accesos' && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-center">📋 Últimos accesos registrados</h2>
            <table className="min-w-full border-collapse border border-gray-700">
              <thead>
                <tr className="bg-indigo-700">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Persona</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Rol</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Fecha/Hora</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {accesos.length > 0 ? (
                  accesos.map((a) => (
                    <tr key={a.id_acceso} className="hover:bg-gray-800">
                      <td className="px-4 py-2 text-sm">
                        {a.persona
                          ? `${a.persona.nombre} ${a.persona.apellido}`
                          : `ID ${a.id_persona}`}
                      </td>
                      <td className="px-4 py-2 text-sm">{rolTexto(a.persona?.rol)}</td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(a.fecha_hora).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {a.tipo === 'entrada' ? '⬆️ Entrada' : '⬇️ Salida'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-2 text-sm text-gray-400 text-center italic"
                    >
                      No hay accesos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {vista === 'alertas' && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-center">🚨 Alertas / Notificaciones</h2>
            {alertas.length > 0 ? (
              <ul className="space-y-3">
                {alertas.map((a) => (
                  <li
                    key={a.id_alerta}
                    className="bg-red-700 px-4 py-3 rounded-md border border-red-600 shadow"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm">
                        {new Date(a.fecha).toLocaleString()} — {a.mensaje}
                      </p>
                      <span className="text-xs uppercase bg-black bg-opacity-30 px-2 py-1 rounded">
                        {a.tipo}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic text-center">No hay alertas registradas.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
