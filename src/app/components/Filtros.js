'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function AccesosPanel({ fechaSeleccionada }) {
  const [accesos, setAccesos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [editandoPersona, setEditandoPersona] = useState(null);
  const [formData, setFormData] = useState({ rol: '' });
  const [personaParaBaja, setPersonaParaBaja] = useState(null);
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  // 🔧 TRAER USUARIO LOGUEADO
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    setUsuarioLogueado(usuario);
  }, []);

  // 🔧 Asegurarse de que fechaSeleccionada esté definido
  const fechaFinal = fechaSeleccionada || new Date().toISOString().split('T')[0];  // Si no hay fechaSeleccionada, usar la fecha actual.
  
  // Asegurarnos de que `fechaSeleccionada` esté en el formato correcto 'YYYY-MM-DD'
  const fechaFormateada = fechaFinal.split('T')[0]; // Extraemos la parte 'YYYY-MM-DD' de la fecha.

  // 🔧 FETCH ACCESOS (Filtrando por usuario logueado)
  useEffect(() => {
    if (!usuarioLogueado) return;  // Si no hay usuario logueado, no hacer la consulta

    const fetchAccesos = async () => {
      try {
        const { data: accesosDia, error } = await supabase
          .from('acceso')
          .select(`
            id_acceso,
            id_persona,
            fecha_hora,
            tipo_movimiento,
            persona:id_persona (nombre, apellido, rol, tipo_persona, dni)
          `)
          .gte('fecha_hora', `${fechaFormateada}T00:00:00`)  // Usar fechaFormateada que es un valor válido
          .lte('fecha_hora', `${fechaFormateada}T23:59:59`)  // Usar fechaFormateada que es un valor válido
          .eq('id_persona', usuarioLogueado.id_persona)  // Filtrar accesos por el id_persona del usuario logueado
          .order('fecha_hora', { ascending: false });

        if (error) throw error;

        setAccesos(accesosDia || []);
      } catch (error) {
        console.error('Error obteniendo accesos:', error.message);
      }
    };

    fetchAccesos();
  }, [fechaFormateada, usuarioLogueado]);

  const rolTexto = (rol) => {
    switch (rol) {
      case 1: return 'Propietario';
      case 2: return 'Trabajador';
      case 3: return 'Residente';
      case 4: return 'Visitante';
      case 5: return 'Proveedor';
      case 0: return 'Eliminado';
      default: return rol;
    }
  };

  // 🧱 Editar rol
  const handleEdit = (persona) => {
    setEditandoPersona(persona);
    setFormData({ rol: persona.persona.rol.toString() });
  };

  const handleGuardarEdicion = async () => {
    try {
      const { error } = await supabase
        .from('persona')
        .update({ rol: Number(formData.rol) })
        .eq('id_persona', editandoPersona.id_persona);

      if (error) throw error;
      setEditandoPersona(null);
      setFormData({ rol: '' });
      // Actualizar tabla localmente
      setAccesos((prev) =>
        prev.map((a) =>
          a.id_persona === editandoPersona.id_persona
            ? { ...a, persona: { ...a.persona, rol: Number(formData.rol) } }
            : a
        )
      );
    } catch (error) {
      console.error('Error al actualizar persona:', error.message);
    }
  };

  // 🧱 Dar de baja
  const handleConfirmarBaja = (persona) => {
    setPersonaParaBaja(persona);
  };

  const handleDelete = async () => {
    if (!personaParaBaja) return;
    try {
      const { error } = await supabase
        .from('persona')
        .update({ rol: 0 })
        .eq('id_persona', personaParaBaja.id_persona);

      if (error) throw error;
      setPersonaParaBaja(null);
      setAccesos((prev) =>
        prev.map((a) =>
          a.id_persona === personaParaBaja.id_persona
            ? { ...a, persona: { ...a.persona, rol: 0 } }
            : a
        )
      );
    } catch (error) {
      console.error('Error al dar de baja persona:', error.message);
    }
  };

  // 🧮 Filtro de búsqueda
  const accesosFiltrados = accesos.filter((a) => {
    const termino = busqueda.toLowerCase();
    const persona = a.persona;
    return (
      persona.nombre?.toLowerCase().includes(termino) ||
      persona.apellido?.toLowerCase().includes(termino) ||
      persona.dni?.toLowerCase().includes(termino) ||
      a.id_persona?.toString().includes(termino)
    );
  });

  // 📄 PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const accesosPaginados = accesosFiltrados.slice(indiceInicio, indiceFin);
  const totalPaginas = Math.ceil(accesosFiltrados.length / registrosPorPagina);
  const irAPagina = (num) => {
    if (num >= 1 && num <= totalPaginas) setPaginaActual(num);
  };

  // 📄 Exportar PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    const headers = [['ID', 'Nombre', 'Apellido', 'DNI', 'Tipo', 'Rol', 'Tipo Movimiento']];
    const data = accesosFiltrados.map((a) => [
      a.id_persona,
      a.persona.nombre,
      a.persona.apellido,
      a.persona.dni,
      a.persona.tipo_persona,
      rolTexto(a.persona.rol),
      a.tipo_movimiento,
    ]);

    doc.setFontSize(18);
    doc.setTextColor('#3F51B5');
    doc.text(`Accesos del ${fechaSeleccionada}`, 14, 15);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 25,
      styles: { fontSize: 9, cellPadding: 4, textColor: '#333' },
      headStyles: { fillColor: '#3F51B5', textColor: '#FFF', halign: 'center' },
      alternateRowStyles: { fillColor: '#f5f5f5' },
    });

    doc.save(`accesos_${fechaSeleccionada}.pdf`);
  };

  // 📊 Exportar Excel
  const exportarExcel = () => {
    const wsData = [
      ['ID', 'Nombre', 'Apellido', 'DNI', 'Tipo', 'Rol', 'Tipo Movimiento'],
      ...accesosFiltrados.map((a) => [
        a.id_persona,
        a.persona.nombre,
        a.persona.apellido,
        a.persona.dni,
        a.persona.tipo_persona,
        rolTexto(a.persona.rol),
        a.tipo_movimiento,
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const maxLengths = wsData[0].map((_, i) =>
      Math.max(...wsData.map((r) => (r[i] ? r[i].toString().length : 0)))
    );
    ws['!cols'] = maxLengths.map((len) => ({ width: Math.min(Math.max(len + 5, 15), 30) }));

    XLSX.utils.book_append_sheet(wb, ws, 'Accesos');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `accesos_${fechaSeleccionada}.xlsx`);
  };

  // ✅ Validar permisos: solo Trabajadores o Propietarios pueden editar o dar de baja
  const puedeEditar = usuarioLogueado?.rol === 1 || usuarioLogueado?.rol === 2;

  return (
    <div className="bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Accesos del {fechaSeleccionada}</h2>

      <div className="mb-4 flex gap-4">
        <button onClick={exportarPDF} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md">
          Descargar PDF
        </button>
        <button onClick={exportarExcel} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md">
          Descargar Excel
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Buscar por nombre, apellido, DNI o ID:
          </label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej. Juan, García, 12345678"
            className="w-72 px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
          />
        </div>
      </div>

      {/* TABLA */}
      <table className="min-w-full border-collapse border border-gray-600">
        <thead>
          <tr className="bg-indigo-700">
            <th className="px-4 py-2">ID Persona</th>
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2">Apellido</th>
            <th className="px-4 py-2">DNI</th>
            <th className="px-4 py-2">Tipo Persona</th>
            <th className="px-4 py-2">Rol</th>
            <th className="px-4 py-2">Tipo Movimiento</th>
            <th className="px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {accesosPaginados.length > 0 ? (
            accesosPaginados.map((a) => (
              <tr key={a.id_acceso} className="hover:bg-gray-800">
                <td className="px-4 py-2">{a.id_persona}</td>
                <td className="px-4 py-2">{a.persona.nombre}</td>
                <td className="px-4 py-2">{a.persona.apellido}</td>
                <td className="px-4 py-2">{a.persona.dni}</td>
                <td className="px-4 py-2">{a.persona.tipo_persona}</td>
                <td className="px-4 py-2">{rolTexto(a.persona.rol)}</td>
                <td className="px-4 py-2">{a.tipo_movimiento}</td>
                <td className="px-4 py-2">
                  {a.persona.rol !== 0 ? (
                    puedeEditar ? (
                      <>
                        <button
                          onClick={() => handleEdit(a)}
                          className="bg-yellow-500 text-white py-1 px-3 rounded-md hover:bg-yellow-600 mr-2"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleConfirmarBaja(a)}
                          className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                        >
                          Dar de baja
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-300 italic">Sin permisos</span>
                    )
                  ) : (
                    <span className="text-gray-400 italic">Dado de baja</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="px-4 py-2 text-center text-gray-400 italic">
                No se encontraron registros.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* PAGINACIÓN */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            onClick={() => irAPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            className={`px-3 py-1 rounded-md ${
              paginaActual === 1
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            Anterior
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => irAPagina(num)}
              className={`px-3 py-1 rounded-md ${
                num === paginaActual
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => irAPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className={`px-3 py-1 rounded-md ${
              paginaActual === totalPaginas
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* MODAL EDITAR */}
      {editandoPersona && puedeEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-md shadow-md w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Editar Rol</h3>
            <label className="block text-sm font-medium text-gray-300 mb-1">Rol</label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ rol: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value="1">Propietario</option>
              <option value="2">Trabajador</option>
              <option value="3">Residente</option>
              <option value="4">Visitante</option>
              <option value="5">Proveedor</option>
            </select>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setEditandoPersona(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEdicion}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR BAJA */}
      {personaParaBaja && puedeEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-md shadow-md w-full max-w-md text-white">
            <h3 className="text-xl font-semibold mb-4">Confirmar baja</h3>
            <p className="mb-4">
              ¿Estás seguro que quieres dar de baja a{' '}
              <strong>
                {personaParaBaja.persona.nombre} {personaParaBaja.persona.apellido}
              </strong>
              ?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setPersonaParaBaja(null)}
                className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-md"
              >
                No
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
              >
                Sí, dar de baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
