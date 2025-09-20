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
   <div className="bg-gray-900 text-white">
  <h2 className="text-2xl font-bold mb-4">Accesos (Rol simulado: {rol})</h2>

  {rol === 'trabajador' && (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300">
          Tipo Movimiento:
        </label>
        <select
          value={tipoMovimiento}
          onChange={(e) => setTipoMovimiento(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white"
        >
          <option value="">-- Selecciona --</option>
          <option value="Ingreso">Ingreso</option>
          <option value="Salida">Salida</option>
          <option value="Entrega paquete">Entrega paquete</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300">Observaciones:</label>
        <input
          type="text"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Opcional"
          className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white"
        />
      </div>
      
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Registrar Acceso
      </button>
    </form>
  )}

  <table className="min-w-full border-collapse border border-gray-600">
    <thead>
      <tr className="bg-indigo-700">
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">id_persona</th>
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">tipo_movimiento</th>
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">id_autorizador</th>
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">observaciones</th>
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">id_acceso</th>
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">fecha_hora</th>
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Acciones</th>
      </tr>
    </thead>
    <tbody>
      {accesos.map((acceso) => (
        <tr key={acceso.id_acceso} className="hover:bg-gray-800">
          <td className="px-4 py-2 text-sm text-gray-200">{acceso.id_persona}</td>
          <td className="px-4 py-2 text-sm text-gray-200">{acceso.tipo_movimiento}</td>
          <td className="px-4 py-2 text-sm text-gray-200">{acceso.id_autorizador}</td>
          <td className="px-4 py-2 text-sm text-gray-200">{acceso.observaciones}</td>
          <td className="px-4 py-2 text-sm text-gray-200">{acceso.id_acceso}</td>
          <td className="px-4 py-2 text-sm text-gray-200">
            {new Date(acceso.fecha_hora).toLocaleString()}
          </td>
          <td className="px-4 py-2 text-sm text-gray-200">
            <button
              onClick={() => handleEdit(acceso.id_acceso)}
              className="bg-yellow-500 text-white py-1 px-3 rounded-md hover:bg-yellow-600 mr-2"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(acceso.id_acceso)}
              className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
            >
              Eliminar
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>



  );
}

export default Accesos;
