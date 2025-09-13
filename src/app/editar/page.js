"use client";
import { useState } from "react";

export default function ResidentesTable() {
  const [residentes, setResidentes] = useState([
    { id: 1, nombre: "Ana López", edad: 32, departamento: "301" },
    { id: 2, nombre: "Carlos Pérez", edad: 45, departamento: "502" },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [residenteEdit, setResidenteEdit] = useState(null);

  const abrirModal = (residente) => {
    setResidenteEdit(residente);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setResidenteEdit(null);
    setModalOpen(false);
  };

  const guardarCambios = (e) => {
    e.preventDefault();
    setResidentes((prev) =>
      prev.map((r) =>
        r.id === residenteEdit.id ? residenteEdit : r
      )
    );
    cerrarModal();
  };

  const eliminarResidente = (id) => {
    if (confirm(`¿Seguro que deseas eliminar al residente con ID ${id}?`)) {
      setResidentes((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Gestión de Residentes
      </h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-teal-700 text-white">
            <th className="p-3 text-left">ID</th>
            <th className="p-3 text-left">Nombre</th>
            <th className="p-3 text-left">Edad</th>
            <th className="p-3 text-left">Departamento</th>
            <th className="p-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {residentes.map((r, i) => (
            <tr key={r.id} className={i % 2 === 0 ? "bg-gray-500" : "bg-gray-500"}>
              <td className="p-3">{r.id}</td>
              <td className="p-3">{r.nombre}</td>
              <td className="p-3">{r.edad}</td>
              <td className="p-3">{r.departamento}</td>
              <td className="p-3 flex gap-2">
                <button
                  onClick={() => abrirModal(r)}
                  className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminarResidente(r.id)}
                  className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-black">
              Editar Residente
            </h3>
            <form onSubmit={guardarCambios} className="space-y-3 text-black bg-white">
              <input
                type="text"
                value={residenteEdit.nombre}
                onChange={(e) =>
                  setResidenteEdit({ ...residenteEdit, nombre: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
                placeholder="Nombre completo"
              />
              <input
                type="number"
                value={residenteEdit.edad}
                onChange={(e) =>
                  setResidenteEdit({
                    ...residenteEdit,
                    edad: parseInt(e.target.value),
                  })
                }
                className="w-full p-2 border rounded-lg"
                placeholder="Edad"
              />
              <input
                type="text"
                value={residenteEdit.departamento}
                onChange={(e) =>
                  setResidenteEdit({
                    ...residenteEdit,
                    departamento: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
                placeholder="Departamento"
              />
              <button
                type="submit"
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={cerrarModal}
                className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
