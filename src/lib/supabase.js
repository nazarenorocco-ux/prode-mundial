import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getFlagUrl(flagValue) {
  if (!flagValue || typeof flagValue !== 'string') return null

  const trimmed = flagValue.trim()

  // Si ya es un código ISO de 2 letras (ej: "AR", "MX")
  if (/^[A-Z]{2}$/i.test(trimmed)) {
    return `https://flagcdn.com/w40/${trimmed.toLowerCase()}.png`
  }

  // Si es un emoji de bandera (2 regional indicator symbols)
  const codePoints = [...trimmed].map(char => char.codePointAt(0))
  if (
    codePoints.length === 2 &&
    codePoints[0] >= 0x1F1E6 &&
    codePoints[0] <= 0x1F1FF &&
    codePoints[1] >= 0x1F1E6 &&
    codePoints[1] <= 0x1F1FF
  ) {
    const code = codePoints
      .map(cp => String.fromCharCode(cp - 0x1F1E6 + 65))
      .join('')
      .toLowerCase()
    return `https://flagcdn.com/w40/${code}.png`
  }

  // Si no matchea nada, retornar null (no string vacío)
  return null
}
