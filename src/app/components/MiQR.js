'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

export default function MiQR() {
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQr = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        console.error('Usuario no logueado');
        return;
      }

      const { data, error } = await supabase
        .from('persona')
        .select('qr_url')
        .eq('id_persona', userId)
        .single();

      if (error) {
        console.error('Error al obtener QR:', error);
      } else {
        setQrUrl(data.qr_url);
      }

      setLoading(false);
    };

    fetchQr();
  }, []);

  if (loading) return <p className="text-white">Cargando QR...</p>;

  if (!qrUrl) return <p className="text-red-400">No se encontró código QR.</p>;

  return (
    <div className="p-4 bg-white rounded shadow text-center">
      <h2 className="text-lg font-bold mb-2">Tu Código QR</h2>
      <img src={qrUrl} alt="Código QR" width={200} />
    </div>
  );
}
