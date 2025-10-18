import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

export async function POST(req) {
  const { token } = await req.json();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    return new Response(JSON.stringify({
      valid: true,
      uid_tarjeta: decoded.uid_tarjeta
    }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({
      valid: false,
      error: 'Token inválido o expirado.'
    }), { status: 401 });
  }
}
