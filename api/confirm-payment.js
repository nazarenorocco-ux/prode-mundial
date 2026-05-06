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

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    })

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
    const competitionId = payment?.metadata?.competition_id || null

    if (!userId) {
      return res.status(400).json({ error: 'No external_reference en el pago' })
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'external_reference no es un UUID válido' })
    }

    // 1. Leer estado actual del perfil
    const { data: profileData, error: profileFetchError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .single()

    if (profileFetchError) {
      return res.status(500).json({ error: profileFetchError.message })
    }

    // 2. Solo actualizar profiles si no está ya activo
    if (profileData.status !== 'active') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'active', payment_method: 'mp' })
        .eq('id', userId)

      if (profileError) {
        return res.status(500).json({ error: profileError.message })
      }
    }

    // 3. Actualizar competition_entry — siempre requiere competition_id
    if (!competitionId) {
      return res.status(400).json({ error: 'No competition_id en metadata del pago' })
    }

    if (!uuidRegex.test(competitionId)) {
      return res.status(400).json({ error: 'competition_id inválido' })
    }

    const { error: entriesError } = await supabase
      .from('competition_entries')
      .update({ status: 'active', payment_method: 'mp' })
      .eq('user_id', userId)
      .eq('competition_id', competitionId)

    if (entriesError) {
      return res.status(500).json({ error: entriesError.message })
    }

    return res.status(200).json({ success: true, userId, competitionId })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
