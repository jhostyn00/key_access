'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import html2canvas from 'html2canvas';
import HeaderDashboard from '@/app/components/HeaderDashboard';

export default function DashboardPage() {
  const qrRef = useRef(null);

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
  const [uidGenerado, setUidGenerado] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  // ------------------ VALIDACIONES ------------------
  const validarDNI = (dni) => /^[0-9]{8}$/.test(dni);
  const validarTelefono = (telefono) =>
    /^9\d{8}$/.test(telefono) || /^[0-9]{7}$/.test(telefono);

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
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setQrUrl('');
    setUidGenerado('');

    if (!validarDNI(formData.dni)) {
      setMessage('❌ DNI inválido. Debe tener exactamente 8 dígitos.');
      return;
    }

    if (formData.telefono && !validarTelefono(formData.telefono)) {
      setMessage(
        '❌ Teléfono inválido. Debe tener 7 dígitos (fijo) o 9 dígitos empezando en 9 (celular).'
      );
      return;
    }

    // ---------------- GENERAR UID ----------------
    const uidBase =
      formData.tipo_persona.substring(0, 3).toUpperCase() +
      '-' +
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');

    const uidGeneradoValue = `https://tusitio.com/p/${uidBase}`;

    // ---------------- DATOS PARA EL QR ----------------
    const datosPersona = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      dni: formData.dni,
      telefono: formData.telefono,
      tipo_persona: formData.tipo_persona,
      uid: uidGeneradoValue,
    };

    const qrContent = JSON.stringify(datosPersona);
    setUidGenerado(qrContent);

    try {
      await new Promise((r) => setTimeout(r, 500));

      // Capturar QR como imagen usando html2canvas
      const canvas = await html2canvas(qrRef.current);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.95)
      );

      const file = new File([blob], `${formData.dni}_qr.jpg`, {
        type: 'image/jpeg',
      });

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('qrs')
        .upload(`qrs/${formData.dni}_qr.jpg`, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('qrs')
        .getPublicUrl(`qrs/${formData.dni}_qr.jpg`);

      const publicUrl = urlData.publicUrl;
      setQrUrl(publicUrl);

      // Insertar persona en la base
      const { data: personaData, error: personaError } = await supabase
        .from('persona')
        .insert({
          nombre: formData.nombre,
          apellido: formData.apellido,
          dni: formData.dni,
          tipo_persona: formData.tipo_persona,
          uid_tarjeta: uidGeneradoValue,
          qr_url: publicUrl,
          rol: 3,
        })
        .select()
        .single();

      if (personaError) {
        setMessage('Error al registrar persona');
        return;
      }

      const id_persona = personaData.id_persona;
      let errorEspecifico = null;

      // Insertar en tabla específica según tipo_persona
      switch (formData.tipo_persona) {
        case 'residente':
          ({ error: errorEspecifico } = await supabase.from('residente').insert({
            id_residente: id_persona,
            id_departamento: parseInt(formData.id_departamento),
            telefono: formData.telefono,
          }));
          break;

        case 'propietario':
          ({ error: errorEspecifico } = await supabase
            .from('propietario')
            .insert({
              id_propietario: id_persona,
              id_edificio: parseInt(formData.id_edificio),
              telefono: formData.telefono,
            }));
          break;

        case 'trabajador':
          ({ error: errorEspecifico } = await supabase
            .from('trabajador')
            .insert({
              id_trabajador: id_persona,
              cargo: formData.cargo,
              turno: formData.turno,
            }));
          break;

        case 'visitante':
          ({ error: errorEspecifico } = await supabase
            .from('visitante')
            .insert({
              id_visitante: id_persona,
              motivo_visita: formData.motivo_visita,
              id_residente_visitado: parseInt(formData.id_residente_visitado),
            }));
          break;

        case 'proveedor':
          ({ error: errorEspecifico } = await supabase
            .from('proveedor')
            .insert({
              id_proveedor: id_persona,
              empresa: formData.empresa,
              descripcion_producto: formData.descripcion_producto,
              id_residente_destino: parseInt(formData.id_residente_visitado),
            }));
          break;
      }

      if (errorEspecifico) {
        console.error('Error tabla específica:', errorEspecifico);
        setMessage('Persona creada, pero error en tabla específica');
        return;
      }

      setMessage('✅ Persona registrada con código QR con datos');
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
    } catch (error) {
      console.error(error);
      setMessage('❌ Error al subir QR o registrar persona');
    }
  };

  return (
    <main className="bg-gradient-to-b from-gray-100 to-gray-500 min-h-screen">
      <HeaderDashboard />
      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-lg mt-10"
      >
        <h1 className="text-center text-3xl font-bold text-gray-800">
          Registrar Persona
        </h1>
        {message && (
          <p className="text-center mt-4 font-semibold text-green-600">
            {message}
          </p>
        )}

        {/* ---- CAMPOS DEL FORMULARIO ---- */}
        <div className="mt-6 flex flex-col gap-4">
          <label className="text-gray-700">Nombre</label>
          <input
            id="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="border-2 p-2 rounded text-black"
          />

          <label className="text-gray-700">Apellido</label>
          <input
            id="apellido"
            value={formData.apellido}
            onChange={handleChange}
            required
            className="border-2 p-2 rounded text-black"
          />

          <label className="text-gray-700">DNI</label>
          <input
            id="dni"
            value={formData.dni}
            onChange={handleChange}
            required
            className="border-2 p-2 rounded text-black"
            maxLength={8}
            inputMode="numeric"
            pattern="[0-9]{8}"
          />

          <label className="text-gray-700">Tipo de Persona</label>
          <select
            id="tipo_persona"
            value={formData.tipo_persona}
            onChange={handleChange}
            required
            className="border-2 p-2 rounded text-black"
          >
            <option className="text-black" value="">
              Seleccionar...
            </option>
            <option className="text-black" value="residente">
              Residente
            </option>
            <option className="text-black" value="propietario">
              Propietario
            </option>
            <option className="text-black" value="trabajador">
              Trabajador
            </option>
            <option className="text-black" value="visitante">
              Visitante
            </option>
            <option className="text-black" value="proveedor">
              Proveedor
            </option>
          </select>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Registrar
          </button>
        </div>
      </form>

      {/* QR oculto para captura */}
      <div
        style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
        ref={qrRef}
      >
        {uidGenerado && <QRCodeCanvas value={uidGenerado} size={200} />}
      </div>

      {/* Mostrar QR al usuario */}
      {qrUrl && (
        <div className="flex justify-center mt-6">
          <img src={qrUrl} alt="Código QR" width={200} />
        </div>
      )}
    </main>
  );
}
