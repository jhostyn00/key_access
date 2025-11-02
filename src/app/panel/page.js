'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// Importación de los componentes
import Dashboard from '@/app/components/InicioDashboard';
import Registros from '@/app/components/Historial';
import Horarios from '@/app/components/Horarios';
import QR from '@/app/components/MiQR';
import Administrar from '@/app/components/Principal';
import DatosUsuario from '@/app/components/DatosUsuario';
import Filtros from '@/app/components/Filtros';

const Modulo = ({ nombre, Contenido, urlActual }) => (
  <div className="modulo cuadros rounded-2xl shadow-4xl p-8">
    <h3 className="text-3xl font-bold text-teal-800 mb-4 flex items-center">
      <span className="mr-3">{nombre}</span>
    </h3>

    <div className="text-xl text-gray-700 leading-relaxed mb-6">
      <Contenido />
    </div>

    <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
      <p className="text-sm font-medium text-teal-900 mb-1">URL Actual para este Módulo:</p>
      <code className="text-teal-700 bg-white px-2 py-1 rounded text-sm font-mono break-all">
        {urlActual}
      </code>
    </div>
  </div>
);

const Panel = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const moduloFromUrl = searchParams.get('modulo') || 'dashboard';
  const [moduloActivo, setModuloActivo] = useState(moduloFromUrl);

  // Mapeo de módulos
  const contenidoModulos = {
    dashboard: Dashboard,
    registros: Registros,
    horarios: Horarios,
    qr: QR,
    administrar: Administrar,
    datos: DatosUsuario,
    filtros: Filtros,
  };

  const cambiarModulo = (modulo) => {
    setModuloActivo(modulo);
    router.replace(`/panel?modulo=${modulo}`, undefined, { shallow: true });
  };

  useEffect(() => {
    if (moduloFromUrl !== moduloActivo) {
      setModuloActivo(moduloFromUrl);
    }
  }, [moduloFromUrl]);

  const urlActual =
    typeof window !== 'undefined'
      ? `${window.location.origin}${pathname}?modulo=${moduloActivo}`
      : `http://localhost:3000${pathname}?modulo=${moduloActivo}`;

  const ComponenteActivo = contenidoModulos[moduloActivo] || (() => <div>Módulo no encontrado</div>);

  return (
    <div className="flex h-screen fondo-login">
      <div className="circle circle1"></div>
      <div className="circle circle2"></div>
      <div className="circle circle3"></div>
      <div className="circle circle4"></div>
      <div className="circle circle5"></div>

      {/* Sidebar */}
      <aside className="bg-gray-100 w-72 text-black pl-6 py-6 flex flex-col">
        <h2 className="text-3xl font-bold mb-8 text-center bg-opacity-10 rounded-xl py-3">
          Dashboard
        </h2>

        <nav className="flex-1 flex flex-col space-y-4">
          {Object.keys(contenidoModulos).map((mod) => (
            <button
              key={mod}
              onClick={() => cambiarModulo(mod)}
              className={`link-nav flex items-center p-4 text-lg font-semibold rounded-xl
                text-white hover:bg-white hover:bg-opacity-20 hover:text-teal-900
                hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white
                ${moduloActivo === mod ? 'bg-white bg-opacity-30 scale-105 ring-2 ring-white text-teal-900' : ''}
              `}
            >
              <span className="mr-3 text-2xl">
                {mod === 'dashboard' ? (
                  <i className="bi bi-house-door-fill" />
                ) : mod === 'registros' ? (
                  <i className="bi bi-door-open" />
                ) : mod === 'horarios' ? (
                  <i className="bi bi-clock-history" />
                ) : mod === 'qr' ? (
                  <i className="bi bi-qr-code-scan" />
                ) : mod === 'administrar' ? (
                  <i className="bi bi-box-arrow-right" />
                ) : mod === 'datos' ? (
                  <i className="bi bi-person-circle" />
                ) : mod === 'filtros' ? (
                  <i className="bi bi-funnel-fill" />
                ) : (
                  ''
                )}
              </span>

              {/* Nombre con mayúscula inicial */}
              {mod.charAt(0).toUpperCase() + mod.slice(1)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div
        className="z-4 flex-1 flex flex-col p-6 overflow-hidden rounded-lg mr-6 my-6 
          border border-white/20 backdrop-blur-md shadow-lg"
      >
        <header className="rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Panel de Control - Módulo: {moduloActivo}
          </h1>

          <div className="text-sm text-gray-600 bg-teal-50 p-3 rounded-lg w-full sm:w-auto">
            <span className="font-medium">URL Actual:</span> {urlActual}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Modulo
            key={moduloActivo}
            nombre={moduloActivo.charAt(0).toUpperCase() + moduloActivo.slice(1)}
            Contenido={ComponenteActivo}
            urlActual={urlActual}
          />
        </div>
      </div>
    </div>
  );
};

export default Panel;
