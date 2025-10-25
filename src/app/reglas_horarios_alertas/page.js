'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

export default function ReglasHorariosAlertas() {
  const [accesos, setAccesos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevaAlerta, setNuevaAlerta] = useState({
    id_persona: '',
    tipo: '',
    mensaje: ''
  });
  const [personas, setPersonas] = useState([]);

  // ================= CARGA DE DATOS INICIALES =================
  useEffect(() => {
    const fetchPersonas = async () => {
      const { data, error } = await supabase
        .from('persona')
        .select('id_persona, nombre, apellido, rol')
        .neq('rol', '0');
      if (!error && data) setPersonas(data);
    };
    fetchPersonas();
  }, []);

  useEffect(() => {
    const fetchInicial = async () => {
      const { data, error } = await supabase
        .from('acceso')
        .select('*')
        .order('id_acceso', { ascending: false })
        .limit(10);
      if (!error && data) {
        const datosConPersona = await Promise.all(
          data.map(async (a) => ({
            ...a,
            persona: await obtenerPersona(a.id_persona)
          }))
        );
        setAccesos(datosConPersona);
      }
    };
    fetchInicial();
  }, []);

  // ================= ESCUCHA EN TIEMPO REAL =================
  useEffect(() => {
    const channel = supabase
      .channel('acceso-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'acceso' },
        async (payload) => {
          const nuevoAcceso = payload.new;
          const persona = await obtenerPersona(nuevoAcceso.id_persona);
          const accesoCompleto = { ...nuevoAcceso, persona };
          setAccesos((prev) => [accesoCompleto, ...prev]);
          await procesarReglas(accesoCompleto);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const obtenerPersona = async (id_persona) => {
    const { data, error } = await supabase
      .from('persona')
      .select('nombre, apellido, rol')
      .eq('id_persona', id_persona)
      .single();
    if (error) return null;
    return data;
  };

  // ================= MOTOR DE REGLAS =================
  const procesarReglas = async (acceso) => {
    const { id_persona, fecha_hora } = acceso;
    const hora = new Date(fecha_hora || acceso.created_at).getHours();
    const rol = acceso.persona?.rol;

    let horarioPermitido = { inicio: 0, fin: 23 };

    switch (rol) {
      case '1': horarioPermitido = { inicio: 0, fin: 23 }; break;
      case '2': horarioPermitido = { inicio: 8, fin: 18 }; break;
      case '3': horarioPermitido = { inicio: 0, fin: 23 }; break;
      default: horarioPermitido = { inicio: 10, fin: 22 }; break;
    }

    const fueraHorario = hora < horarioPermitido.inicio || hora > horarioPermitido.fin;

    if (fueraHorario) {
      const mensaje = `⚠️ ${acceso.persona?.nombre || 'Persona'} ${acceso.persona?.apellido || ''} (rol ${rol}) accedió fuera del horario permitido (${hora}:00).`;

      const { error } = await supabase
        .from('alerta')
        .insert([{ id_persona, tipo: 'fuera_horario', mensaje, fecha: new Date().toISOString() }]);

      if (!error) {
        setAlertas((prev) => [{ id_persona, tipo: 'fuera_horario', mensaje, fecha: new Date().toISOString() }, ...prev]);
        alert(mensaje);
      }
    }
  };

  // ================= CARGAR ALERTAS EXISTENTES =================
  useEffect(() => {
    const fetchAlertas = async () => {
      const { data, error } = await supabase
        .from('alerta')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(10);
      if (!error && data) setAlertas(data);
    };
    fetchAlertas();
  }, []);

  // ================= CREAR ALERTA MANUAL =================
  const handleCrearAlerta = async (e) => {
    e.preventDefault();
    if (!nuevaAlerta.mensaje || !nuevaAlerta.tipo) {
      alert('Por favor completa todos los campos');
      return;
    }

    const { error } = await supabase.from('alerta').insert([
      {
        id_persona: nuevaAlerta.id_persona || null,
        tipo: nuevaAlerta.tipo,
        mensaje: nuevaAlerta.mensaje,
        fecha: new Date().toISOString()
      }
    ]);

    if (error) {
      console.error('Error al crear alerta:', error);
      alert('Error al crear la alerta');
    } else {
      alert('✅ Alerta creada correctamente');
      setNuevaAlerta({ id_persona: '', tipo: '', mensaje: '' });
      setMostrarFormulario(false);

      const { data } = await supabase
        .from('alerta')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(10);
      setAlertas(data);
    }
  };

  const rolTexto = (rol) => {
    switch (rol) {
      case '1': return 'Propietario';
      case '2': return 'Trabajador';
      case '3': return 'Residente';
      default: return 'Visitante';
    }
  };

  // ================= VISTA =================
  return (
    <div className="bg-gray-900 text-white p-6 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Monitoreo de Accesos y Alertas</h2>

      {/* ====== ACCESOS ====== */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold mb-3">📋 Accesos recientes</h3>
        <table className="min-w-full border-collapse border border-gray-600">
          <thead>
            <tr className="bg-indigo-700">
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Persona</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Rol</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Fecha/Hora</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {accesos.length > 0 ? (
              accesos.map((a) => (
                <tr key={a.id_acceso} className="hover:bg-gray-800">
                  <td className="px-4 py-2 text-sm text-gray-200">
                    {a.persona ? `${a.persona.nombre} ${a.persona.apellido}` : `ID ${a.id_persona}`}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-200">{rolTexto(a.persona?.rol)}</td>
                  <td className="px-4 py-2 text-sm text-gray-200">
                    {new Date(a.fecha_hora || a.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-200">
                    {a.permitido ? '✅ Permitido' : '❌ Denegado'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-3 text-sm text-gray-400 text-center italic">
                  No se encontraron accesos recientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* BOTÓN PARA MOSTRAR FORMULARIO */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md transition-all"
          >
            {mostrarFormulario ? 'Cancelar' : '➕ Crear alerta manual'}
          </button>
        </div>

        {/* FORMULARIO DE ALERTA */}
        {mostrarFormulario && (
          <form
            onSubmit={handleCrearAlerta}
            className="mt-6 bg-gray-800 p-5 rounded-lg border border-gray-700 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Persona (opcional)</label>
              <select
                value={nuevaAlerta.id_persona}
                onChange={(e) => setNuevaAlerta({ ...nuevaAlerta, id_persona: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="">-- Seleccionar persona --</option>
                {personas.map((p) => (
                  <option key={p.id_persona} value={p.id_persona}>
                    {p.nombre} {p.apellido} ({rolTexto(p.rol)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de alerta</label>
              <input
                type="text"
                value={nuevaAlerta.tipo}
                onChange={(e) => setNuevaAlerta({ ...nuevaAlerta, tipo: e.target.value })}
                placeholder="Ej: sensor, acceso, seguridad..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mensaje</label>
              <textarea
                value={nuevaAlerta.mensaje}
                onChange={(e) => setNuevaAlerta({ ...nuevaAlerta, mensaje: e.target.value })}
                placeholder="Describe la alerta"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              ></textarea>
            </div>

            <div className="text-right">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md"
              >
                💾 Guardar alerta
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ====== ALERTAS ====== */}
      <section>
        <h3 className="text-lg font-semibold mb-3">🚨 Alertas registradas</h3>
        {alertas.length > 0 ? (
          <ul className="space-y-2">
            {alertas.map((a, i) => (
              <li key={i} className="bg-red-700 px-3 py-2 rounded-md text-sm">
                {new Date(a.fecha).toLocaleString()} — {a.mensaje}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 italic">No hay alertas registradas.</p>
        )}
      </section>
    </div>
  );
}
