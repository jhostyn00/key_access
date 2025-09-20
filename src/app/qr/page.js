"use client";

import { useEffect } from "react";
import QRCode from "qrcode";

export default function Home() {
  useEffect(() => {
    const canvas = document.getElementById("qrcode");

    if (canvas) {
      // 🔹 Generar UID dinámico
      const uidBase =
        "USR-" + Math.floor(Math.random() * 10000).toString().padStart(4, "0");

      // 🔹 URL dinámica
      const urlGenerada = `https://tusitio.com/p/${uidBase}`;

      // 🔹 Crear QR dinámico
      QRCode.toCanvas(
        canvas,
        urlGenerada,
        {
          width: 200,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        function (error) {
          if (error) console.error(error);
          else console.log("✅ QR dinámico generado:", urlGenerada);
        }
      );
    }
  }, []);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
      <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-10 text-center max-w-sm shadow-2xl text-white transition-transform duration-300 hover:-translate-y-2 animate-fadeIn">
        
        {/* Título */}
        <h2 className="text-xl font-semibold mb-6 text-gray-100">
          Key Acces Company
        </h2>
        

        {/* Contenedor QR */}
        <canvas
          id="qrcode"
          className="block mx-auto p-4 bg-white rounded-xl shadow-inner"
        />
      </div>
    </main>
  );
}
