'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

function Accesos() {
  const [user, setUser] = useState({ id: '1234' }); // id simulado
  const [rol, setRol] = useState('trabajador');
  const [accesos, setAccesos] = useState([]);
  const [filtro, setFiltro] = useState('trabajador'); // Filtro por tipo de persona

  useEffect(() => {
    const fetchAccesos = async () => {
      const { data, error } = await supabase
        .from('acceso')
        .select(`
          id_acceso,
          tipo_movimiento,
          id_persona,
          id_autorizador,
          observaciones,
          fecha_hora,
          persona (
            nombre,
            apellido,
            dni,
            tipo_persona
          )
        `)
        .eq('persona.tipo_persona', filtro) // Filtrar por tipo de persona (trabajador o residente)
        .order('fecha_hora', { ascending: false });

      if (error) {
        console.error('Error obteniendo accesos:', error);
        return;
      }

      setAccesos(data);
    };

    if (user) {
      fetchAccesos();
    }
  }, [user, filtro]); // Se vuelve a ejecutar cuando cambie el filtro

  return (
    <div className="bg-gray-900 text-white">
      <h2 className="text-2xl font-bold mb-4">Accesos (Rol simulado: {rol})</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300">Filtrar por:</label>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white"
        >
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
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {accesos.map((acceso) => (
            <tr key={acceso.id_acceso} className="hover:bg-gray-800">
              <td className="px-4 py-2 text-sm text-gray-200">{acceso.persona.dni}</td>
              <td className="px-4 py-2 text-sm text-gray-200">{acceso.persona.nombre}</td>
              <td className="px-4 py-2 text-sm text-gray-200">{acceso.persona.apellido}</td>
              <td className="px-4 py-2 text-sm text-gray-200">{acceso.persona.dni}</td>
              <td className="px-4 py-2 text-sm text-gray-200">{acceso.persona.tipo_persona}</td>
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
