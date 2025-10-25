'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import html2canvas from 'html2canvas';




export default function DashboardPage() {
  const qrRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    correo: '',
    clave: '',
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

  // ------------------ FETCH DATOS ------------------
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

  // ------------------ HANDLE CHANGES ------------------
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  // ------------------ HANDLE SUBMIT ------------------
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
const uidBase =
  formData.tipo_persona.substring(0, 3).toUpperCase() +
  '-' +
  Math.floor(Math.random() * 10000).toString().padStart(4, '0');

const baseURL = 'http://127.0.0.1:3000'; // 👈 cambia aquí
const uidGeneradoValue = `${baseURL}/registrar-acceso?uid=${uidBase}`;
setUidGenerado(uidGeneradoValue);


    try {
      // Esperar a que el QR se renderice
      await new Promise((r) => setTimeout(r, 500));

      // Capturar QR como imagen
      const canvas = await html2canvas(qrRef.current);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.95)
      );
      const file = new File([blob], `${formData.dni}_qr.jpg`, {
        type: 'image/jpeg',
      });

      // Subir QR a Supabase Storage
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

      // Insertar persona
      const { data: personaData, error: personaError } = await supabase
        .from('persona')
        .insert({
          nombre: formData.nombre,
          apellido: formData.apellido,
          dni: formData.dni,
          
          tipo_persona: formData.tipo_persona,
          uid_tarjeta: uidBase,
          qr_url: publicUrl,
          rol: 3,
          correo: formData.correo,
          clave: formData.clave,
        })
        .select()
        .single();

      if (personaError) {
  console.error('❌ Error al insertar persona:', personaError);
  setMessage('❌ Error al registrar persona: ' + personaError.message);
  return;
}


      const id_persona = personaData.id_persona;
      let errorEspecifico = null;

      // Insertar en tabla específica según tipo_persona
      switch (formData.tipo_persona) {
        case 'residente':
          ({ error: errorEspecifico } = await supabase
            .from('residente')
            .insert({
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
              id_residente_visitado: parseInt(
                formData.id_residente_visitado
              ),
            }));
          break;

        case 'proveedor':
          ({ error: errorEspecifico } = await supabase
            .from('proveedor')
            .insert({
              id_proveedor: id_persona,
              empresa: formData.empresa,
              descripcion_producto: formData.descripcion_producto,
              id_residente_destino: parseInt(
                formData.id_residente_visitado
              ),
            }));
          break;
      }

      if (errorEspecifico) {
        console.error('Error tabla específica:', errorEspecifico);
        setMessage('Persona creada, pero error en tabla específica');
        return;
      }

      setMessage('✅ Persona registrada con código QR subido');

      // Limpiar formulario
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        correo: '',
        clave: '',
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
    <main className="fondo-login min-h-screen flex items-center justify-center font-[Outfit] px-6 py-12">
      <div className="circle circle1"></div>
  <div className="circle circle2"></div>
  <div className="circle circle3"></div>
  <div className="circle circle4"></div>
  <div className="circle circle5"></div>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg mt-10 w-100" 
      >
        <h1 className="text-center text-3xl font-bold text-gray-800 ">
          Registrar Persona
        </h1>

        {message && (
          <p className="text-center mt-4 font-semibold text-green-600">
            {message}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {/* Campos generales */}
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
          <label className="text-gray-700">Correo</label>
          <input
            id="correo"
            value={formData.correo}
            onChange={handleChange}
            required
            className="border-2 p-2 rounded text-black"
          />
          <label className="text-gray-700">Clave</label>
          <input
            id="clave"
            type='password'
            value={formData.clave}
            onChange={handleChange}
            required
            className="border-2 p-2 rounded text-black"
          />

          <label className="text-gray-700">Tipo de Persona</label>
          <select
            id="tipo_persona"
            value={formData.tipo_persona}
            onChange={handleChange}
            required
            className="border-2 p-2 rounded text-black"
          >
            <option value="">Seleccionar...</option>
            <option value="residente">Residente</option>
            <option value="propietario">Propietario</option>
            <option value="trabajador">Trabajador</option>
            <option value="visitante">Visitante</option>
            <option value="proveedor">Proveedor</option>
          </select>

          {/* Campos condicionales según tipo_persona */}
          {(formData.tipo_persona === 'residente' ||
            formData.tipo_persona === 'propietario') && (
            <>
              {formData.tipo_persona === 'residente' && (
                <>
                  <label className="text-gray-700">Departamento</label>
                  <select
                    id="id_departamento"
                    value={formData.id_departamento}
                    onChange={handleChange}
                    className="border-2 p-2 rounded text-black"
                  >
                    <option value="">Seleccionar...</option>
                    {departamentos.map((dep) => (
                      <option
                        key={dep.id_departamento}
                        value={dep.id_departamento}
                      >
                        {dep.edificio?.nombre_edificio} - {dep.numero}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label className="text-gray-700">Teléfono</label>
              <input
                id="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
                maxLength={9}
                inputMode="numeric"
                pattern="(9[0-9]{8}|[0-9]{7})"
              />
            </>
          )}

          {formData.tipo_persona === 'propietario' && (
            <>
              <label className="text-gray-700">Edificio</label>
              <select
                id="id_edificio"
                value={formData.id_edificio}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
              >
                <option value="">Seleccionar...</option>
                {edificios.map((ed) => (
                  <option key={ed.id_edificio} value={ed.id_edificio}>
                    {ed.nombre_edificio}
                  </option>
                ))}
              </select>
            </>
          )}

          {formData.tipo_persona === 'trabajador' && (
            <>
              <label className="text-gray-700">Cargo</label>
              <input
                id="cargo"
                value={formData.cargo}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
              />

              <label className="text-gray-700">Turno</label>
              <input
                id="turno"
                value={formData.turno}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
              />
            </>
          )}

          {(formData.tipo_persona === 'visitante' ||
            formData.tipo_persona === 'proveedor') && (
            <>
              <label className="text-gray-700">Residente destino</label>
              <select
                id="id_residente_visitado"
                value={formData.id_residente_visitado}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
              >
                <option value="">Seleccionar...</option>
                {residentes.map((r) => (
                  <option key={r.id_residente} value={r.id_residente}>
                    {r.persona?.nombre} {r.persona?.apellido}
                  </option>
                ))}
              </select>
            </>
          )}

          {formData.tipo_persona === 'visitante' && (
            <>
              <label className="text-gray-700">Motivo de visita</label>
              <input
                id="motivo_visita"
                value={formData.motivo_visita}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
              />
            </>
          )}

          {formData.tipo_persona === 'proveedor' && (
            <>
              <label className="text-gray-700">Empresa</label>
              <input
                id="empresa"
                value={formData.empresa}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
              />

              <label className="text-gray-700">Descripción del producto</label>
              <input
                id="descripcion_producto"
                value={formData.descripcion_producto}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
              />
            </>
          )}
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
  <div className="flex flex-col items-center mt-6 gap-4">
    {/* Vista previa del QR */}
    <img src={qrUrl} alt="Código QR" width={200} />

    {/* Botón para enviar el link por WhatsApp */}
    <a
      href={`https://wa.me/51${formData.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hola ${formData.nombre}, este es tu código QR de acceso: ${qrUrl}`
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
    >
      Enviar QR por WhatsApp
    </a>
  </div>
)}


    </main>
  );
}

