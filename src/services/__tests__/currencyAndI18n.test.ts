import { describe, it, expect } from 'vitest';
import {
  formatNumberIndian,
  formatINR,
  formatINRCrore,
  formatINRLakh,
  formatCurrency,
  formatRatePerMT,
  formatTotalCostShort,
} from '../currencyService';
import { t } from '../i18nService';

describe('Currency & Indian Number Formatting Service', () => {
  it('should format numbers with Indian comma grouping (1,00,00,000)', () => {
    expect(formatNumberIndian(1000)).toBe('1,000');
    expect(formatNumberIndian(100000)).toBe('1,00,000');
    expect(formatNumberIndian(23045000)).toBe('2,30,45,000');
  });

  it('should format INR currency string', () => {
    expect(formatINR(23045000)).toBe('₹ 2,30,45,000');
  });

  it('should format INR Crore and Lakh notation', () => {
    expect(formatINRCrore(230450000)).toBe('₹ 23.05 Crore');
    expect(formatINRLakh(1575000)).toBe('₹ 15.75 Lakh');
  });

  it('should convert USD to INR dynamically based on exchange rate 83.20', () => {
    // $100 * 83.20 = ₹8,320
    expect(formatCurrency(100, 'INR', 83.20)).toBe('₹ 8,320');
    expect(formatCurrency(100, 'USD', 83.20)).toBe('$ 100');
  });

  it('should format rate per MT in INR and USD', () => {
    expect(formatRatePerMT(18.63, 'INR', 83.20)).toBe('₹ 1,550 / MT');
    expect(formatRatePerMT(18.63, 'USD', 83.20)).toBe('$ 18.63 / MT');
  });

  it('should format short total cost in Crore for INR and Millions for USD', () => {
    // $2,770,000 * 83.20 = ₹23,04,64,000 = ₹23.05 Crore
    expect(formatTotalCostShort(2770000, 'INR', 83.20)).toBe('₹ 23.05 Crore');
    expect(formatTotalCostShort(2770000, 'USD', 83.20)).toBe('$ 2.77M');
  });
});

describe('i18n Service', () => {
  it('should return correct English and Hindi translations', () => {
    expect(t('navDashboard', 'en')).toBe('Dashboard');
    expect(t('navDashboard', 'hi')).toBe('डैशबोर्ड');
    expect(t('navPlanner', 'hi')).toBe('यात्रा योजनाकार');
    expect(t('navForecast', 'hi')).toBe('मालभाड़ा पूर्वानुमान');
  });
});
