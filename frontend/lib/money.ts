export type MoneyInput = string | number | { toString(): string } | null | undefined;

export function toMoneyNumber(value: MoneyInput): number {
  if (value === null || value === undefined || value === '') return 0;
  const normalized = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(normalized) ? normalized : 0;
}

export function formatMoney(value: MoneyInput, digits = 2): string {
  return toMoneyNumber(value).toFixed(digits);
}

export function formatCurrency(value: MoneyInput, locale = 'en', currency = 'EGP'): string {
  const normalizedLocale = locale.startsWith('ar') ? 'ar-EG' : 'en-EG';

  return new Intl.NumberFormat(normalizedLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toMoneyNumber(value));
}
