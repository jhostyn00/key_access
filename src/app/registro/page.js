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
      rol: 'portero' // puedes cambiar esto
    });

    if (error) return alert('Error: ' + error.message);

    alert('Usuario registrado con éxito');
  };

  return (
    <form onSubmit={handleRegistro} className="max-w-sm mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-2xl mb-4">Registro</h2>
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
      <button className="bg-blue-600 text-white w-full py-2 rounded">Registrarse</button>
    </form>
  );
}
