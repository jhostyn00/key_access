'use client';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import HeaderDashboard from '@/app/components/HeaderDashboard';

export default function DashboardPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    tipo_persona: '',
    id_departamento: '',
    id_edificio: '',
    cargo: '',
    turno: '',
    motivo_visita: '',
    id_residente_visitado: '',
    empresa: '',
    descripcion_producto: '',
  });

  const [departamentos, setDepartamentos] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [residentes, setResidentes] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: departamentos } = await supabase
        .from('departamento')
        .select('id_departamento, numero, edificio(nombre_edificio)');
      setDepartamentos(departamentos || []);

      const { data: edificios } = await supabase.from('edificio').select();
      setEdificios(edificios || []);

      const { data: residentes } = await supabase
        .from('residente')
        .select('id_residente, persona(nombre, apellido)');
      setResidentes(residentes || []);
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const uidGenerado = formData.tipo_persona.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    // 1. Insertar en persona
    const { data: personaData, error: personaError } = await supabase
      .from('persona')
      .insert({
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        tipo_persona: formData.tipo_persona,
        uid_tarjeta: uidGenerado
      })
      .select()
      .single();

    if (personaError) {
      setMessage('Error al registrar persona');
      return;
    }

    const id_persona = personaData.id_persona;

    // 2. Insertar en tabla específica
    let errorEspecifico = null;

    switch (formData.tipo_persona) {
      case 'residente':
        ({ error: errorEspecifico } = await supabase.from('residente').insert({
          id_residente: id_persona,
          id_departamento: parseInt(formData.id_departamento),
          telefono: formData.telefono
        }));
        break;

      case 'propietario':
        ({ error: errorEspecifico } = await supabase.from('propietario').insert({
          id_propietario: id_persona,
          id_edificio: parseInt(formData.id_edificio),
          telefono: formData.telefono
        }));
        break;

      case 'trabajador':
        ({ error: errorEspecifico } = await supabase.from('trabajador').insert({
          id_trabajador: id_persona,
          cargo: formData.cargo,
          turno: formData.turno
        }));
        break;

      case 'visitante':
        ({ error: errorEspecifico } = await supabase.from('visitante').insert({
          id_visitante: id_persona,
          motivo_visita: formData.motivo_visita,
          id_residente_visitado: parseInt(formData.id_residente_visitado)
        }));
        break;

      case 'proveedor':
        ({ error: errorEspecifico } = await supabase.from('proveedor').insert({
          id_proveedor: id_persona,
          empresa: formData.empresa,
          descripcion_producto: formData.descripcion_producto,
          id_residente_destino: parseInt(formData.id_residente_visitado)
        }));
        break;
    }

    if (errorEspecifico) {
      console.error('Error tabla específica:', errorEspecifico);
      setMessage('Persona creada, pero error en tabla específica');
      return;
    }

    setMessage('✅ Registro exitoso');

    setFormData({
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      tipo_persona: '',
      id_departamento: '',
      id_edificio: '',
      cargo: '',
      turno: '',
      motivo_visita: '',
      id_residente_visitado: '',
      empresa: '',
      descripcion_producto: '',
    });
  };

  return (
    <main className="bg-gradient-to-b from-gray-100 to-gray-500 min-h-screen">
      <HeaderDashboard />
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-lg mt-10">
        <h1 className="text-center text-3xl font-bold text-gray-800">Registrar Persona</h1>
        {message && <p className="text-center mt-4 font-semibold text-green-600">{message}</p>}

        <div className="mt-6 flex flex-col gap-4">
          <label className="text-gray-700">Nombre</label>
          <input id="nombre" value={formData.nombre} onChange={handleChange} required className="border-2 p-2 rounded text-black" />

          <label className="text-gray-700">Apellido</label>
          <input id="apellido" value={formData.apellido} onChange={handleChange} required className="border-2 p-2 rounded text-black" />

          <label className="text-gray-700">DNI</label>
          <input id="dni" value={formData.dni} onChange={handleChange} required className="border-2 p-2 rounded text-black" />

          <label className="text-gray-700">Tipo de Persona</label>
          <select id="tipo_persona" value={formData.tipo_persona} onChange={handleChange} required className="border-2 p-2 rounded text-black">
            <option className='text-black' value="">Seleccionar...</option>
            <option className='text-black' value="residente">Residente</option>
            <option className='text-black' value="propietario">Propietario</option>
            <option className='text-black' value="trabajador">Trabajador</option>
            <option className='text-black' value="visitante">Visitante</option>
            <option className='text-black' value="proveedor">Proveedor</option>
          </select>

          {(formData.tipo_persona === 'residente' || formData.tipo_persona === 'propietario') && (
            <>
              {formData.tipo_persona === 'residente' && (
                <>
                  <label className="text-gray-700">Departamento</label>
                  <select id="id_departamento" value={formData.id_departamento} onChange={handleChange} className="border-2 p-2 rounded text-black">
                    <option className='text-black' value="">Seleccionar...</option>
                    {departamentos.map(dep => (
                      <option className='text-black' key={dep.id_departamento} value={dep.id_departamento}>
                        {dep.edificio?.nombre_edificio} - {dep.numero}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label className="text-gray-700">Teléfono</label>
              <input id="telefono" value={formData.telefono} onChange={handleChange} className="border-2 p-2 rounded text-black" />
            </>
          )}

          {formData.tipo_persona === 'propietario' && (
            <>
              <label className="text-gray-700">Edificio</label>
              <select id="id_edificio" value={formData.id_edificio} onChange={handleChange} className="border-2 p-2 rounded text-black">
                <option className='text-black' value="">Seleccionar...</option>
                {edificios.map(ed => (
                  <option className='text-black' key={ed.id_edificio} value={ed.id_edificio}>
                    {ed.nombre_edificio}
                  </option>
                ))}
              </select>
            </>
          )}

          {formData.tipo_persona === 'trabajador' && (
            <>
              <label className="text-gray-700">Cargo</label>
              <input id="cargo" value={formData.cargo} onChange={handleChange} className="border-2 p-2 rounded text-black" />
              <label className="text-gray-700">Turno</label>
              <input id="turno" value={formData.turno} onChange={handleChange} className="border-2 p-2 rounded text-black" />
            </>
          )}

          {(formData.tipo_persona === 'visitante' || formData.tipo_persona === 'proveedor') && (
            <>
              <label className="text-gray-700">Residente destino</label>
              <select id="id_residente_visitado" value={formData.id_residente_visitado} onChange={handleChange} className="border-2 p-2 rounded text-black">
                <option className='text-black' value="">Seleccionar...</option>
                {residentes.map(r => (
                  <option className='text-black' key={r.id_residente} value={r.id_residente}>
                    {r.persona?.nombre} {r.persona?.apellido}
                  </option>
                ))}
              </select>
            </>
          )}

          {formData.tipo_persona === 'visitante' && (
            <>
              <label className="text-gray-700">Motivo de visita</label>
              <input id="motivo_visita" value={formData.motivo_visita} onChange={handleChange} className="border-2 p-2 rounded text-black" />
            </>
          )}

          {formData.tipo_persona === 'proveedor' && (
            <>
              <label className="text-gray-700">Empresa</label>
              <input id="empresa" value={formData.empresa} onChange={handleChange} className="border-2 p-2 rounded text-black" />
              <label className="text-gray-700">Descripción del producto</label>
              <input id="descripcion_producto" value={formData.descripcion_producto} onChange={handleChange} className="border-2 p-2 rounded text-black" />
            </>
          )}
        </div>

        <div className="mt-6">
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Registrar
          </button>
        </div>
      </form>
    </main>
  );
}
