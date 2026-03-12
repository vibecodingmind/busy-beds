/**
 * Format a plan price with the correct currency symbol/label.
 * USD ($), EUR (€), GBP (£), TZS (Tanzanian Shilling, no decimals).
 */
export function formatPlanPrice(price: number, currency: string = 'USD'): string {
  const c = (currency || 'USD').toUpperCase();
  switch (c) {
    case 'USD':
      return `$${Number(price).toFixed(2)}`;
    case 'EUR':
      return `€${Number(price).toFixed(2)}`;
    case 'GBP':
      return `£${Number(price).toFixed(2)}`;
    case 'TZS':
      return `TZS ${Math.round(Number(price)).toLocaleString()}`;
    default:
      return `$${Number(price).toFixed(2)}`;
  }
}
