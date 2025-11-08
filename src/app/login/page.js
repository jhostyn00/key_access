'use client';

import { useState } from 'react';

import supabase from '@/lib/supabaseClient';

import { useRouter } from 'next/navigation';
import AnalogClock from "@/app/components/AnalogClock";


export default function LoginPage() {

 const [usuario, setUsuario] = useState(''); // DNI

 const [contrasena, setContrasena] = useState('');

const [showModal, setShowModal] = useState(false);
const [loadingModal, setLoadingModal] = useState(false);


 const router = useRouter();
 
const handleLogin = async (e) => {
  e.preventDefault();

  // Consultar por DNI
  const { data, error } = await supabase
    .from('persona')
    .select('*')
    .eq('dni', usuario)
    .single();

  if (error || !data) {
    alert('Usuario no encontrado');
    return;
  }

  if (contrasena !== data.clave) {
    alert('Contraseña incorrecta');
    return;
  }

  // ✅ Guardar todos los datos en localStorage
  localStorage.setItem('usuario', JSON.stringify(data));
  localStorage.setItem('user_id', data.id_persona);
  localStorage.setItem('user_nombre', data.nombre);
  localStorage.setItem('user_apellido', data.apellido);
  localStorage.setItem('user_qr', data.qr_url);
  localStorage.setItem('user_dni', data.dni);
  localStorage.setItem('user_correo', data.correo);
  localStorage.setItem('user_uid_tarjeta', data.uid_tarjeta);
  localStorage.setItem('user_tipo_persona', data.tipo_persona); 
  // Puedes agregar más campos si los tienes en tu tabla `persona`

  alert('Bienvenido, ' + data.nombre);

  // Redirigir al panel
  router.push('/panel');
};


const handleForgotPassword = async (dni) => {
  if (!dni) {
    alert('Por favor ingresa tu DNI.');
    return;
  }

  try {
    setLoadingModal(true);

    // Consulta a supabase para obtener datos del usuario
    const { data: persona, error } = await supabase
      .from('persona')
      .select('nombre, uid_tarjeta, correo')
      .eq('dni', dni)
      .single();

    if (error || !persona || !persona.correo) {
      alert('No se encontró el usuario o no tiene correo registrado.');
      return;
    }

    // Enviar petición al backend para enviar el correo
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: persona.nombre,
        correo: persona.correo,
        uid_tarjeta: persona.uid_tarjeta,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert('Se ha enviado un correo con tu contraseña.');
      setShowModal(false);
    } else {
      alert('Hubo un error al enviar el correo: ' + (result.error || 'Error desconocido'));
    }
  } catch (error) {
    alert('Error inesperado: ' + error.message);
  } finally {
    setLoadingModal(false);
  }
};



function ForgotPasswordModal({ isOpen, onClose, onSubmit, loading }) {
  const [dniInput, setDniInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-black">
        <h2 className="text-xl font-semibold mb-4">Recuperar Contraseña</h2>
        <input
          type="text"
          placeholder="Ingrese su DNI"
          value={dniInput}
          onChange={(e) => setDniInput(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(dniInput)}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}




 return (
  <>
    <div className="fondo-login min-h-screen flex items-center justify-center font-[Outfit] px-6 py-12">
      <div className="circle circle1"></div>
  <div className="circle circle2"></div>
  <div className="circle circle3"></div>
  <div className="circle circle4"></div>
  <div className="circle circle5"></div>
      <div className="flex flex-col md:flex-row items-center gap-8 backdrop-blur-md bg-white/10 p-8 rounded-3xl shadow-lg max-w-4xl w-full">
        {/* Login Box */}
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm text-white bg-white/20 p-6 rounded-2xl backdrop-blur-xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold">INGRESA</h2>
          </div>

          <label className="text-sm block mb-1">DNI</label>
          <input
            type="text"
            placeholder="Ingrese su DNI"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full mb-4 p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            required
          />

          <label className="text-sm block mb-1">Contraseña</label>
          <input
            type="password"
            placeholder="Ingrese su contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="w-full mb-4 p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            required
          />

          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-xs text-white/80 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-white/30 hover:bg-white/40 transition-colors text-white py-3 rounded-full font-semibold text-lg"
          >
            Entrar →
          </button>

        </form>

        {/* Calendar Box */}
        <div className="w-full max-w-sm text-black bg-white/30 backdrop-blur-xl rounded-2xl p-6 flex flex-col items-center justify-between">
          <div className="text-center mb-4">
            <h1 className="text-5xl font-bold text-black">Oct</h1>
            <h2 className="text-3xl text-gray-700 font-light">2025</h2>
          </div>

          <p className="text-center text-sm text-black/70 mb-4">
            Lima - Perú<br />
            Octubre 2025<br />
            Key Access
          </p>

          <div className="w-40 h-40 bg-[#324f62] rounded-full mb-6">
            <AnalogClock />
          </div>

          <a href="/dashboard" className="bg-white text-white px-6 py-2 rounded-full hover:bg-gray-200 transition">
            Registrate aquí
          </a>
        </div>
      </div>
    </div>

    <ForgotPasswordModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onSubmit={handleForgotPassword}
      loading={loadingModal}
    />
  </>
);


}