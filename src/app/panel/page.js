'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import Horarios from '@/app/components/Horarios';
import QR from '@/app/components/MiQR';
import Administrar from '@/app/components/Principal';
import DatosUsuario from '@/app/components/DatosUsuario';  
import Filtros from '@/app/components/Filtros';

const Modulo = ({ nombre, Contenido, urlActual }) => (
  <div className="glass-card" style={{
    padding: '2rem',
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    height: '100%',
  }}>
    <h3 style={{
      color: '#000',
      fontSize: '1.75rem',
      fontWeight: 'bold',
      marginBottom: '1rem'
    }}>Hola, somos Key Access</h3>
    <div style={{
      color: '#333',
      marginBottom: '1.5rem'
    }}>
      <Contenido />
    </div>
  </div>
);

const Panel = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const moduloFromUrl = searchParams.get('modulo') || 'datos';
  const [moduloActivo, setModuloActivo] = useState(moduloFromUrl);

  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = JSON.parse(localStorage.getItem('usuario'));
      setUsuario(storedUser);

      if (!storedUser) {
        router.push('/login');
      }
    }
  }, [router]);

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem('usuario'));
    if (datosUsuario) {
      setUsuario(datosUsuario);
    }
  }, []);

  if (!usuario) {
    return <p>Loading...</p>;
  }

  const contenidoModulos = {
    datos: DatosUsuario,
    qr: QR,
    administrar: Administrar,
    filtros: Filtros,
    ...(usuario.tipo_persona !== 'visitante' && { horarios: Horarios }),
  };

  const cambiarModulo = (modulo) => {
    setModuloActivo(modulo);
    router.replace(`/panel?modulo=${modulo}`, undefined, { shallow: true });
  };

  const urlActual =
    typeof window !== 'undefined'
      ? `${window.location.origin}${pathname}?modulo=${moduloActivo}`
      : `http://localhost:3000${pathname}?modulo=${moduloActivo}`;

  const ComponenteActivo = contenidoModulos[moduloActivo] || (() => <div style={{ color: '#000' }}>Módulo no encontrado</div>);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      position: 'relative',
      backgroundColor: '#fff',
      overflow: 'hidden',
      color: '#000'
    }}>

      {/* Sidebar */}
      <aside className="aside-panel">
        
        <nav className='nav-panel'>
          {Object.keys(contenidoModulos).map((mod) => (
            <div 
              key={mod} 
              onClick={() => cambiarModulo(mod)}
              className="div-nav-panel"
            >
              <span>
                {mod === 'datos' ? '🏠' :
                 mod === 'horarios' ? '⏰' :
                 mod === 'qr' ? '📱' :
                 mod === 'administrar' ? '📦' :
                 mod === 'filtros' ? '🔽' : ''}
              </span>

              {/* Texto que aparece al hacer hover */}
              <span className="texto-hover">
                {mod === 'datos' ? 'Inicio' :
                 mod === 'horarios' ? 'Horarios' :
                 mod === 'qr' ? 'QR' :
                 mod === 'administrar' ? 'Administrar' :
                 mod === 'filtros' ? 'Filtros' : ''}
              </span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem',
        overflow: 'hidden',
        margin: '1.5rem',
        borderRadius: '10px',
        backgroundColor: '#f5f5f5',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
      }} className="glass-card">
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Modulo
            key={moduloActivo}
            nombre={moduloActivo === 'datos' ? 'Dashboard' : moduloActivo.charAt(0).toUpperCase() + moduloActivo.slice(1)}
            Contenido={ComponenteActivo}
            urlActual={urlActual}
          />
        </div>
      </div>
    </div>
  );
};

export default Panel;
