'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

export default function PanelGeneral() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('resumen');
  const [resumen, setResumen] = useState({ residentes: 0, entradasHoy: 0, salidasHoy: 0 });
  const [accesos, setAccesos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [graficoDatos, setGraficoDatos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => new Date().toISOString().split('T')[0]);

  const [year, month, day] = fechaSeleccionada.split('-').map(Number);
  const fechaLocal = new Date(year, month - 1, day);
  const fechaMostrada = fechaLocal.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ======== Cargar usuario desde localStorage ========
  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem('usuario'));
    if (datosUsuario) setUsuario(datosUsuario);
  }, []);

  // ================= CARGA DE DATOS SEGÚN USUARIO =================
  useEffect(() => {
    if (!usuario) return; // esperar a que cargue el usuario

    const fetchDatos = async () => {
      // Resumen general: número de residentes activos
      const { count: residentesCount } = await supabase
        .from('persona')
        .select('*', { count: 'exact', head: true })
        .eq('rol', '3'); // Considerando que el rol "3" es el de residente

      // Accesos del día filtrando por la persona que inició sesión o sus visitantes
      const { data: accesosDia } = await supabase
        .from('acceso')
        .select('*')
        .gte('fecha_hora', `${fechaSeleccionada}T00:00:00`)
        .lte('fecha_hora', `${fechaSeleccionada}T23:59:59`)
        .eq('id_persona', usuario.id_persona);  // Solo filtrar por 'id_persona'

      const entradas = accesosDia?.filter(a => a.tipo_movimiento === 'ingreso').length || 0;
      const salidas = accesosDia?.filter(a => a.tipo_movimiento === 'salida').length || 0;

      // Últimos 10 accesos relevantes
      const { data: ultimosAccesos } = await supabase
        .from('acceso')
        .select('*')
        .eq('id_persona', usuario.id_persona) // Filtrar por 'id_persona'
        .order('fecha_hora', { ascending: false })
        .limit(10);

      const accesosConPersona = await Promise.all(
        ultimosAccesos?.map(async a => {
          const { data: persona } = await supabase
            .from('persona')
            .select('nombre, apellido, rol')
            .eq('id_persona', a.id_persona)
            .single();
          return { ...a, persona };
        }) || []
      );

      // Alertas de la persona
      const { data: alertasData } = await supabase
        .from('alerta')
        .select('*')
        .eq('id_persona', usuario.id_persona)
        .order('fecha', { ascending: false })
        .limit(10);

      // Datos para gráfico
      const grafico = [
        {
          fecha: new Date(fechaSeleccionada).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          entradas,
          salidas,
        },
      ];

      setResumen({ residentes: residentesCount || 0, entradasHoy: entradas, salidasHoy: salidas });
      setAccesos(accesosConPersona || []);
      setAlertas(alertasData || []);
      setGraficoDatos(grafico);
    };

    fetchDatos();
  }, [usuario, fechaSeleccionada]);

  // ================= FUNCIONES AUXILIARES =================
  const rolTexto = rol => {
    switch (rol) {
      case '1': return 'Propietario';
      case '2': return 'Trabajador';
      case '3': return 'Residente';
      default: return 'Visitante';
    }
  };

  const renderGrafico = () => {
    if (graficoDatos.length === 0) return null;

    const maxValor = Math.max(...graficoDatos.map(d => Math.max(d.entradas, d.salidas)), 5);
    const ancho = 800;
    const alto = 400;
    const margen = 50;
    const escalaX = (ancho - margen * 2) / (graficoDatos.length - 1 || 1);
    const escalaY = (alto - margen * 2) / maxValor;

    const puntosEntrada = graficoDatos.map((d, i) => `${margen + i * escalaX},${alto - margen - d.entradas * escalaY}`).join(' ');
    const puntosSalida = graficoDatos.map((d, i) => `${margen + i * escalaX},${alto - margen - d.salidas * escalaY}`).join(' ');

    return (
      <svg width={ancho} height={alto} className="mx-auto mt-6">
        <line x1={margen} y1={alto - margen} x2={ancho - margen} y2={alto - margen} stroke="var(--text-muted)" />
        <line x1={margen} y1={margen} x2={margen} y2={alto - margen} stroke="var(--text-muted)" />

        <polyline fill="none" stroke="var(--color-accent-green)" strokeWidth="5" points={puntosEntrada} />
        <polyline fill="none" stroke="var(--color-accent-red)" strokeWidth="5" points={puntosSalida} />

        {graficoDatos.map((d, i) => (
          <circle key={`e-${i}`} cx={margen + i * escalaX} cy={alto - margen - d.entradas * escalaY} r="6" fill="var(--color-accent-green)" />
        ))}
        {graficoDatos.map((d, i) => (
          <circle key={`s-${i}`} cx={margen + i * escalaX} cy={alto - margen - d.salidas * escalaY} r="6" fill="var(--color-accent-red)" />
        ))}

        {graficoDatos.map((d, i) => (
          <text key={i} x={margen + i * escalaX} y={alto - margen + 25} textAnchor="middle" fontSize="14" fill="var(--text-muted)">
            {d.fecha}
          </text>
        ))}
      </svg>
    );
  };

  // ================= RENDER PRINCIPAL =================
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-glass-light)', color: 'var(--text-primary)' }}>
      <header className="py-4 shadow" style={{ background: 'var(--bg-glass)', boxShadow: 'var(--shadow-header)' }}>
        <nav className="flex justify-center space-x-8 text-lg font-medium">
          {['resumen', 'accesos', 'alertas'].map(v => (
            <button
              key={v}
              onClick={() => setVista(v)}
              style={{
                color: vista === v ? 'var(--color-accent-indigo)' : 'var(--text-primary)',
                textDecoration: vista === v ? 'underline' : 'none',
                textUnderlineOffset: '8px',
              }}
              className="hover:text-var(--color-accent-indigo) transition-colors duration-300"
            >
              {v === 'resumen' ? '🏠 Resumen' : v === 'accesos' ? '📋 Últimos accesos' : '🚨 Alertas'}
            </button>
          ))}
        </nav>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        {vista === 'resumen' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 text-center">Panel General</h2>

            <div className="flex justify-center items-center gap-4 mb-6">
              <label className="text-sm text-var(--text-muted)">Seleccionar fecha:</label>
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="bg-white text-gray-900 border border-var(--border-light) rounded px-3 py-1"
              />
            </div>

            <div className="text-center mb-8">
              <p className="text-sm uppercase tracking-wider mb-2 text-var(--text-muted)">{fechaMostrada}</p>
              <div className="w-16 h-1 mx-auto rounded" style={{ background: 'var(--color-accent-indigo)' }}></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="rounded-lg p-5 shadow-md border" style={{ background: 'white', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-card)' }}>
                <h3 className="text-lg font-semibold text-gray-800">👥 Residentes activos</h3>
                <p className="text-3xl font-bold mt-2 text-gray-900">{resumen.residentes}</p>
              </div>
              <div className="rounded-lg p-5 shadow-md border" style={{ background: 'white', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-card)' }}>
                <h3 className="text-lg font-semibold text-gray-800">⬆️ Entradas</h3>
                <p className="text-3xl font-bold mt-2 text-gray-900">{resumen.entradasHoy}</p>
              </div>
              <div className="rounded-lg p-5 shadow-md border" style={{ background: 'white', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-card)' }}>
                <h3 className="text-lg font-semibold text-gray-800">⬇️ Salidas</h3>
                <p className="text-3xl font-bold mt-2 text-gray-900">{resumen.salidasHoy}</p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">📊 Entradas y Salidas ({fechaMostrada})</h3>
              {renderGrafico()}
              <div className="flex justify-center gap-6 mt-2 text-sm text-var(--text-muted)">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-accent-green)' }}></span> Entradas</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-accent-red)' }}></span> Salidas</div>
              </div>
            </div>
          </section>
        )}

        {vista === 'accesos' && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">📋 Últimos accesos registrados</h2>
            <table className="min-w-full border-collapse border" style={{ borderColor: 'var(--border-light)' }}>
              <thead>
                <tr style={{ background: 'var(--color-accent-indigo)', color: 'white' }}>
                  <th className="px-4 py-2 text-left text-sm font-medium">Persona</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Rol</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Fecha/Hora</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {accesos.length > 0 ? accesos.map(a => (
                  <tr key={a.id_acceso} className="hover:bg-var(--bg-glass-light)">
                    <td className="px-4 py-2 text-sm">{a.persona ? `${a.persona.nombre} ${a.persona.apellido}` : `ID ${a.id_persona}`}</td>
                    <td className="px-4 py-2 text-sm">{rolTexto(a.persona?.rol)}</td>
                    <td className="px-4 py-2 text-sm">{new Date(a.fecha_hora).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">{a.tipo_movimiento === 'ingreso' ? '⬆️ Entrada' : '⬇️ Salida'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-sm text-var(--text-muted) text-center italic">No hay accesos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {vista === 'alertas' && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">🚨 Alertas / Notificaciones</h2>
            {alertas.length > 0 ? (
              <ul className="space-y-3">
                {alertas.map(a => (
                  <li key={a.id_alerta} className="px-4 py-3 rounded-md border shadow" style={{ background: 'white', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-800">{new Date(a.fecha).toLocaleString()} — {a.mensaje}</p>
                      <span className="text-xs uppercase px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.1)', color: 'gray' }}>{a.tipo}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-var(--text-muted) italic text-center">No hay alertas registradas.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
