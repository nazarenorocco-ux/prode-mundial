export default async function handler(req, res) {
  // MercadoPago envía GET para verificar el endpoint al configurarlo
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Importación dinámica para Vercel serverless
  const { createClient } = await import('@supabase/supabase-js')

  // SUPABASE_URL (sin prefijo VITE_) debe estar en Vercel env vars
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const body = req.body
    const paymentId = body?.data?.id || body?.id

    if (!paymentId) {
      return res.status(400).json({ error: 'No payment ID' })
    }

    // Verificar el pago contra la API de MercadoPago
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    )

    if (!mpResponse.ok) {
      return res
        .status(502)
        .json({ error: 'Error consultando MercadoPago', status: mpResponse.status })
    }

    const payment = await mpResponse.json()

    // Solo procesar pagos aprobados
    if (payment.status !== 'approved') {
      return res.status(200).json({ message: 'Payment not approved, ignored' })
    }

    const userId = payment.external_reference

    if (!userId) {
      return res.status(400).json({ error: 'No external_reference en el pago' })
    }

    // Validar que external_reference sea un UUID válido
    // (evita que un webhook malicioso active cuentas con IDs arbitrarios)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return res
        .status(400)
        .json({ error: 'external_reference no es un UUID válido' })
    }

    // Activar la cuenta del usuario
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'activo',
        payment_method: 'mp'
      })
      .eq('id', userId)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true, userId })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
