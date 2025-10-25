'use client';



import React, { useState, useEffect } from 'react';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';



// Importa aquí los componentes reales de tus módulos

import Dashboard from '@/app/components/HeaderDashboard';

import Registros from '@/app/components/Historial';

import Horarios from '@/app/components/Horarios';

import QR from '@/app/components/MiQR';

import Acceso from '@/app/components/RegistrarAcceso';



const Modulo = ({ nombre, Contenido, urlActual }) => (

 <div className="modulo bg-white rounded-2xl shadow-2xl p-8 border border-teal-200">

  <h3 className="text-3xl font-bold text-teal-800 mb-4 flex items-center">

   <span className="mr-3">{nombre}</span>

  </h3>

  <div className="text-xl text-gray-700 leading-relaxed mb-6">

   {/* Renderizamos el componente pasado */}

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



 // Aquí asignamos los módulos importados

 const contenidoModulos = {

  dashboard: Dashboard,

  registros: Registros,

  horarios: Horarios,

  qr: QR,

  acceso: Acceso,

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



 const urlActual = typeof window !== 'undefined'

  ? `${window.location.origin}${pathname}?modulo=${moduloActivo}`

  : `http://localhost:3000${pathname}?modulo=${moduloActivo}`;



 // Componente activo basado en el módulo

 const ComponenteActivo = contenidoModulos[moduloActivo] || (() => <div>Módulo no encontrado</div>);



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

     <Modulo

      key={moduloActivo}

      nombre={moduloActivo.charAt(0).toUpperCase() + moduloActivo.slice(1)}

      Contenido={ComponenteActivo}

      urlActual={urlActual}

     />

    </div>

   </div>

   <aside className="w-72 bg-gradient-to-b from-teal-600 to-cyan-500 text-black p-6 shadow-2xl flex flex-col">

    <h2 className="text-3xl font-bold mb-8 text-center bg-white bg-opacity-10 rounded-xl py-3">Panel Único</h2>

    <nav className="flex-1 flex flex-col space-y-4">

     {Object.keys(contenidoModulos).map((mod) => (

      <button

       key={mod}

       onClick={() => cambiarModulo(mod)}

       className={`flex items-center p-4 text-lg font-semibold rounded-xl

        text-white

        hover:bg-white hover:bg-opacity-20 hover:text-teal-900

        hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white

        ${moduloActivo === mod ? 'bg-white bg-opacity-30 scale-105 ring-2 ring-white text-teal-900' : ''}

       `}

      >

       <span className="mr-3 text-2xl">

        {mod === 'dashboard' ? <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-house-door-fill" viewBox="0 0 16 16">
  <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5"/>
</svg> :

         mod === 'registros' ? <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-door-open" viewBox="0 0 16 16">
  <path d="M8.5 10c-.276 0-.5-.448-.5-1s.224-1 .5-1 .5.448.5 1-.224 1-.5 1"/>
  <path d="M10.828.122A.5.5 0 0 1 11 .5V1h.5A1.5 1.5 0 0 1 13 2.5V15h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V1.5a.5.5 0 0 1 .43-.495l7-1a.5.5 0 0 1 .398.117M11.5 2H11v13h1V2.5a.5.5 0 0 0-.5-.5M4 1.934V15h6V1.077z"/>
</svg> :

         mod === 'horarios' ? <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-clock-history" viewBox="0 0 16 16">
  <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
  <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
  <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
</svg> :

         mod === 'qr' ? <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-qr-code-scan" viewBox="0 0 16 16">
  <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5M.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5M4 4h1v1H4z"/>
  <path d="M7 2H2v5h5zM3 3h3v3H3zm2 8H4v1h1z"/>
  <path d="M7 9H2v5h5zm-4 1h3v3H3zm8-6h1v1h-1z"/>
  <path d="M9 2h5v5H9zm1 1v3h3V3zM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8zm2 2H9V9h1zm4 2h-1v1h-2v1h3zm-4 2v-1H8v1z"/>
  <path d="M12 9h2V8h-2z"/>
</svg> :

         mod === 'acceso' ? <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-box-arrow-right" viewBox="0 0 16 16">
  <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
  <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
</svg> : ''}

       </span>

       {mod.charAt(0).toUpperCase() + mod.slice(1)}

      </button>

     ))}

    </nav>

   </aside>

  </div>

 );

};



export default Panel;