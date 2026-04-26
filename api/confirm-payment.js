export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
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
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    })

    const payment = await mpResponse.json()

    if (payment.status !== 'approved') {
      return res.status(200).json({ message: 'Payment not approved, ignored' })
    }

    const userId = payment.external_reference

    if (!userId) {
      return res.status(400).json({ error: 'No external_reference' })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        status: 'activo',
        payment_method: 'mercadopago'
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
