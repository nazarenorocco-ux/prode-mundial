export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, userEmail } = req.body;

  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            title: 'Inscripción Prode Mundial 2026',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: 40000
          }
        ],
        payer: {
          email: userEmail
        },
        external_reference: userId,
        back_urls: {
          success: 'https://prode-mundial-tau.vercel.app/payment/success',
          failure: 'https://prode-mundial-tau.vercel.app/payment/failure',
          pending: 'https://prode-mundial-tau.vercel.app/payment/pending'
        },
        auto_return: 'approved'
      })
    });

    const data = await response.json();

    if (!data.init_point) {
      return res.status(500).json({ error: 'Error al crear preferencia', detail: data });
    }

    return res.status(200).json({ init_point: data.init_point });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
