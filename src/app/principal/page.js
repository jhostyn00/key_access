'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

function Accesos() {
  const [user, setUser] = useState({ id: '1234' });
  const [rol, setRol] = useState('trabajador');
  const [accesos, setAccesos] = useState([]);
  const [filtro, setFiltro] = useState(''); // Cambiado de "trabajador" a ""

  useEffect(() => {
    const fetchAccesos = async () => {
      let query = supabase.from('persona').select(`
        id_persona,
        nombre,
        apellido,
        dni,
        tipo_persona,
        rol
      `);

      // Filtrar por tipo_persona solo si 'filtro' no está vacío
      if (filtro) {
        query = query.eq('tipo_persona', filtro);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo accesos:', error);
        return;
      }

      // Actualizamos el estado de accesos con los datos obtenidos
      setAccesos(data);
    };

    if (user) {
      fetchAccesos();
    }
  }, [user, filtro]); // Dependencias: se vuelve a ejecutar cuando cambia 'user' o 'filtro'

  const handleEdit = (id) => {
    // Aquí iría la lógica para editar el acceso
    console.log('Editando acceso', id);
  };

  const handleDelete = (id) => {
    // Aquí iría la lógica para eliminar el acceso
    console.log('Eliminando acceso', id);
  };

  return (
    <div className="bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-4">Accesos (Rol simulado: {rol})</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300">Filtrar por:</label>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white"
        >
          <option value="">Todos</option> {/* Opción vacía para mostrar todos */}
          <option value="trabajador">Trabajadores</option>
          <option value="residente">Residentes</option>
        </select>
      </div>

      <table className="min-w-full border-collapse border border-gray-600">
        <thead>
          <tr className="bg-indigo-700">
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">ID Persona</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Nombre</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Apellido</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">DNI</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Tipo Persona</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Rol</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {accesos.length > 0 ? (
            accesos.map((persona) => (
              <tr key={persona.id_persona} className="hover:bg-gray-800">
                <td className="px-4 py-2 text-sm text-gray-200">{persona.id_persona}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.nombre}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.apellido}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.dni}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.tipo_persona}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.rol}</td>
                <td className="px-4 py-2 text-sm text-gray-200">
                  <button
                    onClick={() => handleEdit(persona.id_persona)}
                    className="bg-yellow-500 text-white py-1 px-3 rounded-md hover:bg-yellow-600 mr-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(persona.id_persona)}
                    className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="px-4 py-2 text-sm text-gray-200 text-center">
                No se encontraron registros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Accesos;
