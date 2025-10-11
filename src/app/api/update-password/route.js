import supabase from '@/lib/supabaseClient';

export async function POST(req) {
  const { uid_tarjeta, password } = await req.json();

  if (!uid_tarjeta || !password) {
    return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
  }

  try {
    // Aquí actualizas la contraseña en la tabla persona (o donde esté)
    // Puedes hacer hashing de la contraseña aquí si usas uno (bcrypt, etc.)

    const { data, error } = await supabase
      .from('persona')
      .update({ password }) // O el campo que tengas para password
      .eq('uid_tarjeta', uid_tarjeta);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error inesperado' }), { status: 500 });
  }
}
