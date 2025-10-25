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

const Modulo = ({ nombre, Contenido, urlActual }) => (
  <div className="modulo bg-white rounded-2xl shadow-2xl p-8 border border-teal-200">
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

export default function Panel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const moduloFromUrl = searchParams.get('modulo') || 'dashboard';
  const [moduloActivo, setModuloActivo] = useState(moduloFromUrl);

  const contenidoModulos = {
    dashboard: Dashboard,
    editar: Editar,
    login: Login,
    qr: QR,
    acceso: Acceso,
    inicio_dashboard: Inicio,
    personalint: PersonalInt,
  };

  const nombresBonitos = {
    dashboard: 'Dashboard',
    editar: 'Editar',
    login: 'Login',
    qr: 'QR',
    acceso: 'Acceso',
    inicio_dashboard: 'Inicio',
    personalint: 'Personal Interno',
  };

  const iconos = {
    dashboard: '🏠',
    editar: '✏️',
    login: '🔐',
    qr: '📱',
    acceso: '👥',
    inicio_dashboard: '🚀',
    personalint: '👤',
  };

  const cambiarModulo = (modulo) => {
    setModuloActivo(modulo);
    router.replace(`/panel?modulo=${modulo}`, undefined, { shallow: true });
  };

  useEffect(() => {
    if (moduloFromUrl !== moduloActivo) setModuloActivo(moduloFromUrl);
  }, [moduloFromUrl]);

  const urlActual =
    typeof window !== 'undefined'
      ? `${window.location.origin}${pathname}?modulo=${moduloActivo}`
      : `http://localhost:3000${pathname}?modulo=${moduloActivo}`;

  const ComponenteActivo =
    contenidoModulos[moduloActivo] || (() => <div>Módulo no encontrado</div>);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50">
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <header className="bg-white rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Panel de Control - {nombresBonitos[moduloActivo] || moduloActivo}
          </h1>
          <div className="text-sm text-gray-600 bg-teal-50 p-3 rounded-lg w-full sm:w-auto">
            <span className="font-medium">URL Actual:</span> {urlActual}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Modulo
            key={moduloActivo}
            nombre={nombresBonitos[moduloActivo] || moduloActivo}
            Contenido={ComponenteActivo}
            urlActual={urlActual}
          />
        </div>
      </div>

      <aside className="w-72 bg-gradient-to-b from-teal-600 to-cyan-500 text-white p-6 shadow-2xl flex flex-col">
        <h2 className="text-3xl font-bold mb-8 text-center bg-opacity-10 rounded-xl py-3">
          Panel Único
        </h2>
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
      </aside>
    </div>
  );
}
