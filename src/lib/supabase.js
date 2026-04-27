import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación temprana — el error aparece en consola durante desarrollo
// en lugar de un fallo críptico en runtime
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabase.js] Faltan variables de entorno: ' +
    'VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidas en .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
// TEMPORAL para testing — borrar después
window._sb = supabase