'use client';

import { useState } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', usuario)
      .single();

    if (error || !data) return alert('Usuario no encontrado');

    const match = await bcrypt.compare(contrasena, data.contrasena);

    if (!match) {
      alert('Contraseña incorrecta');
    } else {
      alert('Bienvenido, ' + data.usuario);
      router.push('/dashboard'); // puedes cambiar esta ruta
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-sm mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-2xl mb-4">Iniciar Sesión</h2>
      <input
        placeholder="Usuario"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
        className="w-full mb-3 p-2 border rounded text-black"
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        className="w-full mb-4 p-2 border rounded text-black"
        required
      />
      <button className="bg-blue-600 text-white w-full py-2 rounded">Entrar</button>
    </form>
  );
}
