'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

export default function Restablecer() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [valid, setValid] = useState(null);
  const [uidTarjeta, setUidTarjeta] = useState(null);
  const [clave, setClave] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
  if (!token) {
    setValid(false);
    return;
  }

  const verificarToken = async () => {
    try {
      const res = await fetch('/api/verificar-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setUidTarjeta(data.uid_tarjeta);
        setValid(true);
      } else {
        setValid(false);
      }
    } catch (err) {
      setValid(false);
    }
  };

  verificarToken();
}, [token]);


  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!clave) {    // Cambiar password por clave
    setMessage('Ingresa una nueva contraseña');
    return;
  }

  try {
    const res = await fetch('/api/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid_tarjeta: uidTarjeta, clave }),  // enviar 'clave'
    });

    if (res.ok) {
      setMessage('Contraseña actualizada correctamente.');
    } else {
      const data = await res.json();
      setMessage(data.error || 'Error al actualizar contraseña.');
    }
  } catch (error) {
    setMessage('Error en la conexión.');
  }
};


  if (valid === null) return <p>Validando token...</p>;

  if (!valid) return <p>Token inválido o expirado.</p>;

  return (
    <div>
      <h1>Restablecer contraseña</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nueva contraseña:
          <input 
  type="password" 
  value={clave} 
  onChange={e => setClave(e.target.value)} 
  required 
/>
        </label>
        <button type="submit">Guardar nueva contraseña</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
