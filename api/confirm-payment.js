export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { createClient } = await import('@supabase/supabase-js')

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

    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    )

    if (!mpResponse.ok) {
      return res.status(502).json({
        error: 'Error consultando MercadoPago',
        status: mpResponse.status
      })
    }

    const payment = await mpResponse.json()

    if (payment.status !== 'approved') {
      return res.status(200).json({ message: 'Payment not approved, ignored' })
    }

    const userId = payment.external_reference

    if (!userId) {
      return res.status(400).json({ error: 'No external_reference en el pago' })
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'external_reference no es un UUID válido' })
    }

    // ✅ 1. Actualizar profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        status: 'active',       // ✅ canónico
        payment_method: 'mp'
      })
      .eq('id', userId)

    if (profileError) {
      return res.status(500).json({ error: profileError.message })
    }

    // ✅ 2. Actualizar competition_entries (ambas competencias)
    const { error: entriesError } = await supabase
      .from('competition_entries')
      .update({
        status: 'active',       // ✅ canónico
        payment_method: 'mp'
      })
      .eq('user_id', userId)

    if (entriesError) {
      return res.status(500).json({ error: entriesError.message })
    }

    return res.status(200).json({ success: true, userId })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
