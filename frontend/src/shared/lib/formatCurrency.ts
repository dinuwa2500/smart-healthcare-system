export function formatCurrency(
  amount: number,
  currency = 'LKR',
  locale = 'en-LK'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
