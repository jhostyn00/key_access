'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

export default function PanelGeneral() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('resumen');
  const [resumen, setResumen] = useState({
    entradasHoy: 0,
    salidasHoy: 0,
  });
  const [accesos, setAccesos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [graficoDatos, setGraficoDatos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });

  const [year, month, day] = fechaSeleccionada.split('-').map(Number);
  const fechaLocal = new Date(year, month - 1, day);
  const fechaMostrada = fechaLocal.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // ================= CARGA DE DATOS SEGÚN USUARIO =================
  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem('usuario'));
    if (datosUsuario) {
      setUsuario(datosUsuario);
    }
  }, []);

  // ================= CARGAR DATOS DE LA PERSONA SEGÚN FECHA =================
  useEffect(() => {
    if (!usuario) return; // Esperamos a que el usuario esté cargado

    const fetchDatos = async () => {
      const { id_persona } = usuario;

      // Resumen general: Entradas y Salidas del día
      const { data: accesosDia } = await supabase
        .from('acceso')
        .select('*')
        .gte('fecha_hora', `${fechaSeleccionada}T00:00:00`)
        .lte('fecha_hora', `${fechaSeleccionada}T23:59:59`)
        .eq('id_persona', id_persona);  // Filtramos por la persona

      const entradas = accesosDia?.filter((a) => a.tipo_movimiento === 'ingreso')?.length || 0;
      const salidas = accesosDia?.filter((a) => a.tipo_movimiento === 'salida')?.length || 0;

      // Últimos 10 accesos de la persona
      const { data: ultimosAccesos } = await supabase
        .from('acceso')
        .select('*')
        .eq('id_persona', id_persona) // Filtramos solo los accesos de la persona actual
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

      // Alertas de la persona
      const { data: alertasData } = await supabase
        .from('alerta')
        .select('*')
        .eq('id_persona', id_persona) // Solo alertas de esta persona
        .order('fecha', { ascending: false })
        .limit(10);

      // Datos para gráfico
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
        entradasHoy: entradas,
        salidasHoy: salidas,
      });
      setAccesos(accesosConPersona || []);
      setAlertas(alertasData || []);
      setGraficoDatos(grafico);
    };

    fetchDatos();
  }, [usuario, fechaSeleccionada]);

  // ================= FUNCIONES AUXILIARES =================
  const rolTexto = (rol) => {
    switch (rol) {
      case '1': return 'Propietario';
      case '2': return 'Trabajador';
      case '3': return 'Residente';
      default: return 'Visitante';
    }
  };

  const renderGrafico = () => {
    if (graficoDatos.length === 0) return null;

    const maxValor = Math.max(
      ...graficoDatos.map((d) => Math.max(d.entradas, d.salidas)),
      5
    );
    const ancho = 800;
    const alto = 400;
    const margen = 50;
    const escalaX = (ancho - margen * 2) / (graficoDatos.length - 1 || 1);
    const escalaY = (alto - margen * 2) / maxValor;

    const puntosEntrada = graficoDatos
      .map((d, i) => `${margen + i * escalaX},${alto - margen - d.entradas * escalaY}`)
      .join(' ');
    const puntosSalida = graficoDatos
      .map((d, i) => `${margen + i * escalaX},${alto - margen - d.salidas * escalaY}`)
      .join(' ');

    return (
      <svg width={ancho} height={alto} className="mx-auto mt-6">
        {/* Ejes */}
        <line x1={margen} y1={alto - margen} x2={ancho - margen} y2={alto - margen} stroke="var(--text-muted)" />
        <line x1={margen} y1={margen} x2={margen} y2={alto - margen} stroke="var(--text-muted)" />

        {/* Líneas */}
        <polyline fill="none" stroke="var(--color-accent-green)" strokeWidth="5" points={puntosEntrada} />
        <polyline fill="none" stroke="var(--color-accent-red)" strokeWidth="5" points={puntosSalida} />

        {/* Puntos */}
        {graficoDatos.map((d, i) => (
          <circle key={`e-${i}`} cx={margen + i * escalaX} cy={alto - margen - d.entradas * escalaY} r="6" fill="var(--color-accent-green)" />
        ))}
        {graficoDatos.map((d, i) => (
          <circle key={`s-${i}`} cx={margen + i * escalaX} cy={alto - margen - d.salidas * escalaY} r="6" fill="var(--color-accent-red)" />
        ))}

        {/* Etiquetas X */}
        {graficoDatos.map((d, i) => (
          <text key={i} x={margen + i * escalaX} y={alto - margen + 25} textAnchor="middle" fontSize="14" fill="var(--text-primary)">
            {d.fecha}
          </text>
        ))}
      </svg>
    );
  };

  // ==================== INTERFAZ ====================
  return (
    <div className="min-h-screen p-4 bg-bg-primary text-text-primary">
      {/* ====== BARRA DE MENÚ ====== */}
      <header className="bg-bg-glass backdrop-blur-md rounded-xl shadow-header p-4 mb-6">
        <nav className="flex justify-center space-x-8 text-lg font-medium">
          {['resumen', 'accesos', 'alertas'].map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`hover:text-color-accent ${
                vista === v ? 'underline underline-offset-8 text-color-accent' : ''
              }`}
            >
              {v === 'resumen' ? '🏠 Resumen' : v === 'accesos' ? '📋 Últimos accesos' : '🚨 Avisos'}
            </button>
          ))}
        </nav>
      </header>

      {/* ====== CONTENIDO ====== */}
      <main className="max-w-5xl mx-auto space-y-6">
        {vista === 'resumen' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">Panel General</h2>

            {/* Selector de fecha */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <label className="text-sm text-text-secondary">Seleccionar fecha:</label>
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="bg-bg-glass backdrop-blur-md text-text-primary border border-border-glass rounded px-3 py-1"
              />
              {fechaSeleccionada !== new Date().toISOString().split('T')[0] && (
                <button
                  onClick={() => setFechaSeleccionada(new Date().toISOString().split('T')[0])}
                  className="flex items-center gap-2 bg-color-accent-green/50 hover:bg-color-accent-green text-text-primary text-sm font-medium px-3 py-1 rounded transition-all hover:scale-105"
                  title="Volver a la fecha actual"
                >
                  🕒 Hoy
                </button>
              )}
            </div>

            {/* Fecha tipo calendario */}
            <div className="text-center mb-8">
              <p className="text-sm uppercase tracking-wider mb-2 text-text-secondary">{fechaMostrada}</p>
              <div className="w-16 h-1 bg-color-accent-indigo mx-auto rounded"></div>
            </div>

            {/* Cuadros de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {[
                { titulo: '👥 Residentes activos', valor: resumen.residentes || 0 },
                { titulo: '⬆️ Entradas', valor: resumen.entradasHoy },
                { titulo: '⬇️ Salidas', valor: resumen.salidasHoy },
              ].map((item, i) => (
                <div key={i} className="bg-bg-glass border border-border-glass rounded-lg p-5 shadow-card">
                  <h3 className="text-lg font-semibold">{item.titulo}</h3>
                  <p className="text-3xl font-bold mt-2">{item.valor}</p>
                </div>
              ))}
            </div>

            {/* Gráfico */}
            <div className="mt-10 text-center">
              <h3 className="text-lg font-semibold mb-2">📊 Entradas y Salidas ({fechaMostrada})</h3>
              {renderGrafico()}
              <div className="flex justify-center gap-6 mt-2 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-color-accent-green rounded-full"></span> Entradas
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-color-accent-red rounded-full"></span> Salidas
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ACCESOS */}
        {vista === 'accesos' && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-center text-text-primary">📋 Últimos accesos registrados</h2>
            <table className="min-w-full border-collapse border border-border-glass text-text-primary">
              <thead>
                <tr className="bg-bg-glass">
                  {['Persona','Rol','Fecha/Hora','Tipo'].map((h,i)=>( 
                    <th key={i} className="px-4 py-2 text-left text-sm font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accesos.length > 0 ? accesos.map((a) => (
                  <tr key={a.id_acceso} className="hover:bg-bg-glass">
                    <td className="px-4 py-2 text-sm">{a.persona ? `${a.persona.nombre} ${a.persona.apellido}` : `ID ${a.id_persona}`}</td>
                    <td className="px-4 py-2 text-sm">{rolTexto(a.persona?.rol)}</td>
                    <td className="px-4 py-2 text-sm">{new Date(a.fecha_hora).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">{a.tipo_movimiento === 'ingreso' ? '⬆️ Ingreso' : '⬇️ Salida'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-sm text-text-secondary text-center italic">No hay accesos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* ALERTAS */}
        {vista === 'alertas' && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-center text-text-primary">🚨 Avisos / Notificaciones</h2>
            {alertas.length > 0 ? (
              <ul className="space-y-3">
                {alertas.map((a) => (
                  <li key={a.id_alerta} className="bg-bg-glass px-4 py-3 rounded-md border border-color-accent-red shadow-card">
                    <div className="flex justify-between items-center">
                      <p className="text-sm">{new Date(a.fecha).toLocaleString()} — {a.mensaje}</p>
                      <span className="text-xs uppercase bg-black bg-opacity-30 px-2 py-1 rounded">{a.tipo}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-secondary italic text-center">No hay alertas registradas.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
