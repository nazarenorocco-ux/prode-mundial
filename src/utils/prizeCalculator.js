export const PRIZE_TIERS = [
  {
    maxPlayers: 300,
    prizes: 3,
    percentages: [0.50, 0.30, 0.20]
  },
  {
    maxPlayers: 500,
    prizes: 4,
    percentages: [0.48, 0.28, 0.18, 0.06]
  },
  {
    maxPlayers: 700,
    prizes: 5,
    percentages: [0.46, 0.27, 0.17, 0.06, 0.04]
  },
  {
    maxPlayers: 900,
    prizes: 6,
    percentages: [0.45, 0.26, 0.16, 0.06, 0.04, 0.03]
  },
  {
    maxPlayers: 1000,
    prizes: 7,
    percentages: [0.44, 0.25, 0.16, 0.06, 0.04, 0.03, 0.02]
  },
  {
    maxPlayers: 1400,
    prizes: 8,
    percentages: [0.43, 0.25, 0.15, 0.06, 0.04, 0.03, 0.02, 0.02]
  },
  {
    maxPlayers: 1800,
    prizes: 9,
    percentages: [0.43, 0.24, 0.15, 0.06, 0.04, 0.03, 0.02, 0.02, 0.01]
  },
  {
    maxPlayers: 2200,
    prizes: 10,
    percentages: [0.42, 0.24, 0.15, 0.06, 0.04, 0.03, 0.02, 0.02, 0.01, 0.01]
  },
  {
    maxPlayers: 2600,
    prizes: 11,
    percentages: [0.42, 0.23, 0.15, 0.06, 0.04, 0.03, 0.02, 0.02, 0.01, 0.01, 0.01]
  },
  {
    maxPlayers: Infinity,
    prizes: 12,
    percentages: [0.41, 0.23, 0.15, 0.06, 0.04, 0.03, 0.02, 0.02, 0.01, 0.01, 0.01, 0.01]
  }
];

export const ENTRY_FEE = 40000;
export const PRIZE_POOL_PERCENTAGE = 0.80;

export function calculatePrizes(activePlayers) {
  const totalPool = activePlayers * ENTRY_FEE * PRIZE_POOL_PERCENTAGE;
  const tier = PRIZE_TIERS.find(t => activePlayers <= t.maxPlayers);

  return {
    totalPool,
    prizes: tier.percentages.map((pct, index) => ({
      position: index + 1,
      percentage: pct,
      amount: Math.round(totalPool * pct)
    }))
  };
}

export function formatARS(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
