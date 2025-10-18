import supabase from '@/lib/supabaseClient';

export async function POST(req) {
  try {
    const { uid_tarjeta, clave } = await req.json();

    if (!uid_tarjeta || !clave) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
    }

    // Guardamos la clave tal cual (sin hash)
    const { data, error } = await supabase
      .from('persona')
      .update({ clave })  // clave sin encriptar
      .eq('uid_tarjeta', uid_tarjeta);

    if (error) {
      console.error('Error supabase:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error inesperado:', error);
    return new Response(JSON.stringify({ error: 'Error inesperado' }), { status: 500 });
  }
}
