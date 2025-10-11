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

      // Insertar solo en la tabla 'acceso'
      const { error: accesoError } = await supabase
        .from('acceso')
        .insert({
          id_persona: id_persona,
          tipo_movimiento: 'entrada', // ajusta según sea entrada o salida
          id_autorizador: null,        // o asigna un id si tienes autorizador
          observaciones: null,         // opcional
          // fecha_hora se asume que es autogenerada en la DB
        });

      if (accesoError) {
        setStatus('❌ Error al registrar acceso');
        return;
      }

      setStatus('✅ Acceso registrado correctamente');
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
