'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import Dashboard from '../dashboard/page';
import Editar from '../editar/page';
import Login from '../login/page';
import QR from '../qr/page';
import Acceso from '../acceso/page';
import Inicio from '../inicio_dashboard/page';
import PersonalInt from '../personalint/page';

/* COMPONENTE: Módulo visual reutilizable
   Muestra el contenido del módulo actual dentro de una tarjeta con estilo.
*/
const Modulo = ({ nombre, Contenido, urlActual }) => (
  <div className="modulo bg-white rounded-2xl shadow-2xl p-8 border border-teal-200">
    <h3 className="text-3xl font-bold text-teal-800 mb-4 flex items-center">
      <span className="mr-3">{nombre}</span>
    </h3>

    {/* Contenido dinámico del módulo */}
    <div className="text-xl text-gray-700 leading-relaxed mb-6">
      <Contenido />
    </div>

    {/* Información de la URL actual */}
    <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
      <p className="text-sm font-medium text-teal-900 mb-1">URL Actual para este Módulo:</p>
      <code className="text-teal-700 bg-white px-2 py-1 rounded text-sm font-mono break-all">
        {urlActual}
      </code>
    </div>
  </div>
);

/* COMPONENTE PRINCIPAL: Panel de Control */
export default function Panel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Estado: módulo activo según la URL
  const moduloFromUrl = searchParams.get('modulo') || 'dashboard';
  const [moduloActivo, setModuloActivo] = useState(moduloFromUrl);

  /* Diccionario de módulos (rutas -> componentes) */
  const contenidoModulos = {
    dashboard: Dashboard,
    editar: Editar,
    login: Login,
    qr: QR,
    acceso: Acceso,
    inicio_dashboard: Inicio,
    personalint: PersonalInt,
  };

  /* Nombres descriptivos para mostrar en la interfaz */
  const nombresBonitos = {
    dashboard: 'Dashboard',
    editar: 'Editar',
    login: 'Login',
    qr: 'QR',
    acceso: 'Acceso',
    inicio_dashboard: 'Inicio',
    personalint: 'Personal Interno',
  };

  /* Iconos representativos para cada módulo */
  const iconos = {
    dashboard: '🏠',
    editar: '✏️',
    login: '🔐',
    qr: '📱',
    acceso: '👥',
    inicio_dashboard: '🚀',
    personalint: '👤',
  };

  /* Función para cambiar el módulo activo y actualizar la URL sin recargar */
  const cambiarModulo = (modulo) => {
    setModuloActivo(modulo);
    router.replace(`/panel?modulo=${modulo}`, undefined, { shallow: true });
  };

  /* Efecto: sincroniza el estado si la URL cambia manualmente */
  useEffect(() => {
    if (moduloFromUrl !== moduloActivo) setModuloActivo(moduloFromUrl);
  }, [moduloFromUrl]);

  /* Genera la URL actual del módulo activo */
  const urlActual =
    typeof window !== 'undefined'
      ? `${window.location.origin}${pathname}?modulo=${moduloActivo}`
      : `http://localhost:3000${pathname}?modulo=${moduloActivo}`;

  /* Obtiene el componente correspondiente o muestra un mensaje si no existe */
  const ComponenteActivo =
    contenidoModulos[moduloActivo] || (() => <div>Módulo no encontrado</div>);

  /* Función de cierre de sesión */
  const cerrarSesion = () => {
    // Redirige al login (puedes agregar aquí la lógica de limpieza de sesión)
    router.push('/panel?modulo=login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50">
      
      {/* SECCIÓN PRINCIPAL */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        
        {/* Encabezado del panel */}
        <header className="bg-white rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Panel de Control - {nombresBonitos[moduloActivo] || moduloActivo}
          </h1>
          <div className="text-sm text-gray-600 bg-teal-50 p-3 rounded-lg w-full sm:w-auto">
            <span className="font-medium">URL Actual:</span> {urlActual}
          </div>
        </header>

        {/* Contenido dinámico */}
        <div className="flex-1 overflow-y-auto">
          <Modulo
            key={moduloActivo}
            nombre={nombresBonitos[moduloActivo] || moduloActivo}
            Contenido={ComponenteActivo}
            urlActual={urlActual}
          />
        </div>
      </div>

      {/* BARRA LATERAL */}
      <aside className="w-72 bg-gradient-to-b from-teal-600 to-cyan-500 text-white p-6 shadow-2xl flex flex-col">
        
        {/* Título del panel */}
        <h2 className="text-3xl font-bold mb-8 text-center bg-opacity-10 rounded-xl py-3">
          Panel Único
        </h2>

        {/* Navegación de módulos */}
        <nav className="flex-1 flex flex-col space-y-4">
          {Object.keys(contenidoModulos).map((mod) => (
            <button
              key={mod}
              onClick={() => cambiarModulo(mod)}
              className={`flex items-center p-4 text-lg font-semibold rounded-xl
                hover:bg-white hover:bg-opacity-20 hover:text-teal-900
                hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white
                ${
                  moduloActivo === mod
                    ? 'bg-white bg-opacity-30 scale-105 ring-2 ring-white text-teal-900'
                    : ''
                }`}
            >
              <span className="mr-3 text-2xl">{iconos[mod] || '📁'}</span>
              {nombresBonitos[mod] || mod}
            </button>
          ))}
        </nav>

        {/* Botón de Cerrar Sesión */}
        <div className="mt-8">
          <button
            onClick={cerrarSesion}
            className="w-full flex items-center justify-center p-4 text-lg font-semibold rounded-xl
              bg-red-500 hover:bg-red-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </div>
  );
}
