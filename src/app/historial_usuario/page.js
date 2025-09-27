'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

function Accesos() {
  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Consulta para obtener datos de acceso y el nombre y apellido de la persona
        const { data, error } = await supabase
          .from('acceso')
          .select(`
            id_acceso,
            tipo_movimiento,
            fecha_hora,
            id_autorizador,
            observaciones,
            persona:id_persona (nombre, apellido)  // Traemos nombre y apellido
          `)
          .order('fecha_hora', { ascending: false });

        if (error) {
          throw new Error(error.message); // Lanzamos un error detallado si ocurre un error
        }

        console.log('Datos de acceso con nombre y apellido:', data); // Verifica los datos obtenidos
        setAccesos(data);
      } catch (err) {
        console.error('Error al obtener accesos:', err.message || err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-4">Registros de Acceso</h2>

      {loading ? (
        <p className="text-gray-300">Cargando datos...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-600">
            <thead>
              <tr className="bg-indigo-700">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">ID Acceso</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Nombre y Apellido</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Movimiento</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Fecha/Hora</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Autorizador</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {accesos.length > 0 ? (
                accesos.map((acceso) => (
                  <tr key={acceso.id_acceso} className="hover:bg-gray-800">
                    <td className="px-4 py-2 text-sm text-gray-200">{acceso.id_acceso}</td>
                    <td className="px-4 py-2 text-sm text-gray-200">
                      {acceso.persona ? `${acceso.persona.nombre} ${acceso.persona.apellido}` : 'Desconocido'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-200">{acceso.tipo_movimiento}</td>
                    <td className="px-4 py-2 text-sm text-gray-200">
                      {new Date(acceso.fecha_hora).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-200">{acceso.id_autorizador}</td>
                    <td className="px-4 py-2 text-sm text-gray-200">{acceso.observaciones}</td>
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
      )}
    </div>
  );
}

export default Accesos;
