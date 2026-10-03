const fmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export const money = (n) => fmt.format(n || 0)

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100