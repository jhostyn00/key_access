'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient'; // Cliente de Supabase
import { useRouter } from 'next/navigation';

export default function Historial() {
  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Estado para el usuario
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Recuperamos los datos del usuario desde localStorage
    const storedUser = JSON.parse(localStorage.getItem('usuario'));  // Aquí recuperamos el usuario guardado

    if (storedUser) {
      setUser(storedUser);  // Si el usuario existe en localStorage, lo guardamos en el estado
    } else {
      // Si no hay usuario, redirigimos al login
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!user?.id_persona) {
      setError('Usuario no encontrado.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Consulta para obtener datos de acceso del usuario actual
        const { data, error } = await supabase
          .from('acceso')
          .select(`
            id_acceso,
            tipo_movimiento,
            fecha_hora,
            id_autorizador,
            observaciones,
            persona:id_persona (nombre, apellido)
          `)
          .eq('id_persona', user.id_persona)  // Solo filtramos por 'id_persona'
          .order('fecha_hora', { ascending: false })
          .limit(10);  // Limita los resultados a 10 (ajusta según sea necesario)

        if (error) throw new Error(error.message);

        setAccesos(data || []);
      } catch (err) {
        console.error('Error al obtener accesos:', err.message || err);
        setError('Ocurrió un error al cargar los registros.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);  // Dependemos del 'user' para volver a cargar los datos si cambia

  if (error) {
    return (
      <div className="bg-gray-900 text-white p-6">
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900 text-white p-6">
        <p className="text-gray-300">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#7b93a7] text-white p-6">
      <h2 className="text-2xl font-bold mb-4">Registros de Acceso</h2>

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
    </div>
  );
}
