import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjjdzeixhwicijuathqx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqamR6ZWl4aHdpY2lqdWF0aHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTIzMzUsImV4cCI6MjA5MjYyODMzNX0.iMGKa9hYnVvw1QcFpvMj3bft7fSnSRYcPRqU3W49WhQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionFromUrl: true
  }
})

/**
 * Devuelve la URL de la bandera para un equipo dado.
 * Acepta: código ISO de 2 letras ("AR"), URL completa, o emoji de bandera ("🇦🇷").
 * Retorna null si el valor no es reconocido.
 */
export function getFlagUrl(flagValue) {
  if (!flagValue || typeof flagValue !== 'string') return null

  const trimmed = flagValue.trim()
  if (!trimmed) return null

  // URL completa — devolver tal cual
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // Código ISO de 2 letras (ej: "AR", "ar", "MX")
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return `https://flagcdn.com/w40/${trimmed.toLowerCase()}.png`
  }

  // Emoji de bandera: 2 Regional Indicator Symbols Unicode
  const codePoints = [...trimmed].map(char => char.codePointAt(0))
  if (
    codePoints.length === 2 &&
    codePoints[0] >= 0x1f1e6 &&
    codePoints[0] <= 0x1f1ff &&
    codePoints[1] >= 0x1f1e6 &&
    codePoints[1] <= 0x1f1ff
  ) {
    const code = codePoints
      .map(cp => String.fromCharCode(cp - 0x1f1e6 + 65))
      .join('')
      .toLowerCase()
    return `https://flagcdn.com/w40/${code}.png`
  }

  return null
}
