'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // Para manejar URLs dinámicas
import { FiHome, FiEdit3, FiLogIn, FiCode, FiUsers } from 'react-icons/fi'; // Íconos corregidos

// Componente para mostrar el contenido de cada módulo
const Módulo = ({ nombre, contenido, urlActual }) => {
  return (
    <div className="modulo bg-white rounded-2xl shadow-2xl p-8 border border-teal-200"> {/* Cambiado: border-teal-200 */}
      <h3 className="text-3xl font-bold text-teal-800 mb-4 flex items-center"> {/* Cambiado: text-teal-800 */}
        <span className="mr-3">{nombre}</span>
      </h3>
      <div className="text-xl text-gray-700 leading-relaxed mb-6">{contenido}</div>
      {/* Muestra la URL respectiva del módulo */}
      <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500"> {/* Cambiado: bg-teal-50 y border-teal-500 */}
        <p className="text-sm font-medium text-teal-900 mb-1">URL Actual para este Módulo:</p> {/* Cambiado: text-teal-900 */}
        <code className="text-teal-700 bg-white px-2 py-1 rounded text-sm font-mono break-all"> {/* Cambiado: text-teal-700 */}
          {urlActual}
        </code>
      </div>
    </div>
  );
};

const Panel = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname(); // Obtiene la ruta actual de forma SSR-safe
  const moduloFromUrl = searchParams.get('modulo'); // Lee el módulo de la URL

  // Estado que gestiona el módulo activo (inicializado desde URL)
  const [moduloActivo, setModuloActivo] = useState(moduloFromUrl || 'dashboard');

  // Contenido de los módulos
  const contenidoModulos = {
    dashboard: <div>Contenido del Dashboard: Vista general con métricas, gráficos y resúmenes rápidos. ¡Explora tu panel principal!</div>,
    editar: <div>Contenido del Editor: Herramientas interactivas para modificar datos, perfiles y configuraciones en tiempo real.</div>,
    login: <div>Contenido de Login: Formulario seguro con validación, recuperación de contraseña y opciones de autenticación social.</div>,
    qr: <div>Contenido de QR: Generador y escáner de códigos QR para accesos, pagos o verificaciones móviles.</div>,
    acceso: <div>Contenido de Acceso: Gestión completa de usuarios, roles, permisos y logs de actividad para seguridad.</div>,
  };

  // Función para cambiar el módulo activo y actualizar la URL
  const cambiarModulo = (modulo) => {
    setModuloActivo(modulo);
    router.push(`/?modulo=${modulo}`); // Actualiza la URL sin recargar
  };

  // Sincroniza el estado con cambios en la URL
  useEffect(() => {
    if (moduloFromUrl && moduloFromUrl !== moduloActivo) {
      setModuloActivo(moduloFromUrl);
    }
  }, [moduloFromUrl, moduloActivo]);

  // Construye la URL actual de forma SSR-safe
  const getUrlActual = () => {
    if (typeof window !== 'undefined') {
      // Cliente: URL real
      return `${window.location.origin}${pathname}?modulo=${moduloActivo}`;
    } else {
      // SSR fallback
      return `http://localhost:3000${pathname}?modulo=${moduloActivo}`;
    }
  };

  const urlActual = getUrlActual();

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50"> {/* Cambiado: Fondo teal-verde */}
      {/* Área de contenido (izquierda, principal) */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Header dinámico con URL */}
        <header className="bg-white rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control - Módulo: {moduloActivo}</h1>
          <div className="text-sm text-gray-600 bg-teal-50 p-3 rounded-lg w-full sm:w-auto"> {/* Cambiado: bg-teal-50 */}
            <span className="font-medium">URL Actual:</span> {urlActual}
          </div>
        </header>

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto">
          <Módulo 
            nombre={moduloActivo.charAt(0).toUpperCase() + moduloActivo.slice(1)} 
            contenido={contenidoModulos[moduloActivo]} 
            urlActual={urlActual} 
          />
        </div>
      </div>

      {/* Sidebar en el lado derecho (menos común) */}
      <div className="w-72 bg-gradient-to-b from-teal-600 to-cyan-500 text-white p-6 shadow-2xl flex flex-col"> {/* Cambiado: Gradiente teal-cian */}
        <h2 className="text-3xl font-bold mb-8 text-center bg-white bg-opacity-10 rounded-xl py-3">Panel Único</h2>
        <div className="flex-1 flex flex-col space-y-4">
          <button
            onClick={() => cambiarModulo('dashboard')}
            className={`flex items-center p-4 text-lg font-semibold rounded-xl hover:bg-white hover:bg-opacity-20 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white ${
              moduloActivo === 'dashboard' ? 'bg-white bg-opacity-30 scale-105 ring-2 ring-white' : ''
            }`}
          >
            <FiHome className="mr-3 text-2xl" />
            Dashboard
          </button>
          <button
            onClick={() => cambiarModulo('editar')}
            className={`flex items-center p-4 text-lg font-semibold rounded-xl hover:bg-white hover:bg-opacity-20 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white ${
              moduloActivo === 'editar' ? 'bg-white bg-opacity-30 scale-105 ring-2 ring-white' : ''
            }`}
          >
            <FiEdit3 className="mr-3 text-2xl" />
            Editar
          </button>
          <button
            onClick={() => cambiarModulo('login')}
            className={`flex items-center p-4 text-lg font-semibold rounded-xl hover:bg-white hover:bg-opacity-20 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white ${
              moduloActivo === 'login' ? 'bg-white bg-opacity-30 scale-105 ring-2 ring-white' : ''
            }`}
          >
            <FiLogIn className="mr-3 text-2xl" />
            Login
          </button>
          <button
            onClick={() => cambiarModulo('qr')}
            className={`flex items-center p-4 text-lg font-semibold rounded-xl hover:bg-white hover:bg-opacity-20 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white ${
              moduloActivo === 'qr' ? 'bg-white bg-opacity-30 scale-105 ring-2 ring-white' : ''
            }`}
          >
            <FiCode className="mr-3 text-2xl" />
            QR
          </button>
          <button
            onClick={() => cambiarModulo('acceso')}
            className={`flex items-center p-4 text-lg font-semibold rounded-xl hover:bg-white hover:bg-opacity-20 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white ${
              moduloActivo === 'acceso' ? 'bg-white bg-opacity-30 scale-105 ring-2 ring-white' : ''
            }`}
          >
            <FiUsers className="mr-3 text-2xl" />
            Acceso
          </button>
        </div>
      </div>
    </div>
  );
};

export default Panel;
