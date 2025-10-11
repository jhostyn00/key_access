'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

function Accesos() {
  const [user, setUser] = useState({ id: '1234' });
  const [rol, setRol] = useState('trabajador');
  const [accesos, setAccesos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [editandoPersona, setEditandoPersona] = useState(null);
  const [formData, setFormData] = useState({
    rol: ''
  });

  // Nuevo estado para la confirmación de baja
  const [personaParaBaja, setPersonaParaBaja] = useState(null);

  // Obtener accesos desde Supabase
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

      if (filtro) {
        if (filtro === 'eliminado') {
          query = query.eq('rol', '0');
        } else {
          query = query.eq('rol', filtro);
        }
      } else {
        query = query.neq('rol', '0');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo accesos:', error);
        return;
      }

      setAccesos(data);
    };

    if (user) {
      fetchAccesos();
    }
  }, [user, filtro]);

  // Editar una persona (abrir modal) - solo setear rol
  const handleEdit = (persona) => {
    setEditandoPersona(persona);
    setFormData({
      rol: persona.rol
    });
  };

  // Guardar cambios en Supabase - solo actualiza rol
  const handleGuardarEdicion = async () => {
    const { error } = await supabase
      .from('persona')
      .update({ rol: formData.rol })
      .eq('id_persona', editandoPersona.id_persona);

    if (error) {
      console.error('Error al actualizar persona:', error);
      return;
    }

    setEditandoPersona(null);
    setFormData({ rol: '' });
    setFiltro(filtro); // Refrescar lista
  };

  // Confirmar baja: abrir modal confirmación
  const handleConfirmarBaja = (persona) => {
    setPersonaParaBaja(persona);
  };

  // Baja lógica: quitar rol (poner rol a "0")
  const handleDelete = async () => {
    if (!personaParaBaja) return;

    const { error } = await supabase
      .from('persona')
      .update({ rol: '0' }) // rol 0 = eliminado
      .eq('id_persona', personaParaBaja.id_persona);

    if (error) {
      console.error('Error al dar de baja persona:', error);
      return;
    }

    setPersonaParaBaja(null);
    setFiltro(filtro); // Refrescar lista
  };

  // Filtrado local por búsqueda
  const accesosFiltrados = accesos.filter((persona) => {
    const termino = busqueda.toLowerCase();
    return (
      persona.nombre.toLowerCase().includes(termino) ||
      persona.apellido.toLowerCase().includes(termino) ||
      persona.dni.toLowerCase().includes(termino)
    );
  });

  // Para mostrar el texto correspondiente al rol
  const rolTexto = (rol) => {
    switch (rol) {
      case '1':
        return 'Propietario';
      case '2':
        return 'Trabajador';
      case '3':
        return 'Residente';
      case '0':
        return 'Eliminado';
      default:
        return rol;
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-4">Accesos (Rol simulado: {rol})</h2>

      {/* 🔍 Filtros horizontales */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        {/* Barra de búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Buscar por nombre, apellido o DNI:
          </label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej. Juan, García, 12345678"
            className="w-72 px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white"
          />
        </div>

        {/* Filtro por rol */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por rol:</label>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-48 px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white"
          >
            <option value="">Todos (sin eliminados)</option>
            <option value="1">Propietario</option>
            <option value="2">Trabajador</option>
            <option value="3">Residente</option>
            <option value="eliminado">Eliminados</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
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
          {accesosFiltrados.length > 0 ? (
            accesosFiltrados.map((persona) => (
              <tr key={persona.id_persona} className="hover:bg-gray-800">
                <td className="px-4 py-2 text-sm text-gray-200">{persona.id_persona}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.nombre}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.apellido}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.dni}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.tipo_persona}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{rolTexto(persona.rol)}</td>
                <td className="px-4 py-2 text-sm text-gray-200">
                  {persona.rol !== '0' && (
                    <>
                      <button
                        onClick={() => handleEdit(persona)}
                        className="bg-yellow-500 text-white py-1 px-3 rounded-md hover:bg-yellow-600 mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleConfirmarBaja(persona)}
                        className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                      >
                        Dar de baja
                      </button>
                    </>
                  )}
                  {persona.rol === '0' && (
                    <span className="text-gray-400 italic">Dado de baja</span>
                  )}
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

      {/* 🧾 Modal de edición */}
      {editandoPersona && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-md shadow-md w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-white">Editar Rol</h3>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">Rol</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ rol: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="1">Propietario</option>
                <option value="2">Trabajador</option>
                <option value="3">Residente</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setEditandoPersona(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEdicion}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación para dar de baja */}
      {personaParaBaja && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-md shadow-md w-full max-w-md text-white">
            <h3 className="text-xl font-semibold mb-4">Confirmar baja</h3>
            <p className="mb-4">
              ¿Estás seguro que quieres dar de baja a <strong>{personaParaBaja.nombre} {personaParaBaja.apellido}</strong>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setPersonaParaBaja(null)}
                className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-md"
              >
                No
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
              >
                Sí, dar de baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Accesos;
