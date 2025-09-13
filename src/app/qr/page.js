"use client";

import { useEffect } from "react";
import QRCode from "qrcode";

export default function Home() {
  useEffect(() => {
    const canvas = document.getElementById("qrcode");

    if (canvas) {
      QRCode.toCanvas(
        canvas,
        "https://www.youtube.com/watch?v=xvFZjo5PgG0&list=RDxvFZjo5PgG0&start_radio=1",
        {
          width: 200,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        function (error) {
          if (error) console.error(error);
          else console.log("✅ QR code generado");
        }
      );
    }
  }, []);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
      <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-10 text-center max-w-sm shadow-2xl text-white transition-transform duration-300 hover:-translate-y-2 animate-fadeIn">
        {/* Logo */}
        <img
          src="/qr.jpg"
          alt="Logo Residencial"
          className="w-20 h-20 mb-4 rounded-full border-2 border-white shadow-lg mx-auto"
        />

        {/* Título */}
        <h2 className="text-xl font-semibold mb-2 text-gray-100">
          Key Acces Company
        </h2>
        <p className="text-base mb-6 text-gray-300">
          Escanea el código QR para más información
        </p>

        {/* Contenedor QR */}
        <canvas
        id="qrcode"
        className="block mx-auto p-4 bg-white rounded-xl shadow-inner"
        />
      </div>
    </main>
  );
}
