export const TIME_ZONE = "America/Argentina/Buenos_Aires";

export const toArgentinaDate = (date) => {
  if (!date) return null;

  return new Date(
    new Date(date).toLocaleString("en-US", { timeZone: TIME_ZONE })
  );
};

export const formatearFecha = (fecha) => {
  if (!fecha) return "";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(fecha));
};

export const formatearFechaLarga = (fecha) => {
  if (!fecha) return "";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(fecha));
};

export const isPredictionLocked = (matchDate) => {
  if (!matchDate) return true;

  const matchTime = new Date(matchDate).getTime();
  const now = Date.now();
  const thirtyMinutesBefore = 30 * 60 * 1000;

  return now >= matchTime - thirtyMinutesBefore;
};

// Alias en español para compatibilidad con Admin.jsx
export const estaLocked = (matchDate) => isPredictionLocked(matchDate);

export const isMatchFinished = (match) => {
  return match?.status === "finished";
};

// Alias opcional por si en algún archivo viejo lo usan
export const estaFinalizado = (match) => isMatchFinished(match);
