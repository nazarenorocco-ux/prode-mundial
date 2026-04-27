export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, userEmail } = req.body

  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Faltan datos: userId y userEmail son requeridos' })
  }

  // Validar que userId sea UUID antes de enviarlo a MP como external_reference
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(userId)) {
    return res.status(400).json({ error: 'userId inválido' })
  }

  try {
    const response = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
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
          notification_url:
            'https://prode-mundial-tau.vercel.app/api/confirm-payment',
          back_urls: {
            success: 'https://prode-mundial-tau.vercel.app/payment/success',
            failure: 'https://prode-mundial-tau.vercel.app/payment/failure',
            pending: 'https://prode-mundial-tau.vercel.app/payment/pending'
          },
          auto_return: 'approved'
        })
      }
    )

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      return res.status(502).json({
        error: 'Error al crear preferencia en MercadoPago',
        detail: errorBody
      })
    }

    const data = await response.json()

    if (!data.init_point) {
      return res
        .status(500)
        .json({ error: 'MercadoPago no devolvió init_point', detail: data })
    }

    return res.status(200).json({ init_point: data.init_point })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
