import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function POST(request) {
  try {
    const body = await request.json();
    const { telefono, qrUrl } = body;

    if (!telefono || !qrUrl) {
      return NextResponse.json({ message: 'Faltan datos' }, { status: 400 });
    }

    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+51${telefono}`,
      body: `👋 ¡Hola! Aquí tienes tu código QR.`,
      mediaUrl: [qrUrl],
    });

    return NextResponse.json({ success: true, sid: message.sid }, { status: 200 });
  } catch (error) {
    console.error('Error al enviar WhatsApp:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
