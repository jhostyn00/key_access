'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FiHome, FiEdit3, FiLogIn, FiCode, FiUsers } from 'react-icons/fi';
import Hstorial from '@/app/components/Historial'; // Asegúrate de que el componente Hstorial esté bien importado
import MiQR from '@/app/components/MiQR';
import Horarios from '@/app/components/Horarios';
import RegistrarAcceso from '@/app/components/RegistrarAcceso';



const Módulo = ({ nombre, contenido, urlActual }) => {
  return (
    <div className="modulo bg-white rounded-2xl shadow-2xl p-8 border border-teal-200">
      <h3 className="text-3xl font-bold text-teal-800 mb-4 flex items-center">
        <span className="mr-3">{nombre}</span>
      </h3>
      <div className="text-xl text-gray-700 leading-relaxed mb-6">{contenido}</div>
      <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
        <p className="text-sm font-medium text-teal-900 mb-1">URL Actual para este Módulo:</p>
        <code className="text-teal-700 bg-white px-2 py-1 rounded text-sm font-mono break-all">
          {urlActual}
        </code>
      </div>
    </div>
  );
};

const Panel = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const moduloFromUrl = searchParams.get('modulo');

  const [moduloActivo, setModuloActivo] = useState(moduloFromUrl || 'dashboard');

  const contenidoModulos = {
    dashboard: <div>Contenido del Dashboard: Vista general con métricas, gráficos y resúmenes rápidos.</div>,
    editar: <div>Contenido del Editor: Herramientas interactivas para modificar datos, perfiles y configuraciones en tiempo real.</div>,
    login: <div>Contenido de Login: Formulario seguro con validación y opciones de autenticación.</div>,
    qr: <div>Contenido de QR: Generador y escáner de códigos QR para accesos y pagos.</div>,
    acceso: <div>Contenido de Acceso: Gestión de usuarios, roles y logs de actividad.</div>,
  };

  const cambiarModulo = (modulo) => {
    setModuloActivo(modulo);
    router.push(`/?modulo=${modulo}`);
  };

  useEffect(() => {
    if (moduloFromUrl && moduloFromUrl !== moduloActivo) {
      setModuloActivo(moduloFromUrl);
    }
  }, [moduloFromUrl, moduloActivo]);

  const getUrlActual = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${pathname}?modulo=${moduloActivo}`;
    } else {
      return `http://localhost:3000${pathname}?modulo=${moduloActivo}`;
    }
  };

  const urlActual = getUrlActual();

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50">
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <header className="bg-white rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control - Módulo: {moduloActivo}</h1>
          <div className="text-sm text-gray-600 bg-teal-50 p-3 rounded-lg w-full sm:w-auto">
            <span className="font-medium">URL Actual:</span> {urlActual}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Módulo 
            nombre={moduloActivo.charAt(0).toUpperCase() + moduloActivo.slice(1)} 
            contenido={contenidoModulos[moduloActivo]} 
            urlActual={urlActual} 
          />
        </div>
      </div>

      <Hstorial /> 
      <MiQR />
      <Horarios />
      <RegistrarAcceso/>

      <div className="w-72 bg-gradient-to-b from-teal-600 to-cyan-500 text-white p-6 shadow-2xl flex flex-col">
        <h2 className="text-3xl font-bold mb-8 text-center bg-white bg-opacity-10 rounded-xl py-3">Panel Único</h2>
        <div className="flex-1 flex flex-col space-y-4">
          {['dashboard', 'editar', 'login', 'qr', 'acceso'].map((modulo) => (
            <button
              key={modulo}
              onClick={() => cambiarModulo(modulo)}
              className={`flex items-center p-4 text-lg font-semibold rounded-xl hover:bg-white hover:bg-opacity-20 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white ${moduloActivo === modulo ? 'bg-white bg-opacity-30 scale-105 ring-2 ring-white' : ''}`}
            >
              {modulo === 'dashboard' && <FiHome className="mr-3 text-2xl" />}
              {modulo === 'editar' && <FiEdit3 className="mr-3 text-2xl" />}
              {modulo === 'login' && <FiLogIn className="mr-3 text-2xl" />}
              {modulo === 'qr' && <FiCode className="mr-3 text-2xl" />}
              {modulo === 'acceso' && <FiUsers className="mr-3 text-2xl" />}
              {modulo.charAt(0).toUpperCase() + modulo.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Panel;
