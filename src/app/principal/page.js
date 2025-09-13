'use client'

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

function Accesos() {
  // Simulamos usuario y rol para desarrollo
  const [user, setUser] = useState({ id: '1234' }); // id simulado
  const [rol, setRol] = useState('trabajador');
  const [accesos, setAccesos] = useState([]);
  const [tipoMovimiento, setTipoMovimiento] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    // Cargar accesos para el usuario simulado
    const fetchAccesos = async () => {
      const { data, error } = await supabase
        .from('acceso')
        .select('*')
        .order('fecha_hora', { ascending: false });

      if (error) {
        console.error('Error obteniendo accesos:', error);
        return;
      }

      // Para trabajador mostramos todos los accesos
      setAccesos(data);
    };

    if (user) {
      fetchAccesos();
    }
  }, [user]);

  async function registrarAcceso(nuevoAcceso) {
    if (rol !== 'trabajador') {
      alert('Solo los trabajadores pueden registrar accesos.');
      return;
    }

    const { data, error } = await supabase
      .from('acceso')
      .insert([nuevoAcceso]);

    if (error) {
      console.error('Error al registrar acceso:', error.message);
      alert('Error al registrar el acceso.');
    } else {
      alert('Acceso registrado correctamente!');
      setAccesos(prev => [data[0], ...prev]);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!tipoMovimiento) {
      alert('Selecciona un tipo de movimiento');
      return;
    }

    const nuevoAcceso = {
      id_persona: user.id,
      tipo_movimiento: tipoMovimiento,
      id_autorizador: null,
      observaciones: observaciones || '',
      fecha_hora: new Date().toISOString(),
    };

    registrarAcceso(nuevoAcceso);

    setTipoMovimiento('');
    setObservaciones('');
  };

  return (
    <div>
      <h2>Accesos (Rol simulado: {rol})</h2>

      {rol === 'trabajador' && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
          <label>
            Tipo Movimiento:
            <select
              value={tipoMovimiento}
              onChange={(e) => setTipoMovimiento(e.target.value)}
              required
            >
              <option value="">-- Selecciona --</option>
              <option value="Ingreso">Ingreso</option>
              <option value="Salida">Salida</option>
              <option value="Entrega paquete">Entrega paquete</option>
            </select>
          </label>
          <br />
          <label>
            Observaciones:
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Opcional"
            />
          </label>
          <br />
          <button type="submit">Registrar Acceso</button>
        </form>
      )}

      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>id_persona</th>
            <th>tipo_movimiento</th>
            <th>id_autorizador</th>
            <th>observaciones</th>
            <th>id_acceso</th>
            <th>fecha_hora</th>
          </tr>
        </thead>
        <tbody>
          {accesos.map((acceso) => (
            <tr key={acceso.id_acceso}>
              <td>{acceso.id_persona}</td>
              <td>{acceso.tipo_movimiento}</td>
              <td>{acceso.id_autorizador}</td>
              <td>{acceso.observaciones}</td>
              <td>{acceso.id_acceso}</td>
              <td>{new Date(acceso.fecha_hora).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Accesos;
