'use client';

import { useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [usuario, setUsuario] = useState(''); // DNI
  const [contrasena, setContrasena] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('persona')
      .select('*')
      .eq('dni', usuario)
      .single();

    if (error || !data) {
      alert('Usuario no encontrado');
      return;
    }

    // Comparación directa (texto plano)
    if (contrasena !== data.uid_tarjeta) {
      alert('Contraseña incorrecta');
      return;
    }

    // Guardamos el id_persona en el localStorage
    localStorage.setItem('user_id', data.id_persona); 

    alert('Bienvenido, ' + data.nombre);

    // Redirigir al historial de accesos
    router.push('/historial'); // Cambia esta ruta si la página de historial está en otro lugar
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center font-[Outfit] px-6 py-12">
      <div className="flex flex-col md:flex-row items-center gap-8 backdrop-blur-md bg-white/10 p-8 rounded-3xl shadow-lg max-w-4xl w-full">
        <form onSubmit={handleLogin} className="w-full max-w-sm text-white bg-white/20 p-6 rounded-2xl backdrop-blur-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold">INGRESA</h2>
            <a href="/dashboard" className="text-sm text-white/80 hover:text-white transition">
              REGISTRARSE
            </a>
          </div>
          <label className="text-sm block mb-1">DNI</label>
          <input type="text" placeholder="Ingrese su DNI" value={usuario} onChange={(e) => setUsuario(e.target.value)} className="w-full mb-4 p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          <label className="text-sm block mb-1">Contraseña</label>
          <input type="password" placeholder="Ingrese su contraseña" value={contrasena} onChange={(e) => setContrasena(e.target.value)} className="w-full mb-4 p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          <button type="submit" className="w-full bg-white/30 hover:bg-white/40 transition-colors text-white py-3 rounded-full font-semibold text-lg">
            Entrar →
          </button>
        </form>
        {/* Calendar Box */}
        <div className="w-full max-w-sm text-black bg-white/30 backdrop-blur-xl rounded-2xl p-6 flex flex-col items-center justify-between">
          <div className="text-center mb-4">
            <h1 className="text-5xl font-bold text-black">Jan</h1>
            <h2 className="text-3xl text-gray-700 font-light">2025</h2>
          </div>

          <p className="text-center text-sm text-black/70 mb-4">
            Selasa 06<br />
            January 2025<br />
            Pinterest
          </p>

          <div className="w-40 h-40 bg-gradient-to-br from-pink-200 to-pink-400 rounded-full mb-6"></div>

          <button className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-900 transition">
            Click Here
          </button>
        </div>
      </div>
    </div>
  );
}
