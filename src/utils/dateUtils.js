// src/utils/dateUtils.js

/**
 * Convierte una fecha UTC a string corto en Argentina Time.
 * Formato: "11/06 21:00" (para Dashboard, Admin)
 * @param {string} fechaUTC - ISO string UTC desde Supabase
 * @returns {string}
 */
export function formatearFecha(fechaUTC) {
  if (!fechaUTC) return '—'
  const date = new Date(fechaUTC)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Convierte una fecha UTC a string largo en Argentina Time.
 * Formato: "jueves 11 de junio, 21:00" (para Landing)
 * @param {string} fechaUTC - ISO string UTC desde Supabase
 * @returns {string|null} null si la fecha es inválida
 */
export function formatearFechaLarga(fechaUTC) {
  if (!fechaUTC) return null
  const date = new Date(fechaUTC)
  if (isNaN(date.getTime())) return null
  return date.toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Determina si un partido debe estar bloqueado para predicciones.
 * Se bloquea 30 minutos antes del inicio.
 * @param {string} matchDate - ISO string UTC desde Supabase
 * @returns {boolean}
 */
export function estaLocked(matchDate) {
  if (!matchDate) return true
  const matchTime = new Date(matchDate).getTime()
  const now       = Date.now()
  const LOCK_MS   = 30 * 60 * 1000  // 30 minutos
  return now >= matchTime - LOCK_MS
}

/**
 * Convierte una fecha ingresada en hora Argentina a ISO UTC para Supabase.
 * @param {string} fechaArgentina - "2026-06-11T21:00" (local AR)
 * @returns {string} ISO UTC string
 */
export function argentinaToUTC(fechaArgentina) {
  // Argentina es UTC-3, sumamos 3 horas para obtener UTC
  const localDate = new Date(fechaArgentina)
  const utcDate   = new Date(localDate.getTime() + 3 * 60 * 60 * 1000)
  return utcDate.toISOString()
}
