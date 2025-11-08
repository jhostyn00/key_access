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
    <main className="fondo-login min-h-screen flex items-center justify-center font-[Outfit] px-6 py-12 relative overflow-hidden">
  {/* Círculos animados de fondo */}
  <div className="absolute w-[600px] h-[600px] bg-[#324f6279] rounded-full top-10 left-20 animate-move1 filter blur-2xl"></div>
  <div className="absolute w-[600px] h-[600px] bg-[#2085925b] rounded-full top-40 left-60 animate-move2 filter blur-2xl"></div>
  <div className="absolute w-[600px] h-[600px] bg-[#324f6279] rounded-full top-60 left-30 animate-move3 filter blur-2xl"></div>

  {/* Formulario */}
  <form
    onSubmit={handleSubmit}
    className="relative z-10 w-full max-w-3xl bg-white/20 backdrop-blur-xl rounded-3xl p-8 shadow-lg flex flex-col gap-6"
  >
    <h1 className="text-center text-3xl font-bold text-white mb-4">Registrar Persona</h1>

    {message && (
      <p
        className={`text-center font-semibold ${
          message.includes('❌') ? 'text-red-500' : 'text-green-400'
        }`}
      >
        {message}
      </p>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Campos generales */}
      <input
        id="nombre"
        placeholder="Nombre"
        value={formData.nombre}
        onChange={handleChange}
        required
        className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
      />

      <input
        id="apellido"
        placeholder="Apellido"
        value={formData.apellido}
        onChange={handleChange}
        required
        className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
      />

      <input
        id="dni"
        placeholder="DNI"
        value={formData.dni}
        onChange={handleChange}
        required
        maxLength={8}
        inputMode="numeric"
        pattern="[0-9]{8}"
        className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
      />

      <input
        id="correo"
        type="email"
        placeholder="Correo"
        value={formData.correo}
        onChange={handleChange}
        required
        className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
      />

      <input
        id="clave"
        type="password"
        placeholder="Clave"
        value={formData.clave}
        onChange={handleChange}
        required
        className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
      />

      <select
        id="tipo_persona"
        value={formData.tipo_persona}
        onChange={handleChange}
        required
        className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
      >
        <option value="">Tipo de Persona</option>
        <option value="residente">Residente</option>
        <option value="propietario">Propietario</option>
        <option value="trabajador">Trabajador</option>
        <option value="visitante">Visitante</option>
        <option value="proveedor">Proveedor</option>
      </select>
    </div>

    {/* Campos condicionales */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {formData.tipo_persona === 'residente' && (
        <>
          <select
            id="id_departamento"
            value={formData.id_departamento}
            onChange={handleChange}
            className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          >
            <option value="">Departamento</option>
            {departamentos.map((dep) => (
              <option key={dep.id_departamento} value={dep.id_departamento}>
                {dep.edificio?.nombre_edificio} - {dep.numero}
              </option>
            ))}
          </select>

          <input
            id="telefono"
            placeholder="Teléfono"
            value={formData.telefono}
            onChange={handleChange}
            maxLength={9}
            inputMode="numeric"
            pattern="(9[0-9]{8}|[0-9]{7})"
            className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          />
        </>
      )}

      {formData.tipo_persona === 'propietario' && (
        <select
          id="id_edificio"
          value={formData.id_edificio}
          onChange={handleChange}
          className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
        >
          <option value="">Edificio</option>
          {edificios.map((ed) => (
            <option key={ed.id_edificio} value={ed.id_edificio}>
              {ed.nombre_edificio}
            </option>
          ))}
        </select>
      )}

      {formData.tipo_persona === 'trabajador' && (
        <>
          <input
            id="cargo"
            placeholder="Cargo"
            value={formData.cargo}
            onChange={handleChange}
            className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          />
          <input
            id="turno"
            placeholder="Turno"
            value={formData.turno}
            onChange={handleChange}
            className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          />
        </>
      )}

      {(formData.tipo_persona === 'visitante' || formData.tipo_persona === 'proveedor') && (
        <select
          id="id_residente_visitado"
          value={formData.id_residente_visitado}
          onChange={handleChange}
          className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
        >
          <option value="">Residente destino</option>
          {residentes.map((r) => (
            <option key={r.id_residente} value={r.id_residente}>
              {r.persona?.nombre} {r.persona?.apellido}
            </option>
          ))}
        </select>
      )}

      {formData.tipo_persona === 'visitante' && (
        <input
          id="motivo_visita"
          placeholder="Motivo de visita"
          value={formData.motivo_visita}
          onChange={handleChange}
          className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
        />
      )}

      {formData.tipo_persona === 'proveedor' && (
        <>
          <input
            id="empresa"
            placeholder="Empresa"
            value={formData.empresa}
            onChange={handleChange}
            className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          />
          <input
            id="descripcion_producto"
            placeholder="Descripción del producto"
            value={formData.descripcion_producto}
            onChange={handleChange}
            className="p-3 rounded-full bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          />
        </>
      )}
    </div>

    {/* Botón */}
    <button
      type="submit"
      className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-full text-lg transition"
    >
      Registrar →
    </button>

    {/* QR oculto para captura */}
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} ref={qrRef}>
      {uidGenerado && <QRCodeCanvas value={uidGenerado} size={200} />}
    </div>

    {/* Mostrar QR */}
    {qrUrl && (
      <div className="flex flex-col items-center mt-6 gap-4">
        <img src={qrUrl} alt="Código QR" width={200} />
        <a
          href={`https://wa.me/51${formData.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
            `Hola ${formData.nombre}, este es tu código QR de acceso: ${qrUrl}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition"
        >
          Enviar QR por WhatsApp
        </a>
      </div>
    )}
  </form>
</main>

  );
}

