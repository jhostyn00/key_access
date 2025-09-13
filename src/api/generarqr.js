export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { link } = req.body;

  try {
    const response = await fetch('https://api.qr.io/v1/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.QR_IO_API_KEY, // Usa variable de entorno
      },
      body: JSON.stringify({
        data: link,
        transparent: 'on',
        frontcolor: '#000000',
        marker_out_color: '#000000',
        marker_in_color: '#000000',
        pattern: 'default',
        marker: 'default',
        marker_in: 'default',
        optionlogo: 'none',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.message });
    }

    const qrData = await response.json();
    res.status(200).json(qrData);
  } catch (error) {
    res.status(500).json({ error: 'Error generando QR' });
  }
}
