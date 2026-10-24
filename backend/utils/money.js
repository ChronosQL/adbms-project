const toCents = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100);
};

const fromCents = (value) => Number((Number(value || 0) / 100).toFixed(2));

module.exports = { toCents, fromCents };
