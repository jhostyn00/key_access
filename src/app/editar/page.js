'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

export default function EditarPage() {
  const [personas, setPersonas] = useState([]);
  const [message, setMessage] = useState('');
  const [editingPersona, setEditingPersona] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', dni: '' });

  const fetchPersonas = async () => {
    const { data, error } = await supabase
      .from('persona')
      .select(`
        id_persona,
        nombre,
        apellido,
        dni,
        tipo_persona,
        uid_tarjeta,
        eliminado,
        residente (telefono, id_departamento),
        propietario (telefono, id_edificio),
        trabajador (cargo, turno),
        visitante (motivo_visita, id_residente_visitado),
        proveedor (empresa, descripcion_producto, id_residente_destino)
      `)
      .or('eliminado.eq.false,eliminado.is.null');

    if (error) {
      console.error('Error fetchPersonas:', JSON.stringify(error, null, 2));
      setMessage(`Error cargando personas: ${error.message || JSON.stringify(error)}`);
    } else {
      setPersonas(data);
      setMessage('');
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleEliminar = async (id_persona) => {
    const { error } = await supabase
      .from('persona')
      .update({ eliminado: true })
      .eq('id_persona', id_persona);

    if (error) {
      console.error('Error al eliminar persona:', JSON.stringify(error, null, 2));
      setMessage(`Error al eliminar persona: ${error.message || JSON.stringify(error)}`);
    } else {
      setMessage('Persona eliminada correctamente');
      fetchPersonas();
    }
  };

  const handleEditar = (persona) => {
    setEditingPersona(persona);
    setFormData({
      nombre: persona.nombre || '',
      apellido: persona.apellido || '',
      dni: persona.dni || '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGuardar = async () => {
    if (!editingPersona) return;

    const { error } = await supabase
      .from('persona')
      .update({
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
      })
      .eq('id_persona', editingPersona.id_persona);

    if (error) {
      console.error('Error al guardar persona:', JSON.stringify(error, null, 2));
      setMessage(`Error al guardar persona: ${error.message || JSON.stringify(error)}`);
    } else {
      setMessage('Persona actualizada correctamente');
      setEditingPersona(null);
      fetchPersonas();
    }
  };

  return (
    <main className="bg-gray-100 min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6 text-black">Editar / Eliminar Personas</h1>

      {message && (
        <p className="mb-4 text-center font-semibold text-red-600">{message}</p>
      )}

      {personas.length === 0 ? (
        <p className="text-black">No hay personas para mostrar.</p>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left text-black">Nombre</th>
              <th className="p-2 text-left text-black">Apellido</th>
              <th className="p-2 text-left text-black">DNI</th>
              <th className="p-2 text-left text-black">Tipo</th>
              <th className="p-2 text-left text-black">Detalles</th>
              <th className="p-2 text-left text-black">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {personas.map((p) => (
              <tr key={p.id_persona} className="border-b hover:bg-gray-50">
                <td className="p-2 text-black">{p.nombre}</td>
                <td className="p-2 text-black">{p.apellido}</td>
                <td className="p-2 text-black">{p.dni}</td>
                <td className="p-2 text-black capitalize">{p.tipo_persona}</td>
                <td className="p-2 text-sm text-gray-700">
                  {/* Mostrar detalles según tipo */}
                  {p.tipo_persona === 'residente' && (
                    <>
                      Teléfono: {p.residente?.telefono || '-'} <br />
                      Departamento ID: {p.residente?.id_departamento || '-'}
                    </>
                  )}
                  {p.tipo_persona === 'propietario' && (
                    <>
                      Teléfono: {p.propietario?.telefono || '-'} <br />
                      Edificio ID: {p.propietario?.id_edificio || '-'}
                    </>
                  )}
                  {p.tipo_persona === 'trabajador' && (
                    <>
                      Cargo: {p.trabajador?.cargo || '-'} <br />
                      Turno: {p.trabajador?.turno || '-'}
                    </>
                  )}
                  {p.tipo_persona === 'visitante' && (
                    <>
                      Motivo: {p.visitante?.motivo_visita || '-'} <br />
                      Residente visitado ID: {p.visitante?.id_residente_visitado || '-'}
                    </>
                  )}
                  {p.tipo_persona === 'proveedor' && (
                    <>
                      Empresa: {p.proveedor?.empresa || '-'} <br />
                      Producto: {p.proveedor?.descripcion_producto || '-'} <br />
                      Residente destino ID: {p.proveedor?.id_residente_destino || '-'}
                    </>
                  )}
                </td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => handleEditar(p)}
                    className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(p.id_persona)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal para editar */}
      {editingPersona && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded p-6 max-w-lg w-full text-black">
            <h2 className="text-xl font-bold mb-4">Editar Persona</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGuardar();
              }}
            >
              <label className="block mb-2">
                Nombre:
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-1 w-full"
                  required
                />
              </label>

              <label className="block mb-2">
                Apellido:
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-1 w-full"
                  required
                />
              </label>

              <label className="block mb-4">
                DNI:
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-1 w-full"
                  required
                />
              </label>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingPersona(null)}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
