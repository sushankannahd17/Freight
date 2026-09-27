export const DEFAULT_USD_INR_RATE = 83.20;

export type Currency = 'INR' | 'USD';

/**
 * Formats a number with Indian comma grouping (e.g. 2,30,45,000)
 */
export function formatNumberIndian(value: number): string {
  if (value === 0 || isNaN(value)) return '0';

  const parts = Math.round(value).toString().split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return parts.length > 1 ? `${formattedInteger}.${parts[1]}` : formattedInteger;
}

/**
 * Formats amount in INR: ₹ 2,30,45,000
 */
export function formatINR(amountInINR: number): string {
  return `₹ ${formatNumberIndian(amountInINR)}`;
}

/**
 * Formats amount in INR Crore: ₹ 230.45 Crore
 */
export function formatINRCrore(amountInINR: number): string {
  const crore = amountInINR / 10000000;
  return `₹ ${crore.toFixed(2)} Crore`;
}

/**
 * Formats amount in INR Lakh: ₹ 15.75 Lakh
 */
export function formatINRLakh(amountInINR: number): string {
  const lakh = amountInINR / 100000;
  return `₹ ${lakh.toFixed(2)} Lakh`;
}

/**
 * Formats USD amount: $ 2,775,000
 */
export function formatUSD(amountInUSD: number): string {
  return `$ ${Math.round(amountInUSD).toLocaleString('en-US')}`;
}

/**
 * Convert USD to INR using reference exchange rate
 */
export function convertUSDToINR(amountInUSD: number, rate: number = DEFAULT_USD_INR_RATE): number {
  return amountInUSD * rate;
}

/**
 * Dynamic currency formatter based on selected currency
 */
export function formatCurrency(
  amountInUSD: number,
  currency: Currency = 'INR',
  rate: number = DEFAULT_USD_INR_RATE
): string {
  if (currency === 'INR') {
    const inr = convertUSDToINR(amountInUSD, rate);
    return formatINR(inr);
  }
  return formatUSD(amountInUSD);
}

/**
 * Dynamic freight rate formatter per MT ($/MT or ₹/MT)
 */
export function formatRatePerMT(
  rateInUSD: number,
  currency: Currency = 'INR',
  rate: number = DEFAULT_USD_INR_RATE
): string {
  if (currency === 'INR') {
    const inrRate = Math.round(rateInUSD * rate);
    return `₹ ${formatNumberIndian(inrRate)} / MT`;
  }
  return `$ ${rateInUSD.toFixed(2)} / MT`;
}

/**
 * Formats total cost in compact notation (Crore for INR, Millions for USD)
 */
export function formatTotalCostShort(
  amountInUSD: number,
  currency: Currency = 'INR',
  rate: number = DEFAULT_USD_INR_RATE
): string {
  if (currency === 'INR') {
    const inr = convertUSDToINR(amountInUSD, rate);
    if (inr >= 10000000) {
      return formatINRCrore(inr);
    }
    return formatINRLakh(inr);
  }
  const millions = amountInUSD / 1000000;
  return `$ ${millions.toFixed(2)}M`;
}
