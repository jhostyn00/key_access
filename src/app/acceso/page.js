'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import supabase from '@/lib/supabaseClient';

// Import dinámico para que Next.js no intente renderizar en servidor
const QrReader = dynamic(() => import('react-qr-reader'), { ssr: false });

export default function AccesoQRPage() {
  const [resultado, setResultado] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);

  // Función para registrar el acceso en la base de datos
  const registrarAccesoDesdeQR = async (uidTarjeta) => {
    setResultado(null);
    setError(null);
    setScanning(false);

    try {
      // Busca la persona con el UID escaneado
      const { data: persona, error: errorPersona } = await supabase
        .from('persona')
        .select('id_persona, nombre, apellido')
        .eq('uid_tarjeta', uidTarjeta)
        .single();

      if (errorPersona || !persona) {
        setError('❌ Persona no encontrada');
        setScanning(true);
        return;
      }

      const fechaHoraActual = new Date().toISOString();

      // Inserta el registro de acceso
      const { data: acceso, error: errorAcceso } = await supabase
        .from('acceso')
        .insert([
          {
            id_persona: persona.id_persona,
            tipo_movimiento: 'ingreso',
            fecha_hora: fechaHoraActual,
            observaciones: 'QR escaneado',
          },
        ])
        .select()
        .single();

      if (errorAcceso) {
        setError('❌ Error registrando acceso');
        setScanning(true);
        return;
      }

      // Muestra resultado y luego vuelve a escanear
      setResultado({
        nombre: persona.nombre,
        apellido: persona.apellido,
        fecha: acceso.fecha_hora,
      });

      setTimeout(() => {
        setResultado(null);
        setScanning(true);
      }, 5000);
    } catch (err) {
      setError('❌ Error interno');
      console.error(err);
      setScanning(true);
    }
  };

  // Manejador cuando se escanea un QR válido
  const handleScan = (data) => {
    if (data && scanning) {
      // Aquí adaptas según el formato del QR que tengas
      // Por ejemplo, si el QR es solo el UID directamente:
      const uid = data.trim();

      // Si tu QR es una URL u otro formato y quieres extraer el UID,
      // adapta esta línea, por ejemplo:
      // const uid = data.trim().split('/').pop();

      registrarAccesoDesdeQR(uid);
    }
  };

  
  const handleError = (err) => {
    console.error(err);
    setError('❌ Error accediendo a la cámara');
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Escáner QR de Acceso</h1>

      {scanning ? (
        <div className="w-full max-w-xs overflow-hidden rounded border border-gray-400">
          <QrReader
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%' }}
          />
        </div>
      ) : (
        <p className="text-blue-600 font-semibold">Procesando...</p>
      )}

      <div className="mt-6 text-center">
        {error && <p className="text-red-600 font-semibold">{error}</p>}
        {resultado && (
          <>
            <p className="text-green-600 font-semibold">
              ✅ Acceso registrado para {resultado.nombre} {resultado.apellido}
            </p>
            <p className="text-gray-700">
              Hora: {new Date(resultado.fecha).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
