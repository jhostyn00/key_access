'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import Dashboard from '@/app/components/InicioDashboard';
import Registros from '@/app/components/Historial';
import Horarios from '@/app/components/Horarios';
import QR from '@/app/components/MiQR';
import Administrar from '@/app/components/Principal';
import DatosUsuario from '@/app/components/DatosUsuario';
import Filtros from '@/app/components/Filtros';

const Modulo = ({ nombre, Contenido, urlActual }) => (
  <div className="glass-card" style={{ padding: '1rem' }}>
    <h3 style={{
      color: 'var(--text-primary-contrast)',
      fontSize: '1.75rem',
      fontWeight: 'bold',
      marginBottom: '1rem'
    }}>{nombre}</h3>
    <div style={{ color: 'var(--text-secondary-contrast)', marginBottom: '1.5rem' }}>
      <Contenido />
    </div>
    <div style={{
      backgroundColor: 'var(--bg-glass)',
      padding: '1rem',
      borderLeft: `4px solid var(--color-accent-green)`,
      borderRadius: 'var(--radius-md)'
    }}>
      <p style={{ color: 'var(--text-primary-contrast)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
        URL Actual:
      </p>
      <code style={{
        color: 'var(--text-secondary-contrast)',
        backgroundColor: 'var(--bg-glass-light)',
        padding: '0.25rem 0.5rem',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'monospace',
        wordBreak: 'break-all',
        fontSize: '0.875rem'
      }}>
        {urlActual}
      </code>
    </div>
  </div>
);

const Panel = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Leer el módulo desde los parámetros de la URL o establecer el módulo predeterminado
  const moduloFromUrl = searchParams.get('modulo') || 'dashboard';
  const [moduloActivo, setModuloActivo] = useState(moduloFromUrl);

  // Definir los módulos disponibles y su contenido
  const contenidoModulos = {
    dashboard: Dashboard,
    registros: Registros,
    horarios: Horarios,
    qr: QR,
    administrar: Administrar,
    datos: DatosUsuario,
    filtros: Filtros,
  };

  // Cambiar el módulo activo cuando se hace clic en un módulo
  const cambiarModulo = (modulo) => {
    setModuloActivo(modulo);
    router.replace(`/panel?modulo=${modulo}`, undefined, { shallow: true });
  };

  // Actualizar el módulo activo si cambia en la URL
  useEffect(() => {
    if (moduloFromUrl !== moduloActivo) {
      setModuloActivo(moduloFromUrl);
    }
  }, [moduloFromUrl]);

  // Construir la URL actual para mostrarla
  const urlActual =
    typeof window !== 'undefined'
      ? `${window.location.origin}${pathname}?modulo=${moduloActivo}`
      : `http://localhost:3000${pathname}?modulo=${moduloActivo}`;

  // Seleccionar el componente activo basado en el módulo
  const ComponenteActivo = contenidoModulos[moduloActivo] || (() => <div style={{ color: 'var(--text-primary-contrast)' }}>Módulo no encontrado</div>);

  // Estado para almacenar el usuario y verificar su existencia
  const [usuario, setUsuario] = useState(null);

  // Usar useEffect para obtener el usuario de localStorage y manejar la redirección
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = JSON.parse(localStorage.getItem('usuario'));
      setUsuario(storedUser);

      if (!storedUser) {
        router.push('/login'); // Redirigir al login si no se encuentra el usuario
      }
    }
  }, [router]);

  // Mientras se obtiene el usuario, mostrar un "Loading..." o el contenido de la página
  if (!usuario) {
    return <p>Loading...</p>; // Este mensaje solo se mostrará si no hay usuario en localStorage
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      position: 'relative',
      background: 'var(--gradient-primary)',
      overflow: 'hidden'
    }}>

      {/* Círculos flotantes */}
      <div style={{
        position: 'absolute',
        width: '18rem',
        height: '18rem',
        backgroundColor: 'rgba(108,92,231,0.2)',
        borderRadius: '9999px',
        top: '-5rem',
        left: '-5rem',
        animation: 'pulse 6s infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        width: '24rem',
        height: '24rem',
        backgroundColor: 'rgba(199,182,226,0.2)',
        borderRadius: '9999px',
        bottom: '-10rem',
        right: '-10rem',
        animation: 'pulse 8s infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        width: '15rem',
        height: '15rem',
        backgroundColor: 'rgba(183,228,199,0.15)',
        borderRadius: '9999px',
        top: '50%',
        left: '33%',
        animation: 'spin 40s linear infinite'
      }}></div>

      {/* Sidebar */}
      <aside style={{
        width: '18rem',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        zIndex: 10
      }} className="glass-card">
        <h2 style={{
          textAlign: 'center',
          fontSize: '1.75rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          color: 'var(--text-primary-contrast)'
        }}>Dashboard</h2>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          {Object.keys(contenidoModulos).map((mod) => (
            <button
              key={mod}
              onClick={() => cambiarModulo(mod)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.3s',
                color: moduloActivo === mod ? 'var(--text-primary-contrast)' : 'var(--text-secondary-contrast)',
                backgroundColor: 'var(--bg-glass)',
                border: moduloActivo === mod ? `2px solid var(--color-accent-indigo)` : `1px solid var(--border-glass)`,
                transform: moduloActivo === mod ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <span style={{ marginRight: '0.75rem', fontSize: '1.5rem' }}>
                {mod === 'dashboard' ? '🏠' :
                 mod === 'registros' ? '🚪' :
                 mod === 'horarios' ? '⏰' :
                 mod === 'qr' ? '📱' :
                 mod === 'administrar' ? '📦' :
                 mod === 'datos' ? '👤' :
                 mod === 'filtros' ? '🔽' : '' }
              </span>
              {mod.charAt(0).toUpperCase() + mod.slice(1)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        overflow: 'hidden',
        margin: '1.5rem',
        borderRadius: 'var(--radius-lg)'
      }} className="glass-card">
        <header style={{
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          justifyContent: 'space-between'
        }} className="glass-card">
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--text-primary-contrast)'
          }}>
            Panel de Control - Módulo: {moduloActivo}
          </h1>

          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary-contrast)',
            backgroundColor: 'var(--bg-glass-light)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)'
          }}>
            <span style={{ fontWeight: 500 }}>URL Actual:</span> {urlActual}
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
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
