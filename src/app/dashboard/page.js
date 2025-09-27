'use client';

import { QRCodeCanvas } from 'qrcode.react';
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
  const [personas, setPersonas] = useState([]);

  const [message, setMessage] = useState('');
  const [uidGenerado, setUidGenerado] = useState('');

  // Formulario acceso separado
  const [formAcceso, setFormAcceso] = useState({
    id_persona: '',
    tipo_movimiento: '',
    observaciones: '',
  });

  // ------------------ VALIDACIONES ------------------
  const validarDNI = (dni) => /^[0-9]{8}$/.test(dni);
  const validarTelefono = (telefono) =>
    /^9\d{8}$/.test(telefono) || /^[0-9]{7}$/.test(telefono);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        const { data: personasData } = await supabase
          .from('persona')
          .select('id_persona, nombre, apellido');
        setPersonas(personasData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  // Función para validar campos obligatorios según tipo_persona
  const validarCamposObligatorios = () => {
    const {
      nombre,
      apellido,
      dni,
      tipo_persona,
      id_departamento,
      id_edificio,
      cargo,
      turno,
      id_residente_visitado,
      empresa,
      descripcion_producto,
    } = formData;

    if (!nombre || !apellido || !dni || !tipo_persona) {
      setMessage('❌ Completa los campos obligatorios: Nombre, Apellido, DNI y Tipo de Persona');
      return false;
    }

    if (!validarDNI(dni)) {
      setMessage('❌ DNI inválido. Debe tener exactamente 8 dígitos.');
      return false;
    }

    if (formData.telefono && !validarTelefono(formData.telefono)) {
      setMessage(
        '❌ Teléfono inválido. Debe tener 7 dígitos (fijo) o 9 dígitos empezando en 9 (celular).'
      );
      return false;
    }

    switch (tipo_persona) {
      case 'residente':
        if (!id_departamento) {
          setMessage('❌ Selecciona un departamento para residente.');
          return false;
        }
        break;

      case 'propietario':
        if (!id_edificio) {
          setMessage('❌ Selecciona un edificio para propietario.');
          return false;
        }
        break;

      case 'trabajador':
        if (!cargo || !turno) {
          setMessage('❌ Completa cargo y turno para trabajador.');
          return false;
        }
        break;

      case 'visitante':
        if (!id_residente_visitado) {
          setMessage('❌ Selecciona el residente destino para visitante.');
          return false;
        }
        break;

      case 'proveedor':
        if (!empresa || !descripcion_producto || !id_residente_visitado) {
          setMessage('❌ Completa empresa, descripción y residente destino para proveedor.');
          return false;
        }
        break;

      default:
        break;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validarCamposObligatorios()) return;

    // Generar UID antes de guardar
    const uidBase =
      formData.tipo_persona.substring(0, 3).toUpperCase() +
      '-' +
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
    const uidGeneradoValue = `https://tusitio.com/p/${uidBase}`;

    // Insertar en persona
    const { data: personaData, error: personaError } = await supabase
      .from('persona')
      .insert({
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        tipo_persona: formData.tipo_persona,
        uid_tarjeta: uidGeneradoValue,
      })
      .select()
      .single();

    if (personaError) {
      console.error('Error al registrar persona:', personaError);
      setMessage('❌ Error al registrar persona.');
      return;
    }

    const id_persona = personaData.id_persona;

    // Parseos seguros para campos opcionales numéricos
    const idDepartamentoInt = formData.id_departamento
      ? parseInt(formData.id_departamento)
      : null;
    const idEdificioInt = formData.id_edificio ? parseInt(formData.id_edificio) : null;
    const idResidenteVisitadoInt = formData.id_residente_visitado
      ? parseInt(formData.id_residente_visitado)
      : null;

    // Insertar en tabla específica según tipo_persona
    let errorEspecifico = null;
    switch (formData.tipo_persona) {
      case 'residente':
        ({ error: errorEspecifico } = await supabase
          .from('residente')
          .insert({
            id_residente: id_persona,
            id_departamento: idDepartamentoInt,
            telefono: formData.telefono || null,
          }));
        break;

      case 'propietario':
        ({ error: errorEspecifico } = await supabase
          .from('propietario')
          .insert({
            id_propietario: id_persona,
            id_edificio: idEdificioInt,
            telefono: formData.telefono || null,
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
            motivo_visita: formData.motivo_visita || null,
            id_residente_visitado: idResidenteVisitadoInt,
          }));
        break;

      case 'proveedor':
        ({ error: errorEspecifico } = await supabase
          .from('proveedor')
          .insert({
            id_proveedor: id_persona,
            empresa: formData.empresa,
            descripcion_producto: formData.descripcion_producto,
            id_residente_destino: idResidenteVisitadoInt,
          }));
        break;

      default:
        break;
    }

    if (errorEspecifico) {
      console.error('Error en tabla específica:', errorEspecifico);
      setMessage('❌ Persona creada, pero error en tabla específica.');
      return;
    }

    // Registro exitoso
    setMessage('✅ Registro exitoso');
    setUidGenerado(uidGeneradoValue);

    // Reset form
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

  // -- Funciones para formulario acceso --

  const handleChangeAcceso = (e) => {
    setFormAcceso((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const registrarAcceso = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!formAcceso.id_persona || !formAcceso.tipo_movimiento) {
      setMessage('❌ Por favor completa todos los campos obligatorios del acceso.');
      return;
    }

    const { error } = await supabase.from('acceso').insert({
      id_persona: parseInt(formAcceso.id_persona),
      tipo_movimiento: formAcceso.tipo_movimiento,
      fecha_hora: new Date().toISOString(),
      observaciones: formAcceso.observaciones || null,
      id_autorizador: null,
    });

    if (error) {
      console.error('Error al registrar acceso:', error);
      setMessage('❌ Error al registrar acceso.');
    } else {
      setMessage('✅ Acceso registrado correctamente.');
      setFormAcceso({
        id_persona: '',
        tipo_movimiento: '',
        observaciones: '',
      });
    }
  };

  return (
    <main className="bg-gradient-to-b from-gray-100 to-gray-500 min-h-screen">
      <HeaderDashboard />
      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-lg mt-10"
      >
        <h1 className="text-center text-3xl font-bold text-gray-800">Registrar Persona</h1>
        {message && (
          <p
            className={`text-center mt-4 font-semibold ${
              message.startsWith('✅') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-4">
          <label className="text-gray-700" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="border-2 p-2 rounded text-black"
          />

          <label className="text-gray-700" htmlFor="apellido">
            Apellido
          </label>
          <input
            id="apellido"
            value={formData.apellido}
            onChange={handleChange}
            required
            className="border-2 p-2 rounded text-black"
          />

          <label className="text-gray-700" htmlFor="dni">
            DNI
          </label>
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

          <label className="text-gray-700" htmlFor="tipo_persona">
            Tipo de Persona
          </label>
          <select
            id="tipo_persona"
            value={formData.tipo_persona}
            onChange={handleChange}
            required
            className="border-2 p-2 rounded text-black"
            aria-label="Tipo de Persona"
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

          {(formData.tipo_persona === 'residente' ||
            formData.tipo_persona === 'propietario') && (
            <>
              {formData.tipo_persona === 'residente' && (
                <>
                  <label className="text-gray-700" htmlFor="id_departamento">
                    Departamento
                  </label>
                  <select
                    id="id_departamento"
                    value={formData.id_departamento}
                    onChange={handleChange}
                    className="border-2 p-2 rounded text-black"
                    aria-label="Departamento"
                  >
                    <option className="text-black" value="">
                      Seleccionar...
                    </option>
                    {departamentos.map((dep) => (
                      <option
                        className="text-black"
                        key={dep.id_departamento}
                        value={dep.id_departamento}
                      >
                        {dep.edificio?.nombre_edificio} - {dep.numero}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label className="text-gray-700" htmlFor="telefono">
                Teléfono
              </label>
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
              <label className="text-gray-700" htmlFor="id_edificio">
                Edificio
              </label>
              <select
                id="id_edificio"
                value={formData.id_edificio}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
                aria-label="Edificio"
              >
                <option className="text-black" value="">
                  Seleccionar...
                </option>
                {edificios.map((ed) => (
                  <option
                    className="text-black"
                    key={ed.id_edificio}
                    value={ed.id_edificio}
                  >
                    {ed.nombre_edificio}
                  </option>
                ))}
              </select>

              <label className="text-gray-700" htmlFor="telefono">
                Teléfono
              </label>
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

          {formData.tipo_persona === 'trabajador' && (
            <>
              <label className="text-gray-700" htmlFor="cargo">
                Cargo
              </label>
              <input
                id="cargo"
                value={formData.cargo}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
                required
              />
              <label className="text-gray-700" htmlFor="turno">
                Turno
              </label>
              <select
                id="turno"
                value={formData.turno}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
                required
                aria-label="Turno"
              >
                <option value="">Seleccionar...</option>
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </select>
            </>
          )}

          {(formData.tipo_persona === 'visitante' ||
            formData.tipo_persona === 'proveedor') && (
            <>
              <label className="text-gray-700" htmlFor="id_residente_visitado">
                Residente destino
              </label>
              <select
                id="id_residente_visitado"
                value={formData.id_residente_visitado}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
                aria-label="Residente destino"
              >
                <option value="">Seleccionar...</option>
                {residentes.map((res) => (
                  <option key={res.id_residente} value={res.id_residente}>
                    {res.persona.nombre} {res.persona.apellido}
                  </option>
                ))}
              </select>
            </>
          )}

          {formData.tipo_persona === 'visitante' && (
            <>
              <label className="text-gray-700" htmlFor="motivo_visita">
                Motivo de visita
              </label>
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
              <label className="text-gray-700" htmlFor="empresa">
                Empresa
              </label>
              <input
                id="empresa"
                value={formData.empresa}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
              />

              <label className="text-gray-700" htmlFor="descripcion_producto">
                Descripción del producto
              </label>
              <input
                id="descripcion_producto"
                value={formData.descripcion_producto}
                onChange={handleChange}
                className="border-2 p-2 rounded text-black"
              />
            </>
          )}

          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-4"
          >
            Registrar
          </button>
        </div>
      </form>

      {uidGenerado && (
        <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Código QR generado:
          </h2>
          <QRCodeCanvas value={uidGenerado} size={200} />
          <p className="mt-4 text-gray-700">{uidGenerado}</p>
        </div>
      )}

      {/* Formulario de registro de acceso */}
      <form
        onSubmit={registrarAcceso}
        className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-lg mt-10"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Registrar Acceso</h2>

        <div className="flex flex-col gap-4">
          <label className="text-gray-700" htmlFor="id_persona">
            Persona
          </label>
          <select
            id="id_persona"
            value={formAcceso.id_persona}
            onChange={handleChangeAcceso}
            className="border-2 p-2 rounded text-black"
            aria-label="Seleccionar persona para acceso"
            required
          >
            <option value="">Seleccionar...</option>
            {personas.map((p) => (
              <option key={p.id_persona} value={p.id_persona}>
                {p.nombre} {p.apellido}
              </option>
            ))}
          </select>

          <label className="text-gray-700" htmlFor="tipo_movimiento">
            Tipo de Movimiento
          </label>
          <select
            id="tipo_movimiento"
            value={formAcceso.tipo_movimiento}
            onChange={handleChangeAcceso}
            className="border-2 p-2 rounded text-black"
            required
            aria-label="Tipo de movimiento"
          >
            <option value="">Seleccionar...</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>

          <label className="text-gray-700" htmlFor="observaciones">
            Observaciones
          </label>
          <input
            id="observaciones"
            value={formAcceso.observaciones}
            onChange={handleChangeAcceso}
            className="border-2 p-2 rounded text-black"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
          >
            Registrar Acceso
          </button>
        </div>
      </form>
    </main>
  );
}
