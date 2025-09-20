'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QRPage() {
  const [usuarioData, setUsuarioData] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      setUsuarioData(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!usuarioData) return;

    const canvas = document.getElementById('qrcode');
    const dataString = JSON.stringify({
      nombre: usuarioData.nombre,
      dni: usuarioData.dni,
      // otros datos que quieras
    });

    if (canvas) {
      QRCode.toCanvas(
        canvas,
        dataString,
        {
          width: 200,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error(error);
          else console.log('✅ QR code generado');
        }
      );
    }
  }, [usuarioData]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
      <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-10 text-center max-w-sm shadow-2xl text-white transition-transform duration-300 hover:-translate-y-2 animate-fadeIn">
        <img
          src="/qr.jpg"
          alt="Logo Residencial"
          className="w-20 h-20 mb-4 rounded-full border-2 border-white shadow-lg mx-auto"
        />

        <h2 className="text-xl font-semibold mb-2 text-gray-100">
          Key Access Company
        </h2>
        <p className="text-base mb-6 text-gray-300">
          Escanea el código QR con tu información
        </p>

        <canvas
          id="qrcode"
          className="block mx-auto p-4 bg-white rounded-xl shadow-inner"
        />

        {usuarioData && (
          <p className="mt-4 text-gray-100">
            Hola, <strong>{usuarioData.nombre}</strong>
          </p>
        )}
      </div>
    </main>
  );
}
