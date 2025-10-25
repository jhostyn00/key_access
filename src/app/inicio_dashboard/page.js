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
  const [graficoDatos, setGraficoDatos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0]; // formato YYYY-MM-DD
  });

  const [year, month, day] = fechaSeleccionada.split('-').map(Number);
  const fechaLocal = new Date(year, month - 1, day);
  const fechaMostrada = fechaLocal.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });


  // ================= CARGA DE DATOS =================
  useEffect(() => {
    const fetchDatos = async () => {
      // 1️⃣ Total residentes activos
      const { count: residentesCount } = await supabase
        .from('persona')
        .select('*', { count: 'exact', head: true })
        .eq('rol', '3');

      // 2️⃣ Entradas y salidas del DÍA SELECCIONADO
      const { data: accesosDia } = await supabase
        .from('acceso')
        .select('*')
        .gte('fecha_hora', `${fechaSeleccionada}T00:00:00`)
        .lte('fecha_hora', `${fechaSeleccionada}T23:59:59`);

      const entradas = accesosDia?.filter((a) => a.tipo === 'entrada')?.length || 0;
      const salidas = accesosDia?.filter((a) => a.tipo === 'salida')?.length || 0;

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

      // 5️⃣ Datos para gráfico (solo el día seleccionado)
      const grafico = [
        {
          fecha: new Date(fechaSeleccionada).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
          }),
          entradas,
          salidas,
        },
      ];

      setResumen({
        residentes: residentesCount || 0,
        entradasHoy: entradas,
        salidasHoy: salidas,
      });
      setAccesos(accesosConPersona || []);
      setAlertas(alertasData || []);
      setGraficoDatos(grafico);
    };

    fetchDatos();
  }, [fechaSeleccionada]);

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

  // ================= FUNCIÓN PARA GRAFICAR =================
  const renderGrafico = () => {
    if (graficoDatos.length === 0) return null;

    const maxValor = Math.max(
      ...graficoDatos.map((d) => Math.max(d.entradas, d.salidas)),
      5
    );
    const ancho = 800; // Más grande
    const alto = 400;  // Más alto
    const margen = 50;
    const escalaX = (ancho - margen * 2) / (graficoDatos.length - 1 || 1);
    const escalaY = (alto - margen * 2) / maxValor;

    const puntosEntrada = graficoDatos
      .map(
        (d, i) =>
          `${margen + i * escalaX},${alto - margen - d.entradas * escalaY}`
      )
      .join(' ');
    const puntosSalida = graficoDatos
      .map(
        (d, i) =>
          `${margen + i * escalaX},${alto - margen - d.salidas * escalaY}`
      )
      .join(' ');

    return (
      <svg width={ancho} height={alto} className="mx-auto mt-6">
        {/* Ejes */}
        <line x1={margen} y1={alto - margen} x2={ancho - margen} y2={alto - margen} stroke="#999" />
        <line x1={margen} y1={margen} x2={margen} y2={alto - margen} stroke="#999" />

        {/* Líneas */}
        <polyline fill="none" stroke="#4ade80" strokeWidth="5" points={puntosEntrada} />
        <polyline fill="none" stroke="#f87171" strokeWidth="5" points={puntosSalida} />

        {/* Puntos */}
        {graficoDatos.map((d, i) => (
          <circle
            key={`e-${i}`}
            cx={margen + i * escalaX}
            cy={alto - margen - d.entradas * escalaY}
            r="6"
            fill="#4ade80"
          />
        ))}
        {graficoDatos.map((d, i) => (
          <circle
            key={`s-${i}`}
            cx={margen + i * escalaX}
            cy={alto - margen - d.salidas * escalaY}
            r="6"
            fill="#f87171"
          />
        ))}

        {/* Etiquetas X */}
        {graficoDatos.map((d, i) => (
          <text
            key={i}
            x={margen + i * escalaX}
            y={alto - margen + 25}
            textAnchor="middle"
            fontSize="14"
            fill="#ccc"
          >
            {d.fecha}
          </text>
        ))}
      </svg>
    );
  };

  // ==================== INTERFAZ ====================
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* ====== BARRA DE MENÚ ====== */}
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

            {/* Selector de fecha */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <label className="text-sm text-gray-300">Seleccionar fecha:</label>
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1"
              />
            </div>

            {/* Fecha tipo calendario */}
            <div className="text-center mb-8">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                {fechaMostrada}
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
                <h3 className="text-lg font-semibold">⬆️ Entradas</h3>
                <p className="text-3xl font-bold mt-2">{resumen.entradasHoy}</p>
              </div>
              <div className="bg-red-800 rounded-lg p-5 shadow-md border border-red-600">
                <h3 className="text-lg font-semibold">⬇️ Salidas</h3>
                <p className="text-3xl font-bold mt-2">{resumen.salidasHoy}</p>
              </div>
            </div>

            {/* Gráfico de ese día */}
            <div className="mt-10 text-center">
              <h3 className="text-lg font-semibold mb-2">
                📊 Entradas y Salidas ({fechaMostrada})
              </h3>
              {renderGrafico()}
              <div className="flex justify-center gap-6 mt-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-400 rounded-full"></span> Entradas
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-400 rounded-full"></span> Salidas
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ====== ACCESOS ====== */}
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

        {/* ====== ALERTAS ====== */}
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
