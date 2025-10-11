'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'tu_clave_secreta_aqui';

export default function Restablecer() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [valid, setValid] = useState(null);
  const [uidTarjeta, setUidTarjeta] = useState(null);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }
    try {
      // Verificar token
      const decoded = jwt.verify(token, JWT_SECRET);
      setUidTarjeta(decoded.uid_tarjeta);
      setValid(true);
    } catch (err) {
      setValid(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setMessage('Ingresa una nueva contraseña');
      return;
    }

    // Aquí haces la llamada para actualizar la contraseña en tu backend
    // usando el uid_tarjeta que obtuviste del token

    try {
      const res = await fetch('/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid_tarjeta: uidTarjeta, password }),
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
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
        </label>
        <button type="submit">Guardar nueva contraseña</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
