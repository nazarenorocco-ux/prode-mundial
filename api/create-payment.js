export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    userId,
    userEmail,
    competition_id,
    userName
  } = req.body

  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Faltan datos: userId y userEmail son requeridos' })
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(userId)) {
    return res.status(400).json({ error: 'userId inválido' })
  }

  if (!competition_id || !uuidRegex.test(competition_id)) {
    return res.status(400).json({ error: 'competition_id inválido o ausente' })
  }

  const { createClient } = await import('@supabase/supabase-js')

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Leer entry_fee desde la tabla competitions
  const { data: competition, error: competitionError } = await supabase
    .from('competitions')
    .select('entry_fee, name')
    .eq('id', competition_id)
    .single()

  if (competitionError || !competition) {
    return res.status(404).json({ error: 'Competencia no encontrada' })
  }

  const finalAmount = competition.entry_fee

  if (!finalAmount || finalAmount <= 0) {
    return res.status(400).json({ error: 'entry_fee inválido para esta competencia' })
  }

  const isKnockout = competition.name === 'knockout'

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            title: isKnockout
              ? 'Inscripción Prode Mundial 2026 - Knockout'
              : 'Inscripción Prode Mundial 2026 - Grupos',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: finalAmount
          }
        ],
        payer: {
          email: userEmail,
          name: userName || undefined
        },
        external_reference: userId,
        metadata: {
          userId,
          competition_id
        },
        notification_url: 'https://prode-mundial-tau.vercel.app/api/confirm-payment',
        back_urls: {
          success: 'https://prode-mundial-tau.vercel.app/payment/success',
          failure: 'https://prode-mundial-tau.vercel.app/payment/failure',
          pending: 'https://prode-mundial-tau.vercel.app/payment/pending'
        },
        auto_return: 'approved'
      })
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      return res.status(502).json({
        error: 'Error al crear preferencia en MercadoPago',
        detail: errorBody
      })
    }

    const data = await response.json()

    if (!data.init_point) {
      return res.status(500).json({ error: 'MercadoPago no devolvió init_point', detail: data })
    }

    return res.status(200).json({ init_point: data.init_point })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
