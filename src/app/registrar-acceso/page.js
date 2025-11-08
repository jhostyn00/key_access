'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import supabase from '@/lib/supabaseClient';

export default function RegistrarAccesoPage() {
  const searchParams = useSearchParams();
  const uid = searchParams?.get('uid');
  const [status, setStatus] = useState('Procesando...');

  useEffect(() => {
    if (!uid) {
      setStatus('❌ UID no encontrado');
      return;
    }

    const registrar = async () => {
      // Buscar a la persona por uid_tarjeta
      const { data: persona, error: personaError } = await supabase
        .from('persona')
        .select('id_persona')
        .eq('uid_tarjeta', uid)
        .single();

      if (personaError || !persona) {
        setStatus('❌ UID no válido');
        return;
      }

      const id_persona = persona.id_persona;

      // Contar el número de accesos previos de esta persona (sin contar el actual)
      const { data: accesosPrevios, error: accesosError } = await supabase
        .from('acceso')
        .select('id_acceso')
        .eq('id_persona', id_persona);

      if (accesosError) {
        setStatus('❌ Error obteniendo accesos previos');
        return;
      }

      // Determinar el tipo de movimiento basado en la cantidad de accesos previos
      const esEntrada = accesosPrevios.length % 2 === 0; // Si la cantidad de accesos es par, es una "entrada" (primer acceso)
      const tipoMovimiento = esEntrada ? 'ingreso' : 'salida';

      // Obtener el último id_acceso para generar uno nuevo
      const { data: maxIdData, error: maxIdError } = await supabase
        .from('acceso')
        .select('id_acceso')
        .order('id_acceso', { ascending: false })
        .limit(1)
        .single();

      if (maxIdError && maxIdError.code !== 'PGRST116') {
        setStatus('❌ Error obteniendo último id_acceso');
        return;
      }

      const nuevoIdAcceso = maxIdData ? maxIdData.id_acceso + 1 : 1;

      // Fecha y hora actual formateada a 'YYYY-MM-DD HH:mm:ss'
      const now = new Date();
      const fechaHora =
        now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');

      // Insertar en la tabla 'acceso'
      const { error: accesoError } = await supabase
        .from('acceso')
        .insert({
          id_acceso: nuevoIdAcceso,
          id_persona: id_persona,
          tipo_movimiento: tipoMovimiento, // Se registra como ingreso o salida
          id_autorizador: 38, // Ajusta según tu lógica
          observaciones: 'Acceso registrado automáticamente',
          fecha_hora: fechaHora,
        });

      if (accesoError) {
        console.error('Error registrando acceso:', accesoError);
        setStatus('❌ Error al registrar acceso: ' + accesoError.message);
        return;
      }

      setStatus(`✅ Acceso registrado correctamente como ${tipoMovimiento}`);
    };

    registrar();
  }, [uid]);

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Registro de Acceso</h1>
      <p>{status}</p>
    </main>
  );
}
