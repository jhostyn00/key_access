import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

export async function POST(req) {
  const { nombre, correo, uid_tarjeta } = await req.json();

  if (!nombre || !correo || !uid_tarjeta) {
    return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
  }

  try {
    // Generar token JWT con uid_tarjeta y expiración de 1 hora
    const token = jwt.sign(
      { uid_tarjeta },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const linkRestauracion = `http://localhost:3000/restablecer?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Soporte" <${process.env.GMAIL_USER}>`,
      to: correo,
      subject: 'Recuperación de contraseña',
      html: `
        <div style="font-family: sans-serif;">
          <h2>Hola, ${nombre}</h2>
          <p>Haz click en el siguiente enlace para restablecer tu contraseña:</p>
          <p><a href="${linkRestauracion}" target="_blank">Restablecer contraseña</a></p>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este correo, ignóralo.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return new Response(JSON.stringify({ error: 'Error al enviar correo' }), { status: 500 });
  }
}
