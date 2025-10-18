'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function Accesos() {
  const [user, setUser] = useState({ id: '1234' });
  const [rol, setRol] = useState('trabajador');
  const [accesos, setAccesos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [editandoPersona, setEditandoPersona] = useState(null);
  const [formData, setFormData] = useState({
    rol: ''
  });

  const [personaParaBaja, setPersonaParaBaja] = useState(null);

  useEffect(() => {
    const fetchAccesos = async () => {
      let query = supabase.from('persona').select(`
        id_persona,
        nombre,
        apellido,
        dni,
        tipo_persona,
        rol
      `);

      if (filtro) {
        if (filtro === 'eliminado') {
          query = query.eq('rol', '0');
        } else {
          query = query.eq('rol', filtro);
        }
      } else {
        query = query.neq('rol', '0');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo accesos:', error);
        return;
      }

      setAccesos(data);
    };

    if (user) {
      fetchAccesos();
    }
  }, [user, filtro]);

  const handleEdit = (persona) => {
    setEditandoPersona(persona);
    setFormData({
      rol: persona.rol
    });
  };

  const handleGuardarEdicion = async () => {
    const { error } = await supabase
      .from('persona')
      .update({ rol: formData.rol })
      .eq('id_persona', editandoPersona.id_persona);

    if (error) {
      console.error('Error al actualizar persona:', error);
      return;
    }

    setEditandoPersona(null);
    setFormData({ rol: '' });
    setFiltro(filtro);
  };

  const handleConfirmarBaja = (persona) => {
    setPersonaParaBaja(persona);
  };

  const handleDelete = async () => {
    if (!personaParaBaja) return;

    const { error } = await supabase
      .from('persona')
      .update({ rol: '0' })
      .eq('id_persona', personaParaBaja.id_persona);

    if (error) {
      console.error('Error al dar de baja persona:', error);
      return;
    }

    setPersonaParaBaja(null);
    setFiltro(filtro);
  };

  const accesosFiltrados = accesos.filter((persona) => {
    const termino = busqueda.toLowerCase();
    return (
      persona.nombre.toLowerCase().includes(termino) ||
      persona.apellido.toLowerCase().includes(termino) ||
      persona.dni.toLowerCase().includes(termino) ||
      persona.id_persona.toString().includes(termino) // Habilitar búsqueda por ID
    );
  });

  const rolTexto = (rol) => {
    switch (rol) {
      case '1':
        return 'Propietario';
      case '2':
        return 'Trabajador';
      case '3':
        return 'Residente';
      case '0':
        return 'Eliminado';
      default:
        return rol;
    }
  };

  // Exportar PDF usando jsPDF y autotable con estilo mejorado
  const exportarPDF = () => {
    const doc = new jsPDF();

    const headers = [['ID Persona', 'Nombre', 'Apellido', 'DNI', 'Tipo Persona', 'Rol']];

    const data = accesosFiltrados.map(p => [
      p.id_persona,
      p.nombre,
      p.apellido,
      p.dni,
      p.tipo_persona,
      rolTexto(p.rol),
    ]);

    // Agregar título
    doc.setFontSize(18);
    doc.setTextColor('#3F51B5'); // azul
    doc.text('Listado de Accesos', 14, 15);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 25,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        fontStyle: 'normal',
        textColor: '#333',
        halign: 'left',
        valign: 'middle',
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: '#3F51B5',
        textColor: '#FFF',
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: '#f5f5f5',
      },
      margin: { left: 14, right: 14 },
      tableLineWidth: 0.15,
      tableLineColor: 200,
    });

    doc.save('accesos.pdf');
  };

  // Exportar Excel con estilos mejorados
  const exportarExcel = () => {
    const wsData = [
      ['ID Persona', 'Nombre', 'Apellido', 'DNI', 'Tipo Persona', 'Rol'],
      ...accesosFiltrados.map(p => [
        p.id_persona,
        p.nombre,
        p.apellido,
        p.dni,
        p.tipo_persona,
        rolTexto(p.rol),
      ])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Ajustar el ancho de las columnas
    const maxLengths = wsData[0].map((_, colIndex) => {
      return Math.max(...wsData.map(row => (row[colIndex] ? row[colIndex].toString().length : 0)));
    });
    ws['!cols'] = maxLengths.map(len => ({ width: Math.min(Math.max(len + 5, 15), 30) }));

    // Estilos de celdas para el encabezado
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        fill: { fgColor: { rgb: "3F51B5" } }, // Azul
        font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }

    // Aplicar color alternado en las filas de datos
    for (let R = 1; R <= range.e.r; ++R) {
      const fillColor = R % 2 === 0 ? "F2F2F2" : "FFFFFF"; // Color alternado
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        ws[cellAddress].s = {
          fill: { fgColor: { rgb: fillColor } },
          font: { color: { rgb: "000000" }, sz: 11 },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } },
          },
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Accesos');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });

    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'accesos.xlsx');
  };

  return (
    <div className="bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-4">Accesos (Rol simulado: {rol})</h2>

      {/* Botones PDF y Excel */}
      <div className="mb-4 flex gap-4">
        <button
          onClick={exportarPDF}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md"
        >
          Descargar PDF
        </button>
        <button
          onClick={exportarExcel}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md"
        >
          Descargar Excel
        </button>
      </div>

      {/* Filtros y tabla */}
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
            className="w-72 px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por rol:</label>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-48 px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white"
          >
            <option value="">Todos (sin eliminados)</option>
            <option value="1">Propietario</option>
            <option value="2">Trabajador</option>
            <option value="3">Residente</option>
            <option value="eliminado">Eliminados</option>
          </select>
        </div>
      </div>

      <table className="min-w-full border-collapse border border-gray-600">
        <thead>
          <tr className="bg-indigo-700">
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">ID Persona</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Nombre</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Apellido</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">DNI</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Tipo Persona</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Rol</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {accesosFiltrados.length > 0 ? (
            accesosFiltrados.map((persona) => (
              <tr key={persona.id_persona} className="hover:bg-gray-800">
                <td className="px-4 py-2 text-sm text-gray-200">{persona.id_persona}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.nombre}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.apellido}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.dni}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{persona.tipo_persona}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{rolTexto(persona.rol)}</td>
                <td className="px-4 py-2 text-sm text-gray-200">
                  {persona.rol !== '0' && (
                    <>
                      <button
                        onClick={() => handleEdit(persona)}
                        className="bg-yellow-500 text-white py-1 px-3 rounded-md hover:bg-yellow-600 mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleConfirmarBaja(persona)}
                        className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                      >
                        Dar de baja
                      </button>
                    </>
                  )}
                  {persona.rol === '0' && (
                    <span className="text-gray-400 italic">Dado de baja</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-4 py-2 text-sm text-gray-200 text-center">
                No se encontraron registros.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editandoPersona && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-md shadow-md w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-white">Editar Rol</h3>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">Rol</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ rol: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="1">Propietario</option>
                <option value="2">Trabajador</option>
                <option value="3">Residente</option>
              </select>
            </div>

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

      {personaParaBaja && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-md shadow-md w-full max-w-md text-white">
            <h3 className="text-xl font-semibold mb-4">Confirmar baja</h3>
            <p className="mb-4">
              ¿Estás seguro que quieres dar de baja a <strong>{personaParaBaja.nombre} {personaParaBaja.apellido}</strong>?
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

export default Accesos;
