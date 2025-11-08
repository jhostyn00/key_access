'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

function Accesos() {
  const [user, setUser] = useState(null); // El usuario será cargado desde el localStorage
  const [accesos, setAccesos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Cargar usuario desde localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('usuario')); // Obtener usuario desde localStorage
    if (storedUser) {
      setUser(storedUser); // Establecer el usuario en el estado
    }
  }, []);

  // Cargar los accesos según el rol del usuario
  useEffect(() => {
    if (!user) return; // Si el usuario no está logueado, no hacemos la consulta

    const fetchAccesos = async () => {
      let query = supabase
        .from('visitante') // Consultamos la tabla 'visitante'
        .select(`
          id_visitante,
          id_residente_visitado,
          persona:persona!inner(id_persona, nombre, apellido, dni, tipo_persona) // Relacionamos con la tabla persona
        `)
        .eq('id_residente_visitado', user.id); // Filtramos por el residente logueado

      // Si el usuario es Administrador, no aplicamos ningún filtro, mostramos todos
      if (user.rol === 'administrador') {
        query = supabase
          .from('visitante')
          .select(`
            id_visitante,
            id_residente_visitado,
            persona:persona!inner(id_persona, nombre, apellido, dni, tipo_persona) // Relacionamos con la tabla persona
          `)
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo accesos:', error.message || error);
        return;
      }

      setAccesos(data); // Guardar los accesos en el estado
    };

    fetchAccesos(); // Llamar la función para obtener los accesos cuando el usuario está logueado
  }, [user]);

  // Filtro de búsqueda
  const accesosFiltrados = accesos.filter((persona) => {
    const termino = busqueda.toLowerCase();
    return (
      persona.persona.nombre.toLowerCase().includes(termino) ||
      persona.persona.apellido.toLowerCase().includes(termino) ||
      persona.persona.dni.toLowerCase().includes(termino) ||
      persona.id_residente_visitado.toString().includes(termino) // Buscar por ID residente visitado
    );
  });

  return (
    <div className="bg-gray-100 text-white p-6">
      <h2 className="text-2xl font-bold mb-4">Accesos (Rol simulado: {user ? user.rol : 'Cargando...'})</h2>

      {/* Filtros y tabla */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm bg-gray-100 font-medium text-gray-300 mb-1">Buscar por nombre, apellido, DNI o ID:</label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej. Juan, García, 12345678"
            className="w-72 px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white"
          />
        </div>
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
          {accesosFiltrados.length > 0 ? (
            accesosFiltrados.map((persona) => (
              <tr key={persona.id_residente_visitado} className="hover:bg-gray-800">
                <td className="px-4 py-2 text-sm text-gray-200">{persona.id_residente_visitado}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.persona.nombre}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.persona.apellido}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.persona.dni}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.persona.tipo_persona}</td>
                <td className="px-4 py-2 text-sm text-gray-200">
                  <button className="bg-yellow-500 text-white py-1 px-3 rounded-md hover:bg-yellow-600 mr-2">
                    Editar
                  </button>
                  <button className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600">
                    Dar de baja
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-4 py-2 text-sm text-gray-200 text-center">
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
