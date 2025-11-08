'use client';

import { useState } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabaseClient';

export default function RegistroPage() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleRegistro = async (e) => {
    e.preventDefault();

    const hash = await bcrypt.hash(contrasena, 10);

    const { error } = await supabase.from('usuarios').insert({
      usuario,
      contrasena: hash,
      rol: 'portero', // puedes cambiar esto
    });

    if (error) return alert('Error: ' + error.message);

    alert('Usuario registrado con éxito');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#7d93a7] to-[#b7d1e0] relative overflow-hidden font-[Outfit]">
      {/* Círculos animados de fondo */}
      <div className="absolute w-[600px] h-[600px] bg-[#324f6279] rounded-full top-10 left-20 animate-move1 filter blur-2xl"></div>
      <div className="absolute w-[600px] h-[600px] bg-[#2085925b] rounded-full top-40 left-60 animate-move2 filter blur-2xl"></div>
      <div className="absolute w-[600px] h-[600px] bg-[#324f6279] rounded-full top-60 left-30 animate-move3 filter blur-2xl"></div>

      {/* Formulario */}
      <form 
        onSubmit={handleRegistro} 
        className="relative z-10 w-full max-w-sm bg-white/20 backdrop-blur-xl rounded-3xl p-8 shadow-lg flex flex-col"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Registro</h2>

        <input
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full mb-4 p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          className="w-full mb-6 p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          required
        />

        <button 
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors text-white py-3 rounded-full font-semibold text-lg"
        >
          Registrarse →
        </button>
      </form>
    </div>
  );
}
