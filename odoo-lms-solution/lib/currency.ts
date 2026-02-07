/**
 * Currency utilities for the LMS platform.
 *
 * The superadmin sets a single currency in Site Settings.
 * Every price displayed across the app uses `formatPrice()` to
 * render the amount with the correct symbol / code.
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  /** Number of decimal places (most are 2; some like JPY are 0) */
  decimals: number;
  /** Whether the symbol goes before the amount */
  symbolFirst: boolean;
}

/**
 * Map of ISO 4217 currency codes to display metadata.
 * Covers the most widely-used currencies worldwide.
 */
export const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    decimals: 2,
    symbolFirst: true,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    decimals: 2,
    symbolFirst: true,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    decimals: 2,
    symbolFirst: true,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    decimals: 2,
    symbolFirst: true,
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    decimals: 0,
    symbolFirst: true,
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    name: "Canadian Dollar",
    decimals: 2,
    symbolFirst: true,
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    decimals: 2,
    symbolFirst: true,
  },
  SGD: {
    code: "SGD",
    symbol: "S$",
    name: "Singapore Dollar",
    decimals: 2,
    symbolFirst: true,
  },
  AED: {
    code: "AED",
    symbol: "AED",
    name: "UAE Dirham",
    decimals: 2,
    symbolFirst: true,
  },
  SAR: {
    code: "SAR",
    symbol: "SAR",
    name: "Saudi Riyal",
    decimals: 2,
    symbolFirst: true,
  },
  BRL: {
    code: "BRL",
    symbol: "R$",
    name: "Brazilian Real",
    decimals: 2,
    symbolFirst: true,
  },
  CNY: {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan",
    decimals: 2,
    symbolFirst: true,
  },
  KRW: {
    code: "KRW",
    symbol: "₩",
    name: "South Korean Won",
    decimals: 0,
    symbolFirst: true,
  },
  MXN: {
    code: "MXN",
    symbol: "MX$",
    name: "Mexican Peso",
    decimals: 2,
    symbolFirst: true,
  },
  ZAR: {
    code: "ZAR",
    symbol: "R",
    name: "South African Rand",
    decimals: 2,
    symbolFirst: true,
  },
  CHF: {
    code: "CHF",
    symbol: "CHF",
    name: "Swiss Franc",
    decimals: 2,
    symbolFirst: true,
  },
  SEK: {
    code: "SEK",
    symbol: "kr",
    name: "Swedish Krona",
    decimals: 2,
    symbolFirst: false,
  },
  NOK: {
    code: "NOK",
    symbol: "kr",
    name: "Norwegian Krone",
    decimals: 2,
    symbolFirst: false,
  },
  DKK: {
    code: "DKK",
    symbol: "kr",
    name: "Danish Krone",
    decimals: 2,
    symbolFirst: false,
  },
  PLN: {
    code: "PLN",
    symbol: "zł",
    name: "Polish Zloty",
    decimals: 2,
    symbolFirst: false,
  },
  THB: {
    code: "THB",
    symbol: "฿",
    name: "Thai Baht",
    decimals: 2,
    symbolFirst: true,
  },
  IDR: {
    code: "IDR",
    symbol: "Rp",
    name: "Indonesian Rupiah",
    decimals: 0,
    symbolFirst: true,
  },
  MYR: {
    code: "MYR",
    symbol: "RM",
    name: "Malaysian Ringgit",
    decimals: 2,
    symbolFirst: true,
  },
  PHP: {
    code: "PHP",
    symbol: "₱",
    name: "Philippine Peso",
    decimals: 2,
    symbolFirst: true,
  },
  VND: {
    code: "VND",
    symbol: "₫",
    name: "Vietnamese Dong",
    decimals: 0,
    symbolFirst: false,
  },
  TRY: {
    code: "TRY",
    symbol: "₺",
    name: "Turkish Lira",
    decimals: 2,
    symbolFirst: true,
  },
  RUB: {
    code: "RUB",
    symbol: "₽",
    name: "Russian Ruble",
    decimals: 2,
    symbolFirst: false,
  },
  NGN: {
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira",
    decimals: 2,
    symbolFirst: true,
  },
  EGP: {
    code: "EGP",
    symbol: "E£",
    name: "Egyptian Pound",
    decimals: 2,
    symbolFirst: true,
  },
  BDT: {
    code: "BDT",
    symbol: "৳",
    name: "Bangladeshi Taka",
    decimals: 2,
    symbolFirst: true,
  },
  PKR: {
    code: "PKR",
    symbol: "₨",
    name: "Pakistani Rupee",
    decimals: 2,
    symbolFirst: true,
  },
  LKR: {
    code: "LKR",
    symbol: "Rs",
    name: "Sri Lankan Rupee",
    decimals: 2,
    symbolFirst: true,
  },
  NZD: {
    code: "NZD",
    symbol: "NZ$",
    name: "New Zealand Dollar",
    decimals: 2,
    symbolFirst: true,
  },
  HKD: {
    code: "HKD",
    symbol: "HK$",
    name: "Hong Kong Dollar",
    decimals: 2,
    symbolFirst: true,
  },
  TWD: {
    code: "TWD",
    symbol: "NT$",
    name: "Taiwan Dollar",
    decimals: 0,
    symbolFirst: true,
  },
  CLP: {
    code: "CLP",
    symbol: "CL$",
    name: "Chilean Peso",
    decimals: 0,
    symbolFirst: true,
  },
  COP: {
    code: "COP",
    symbol: "CO$",
    name: "Colombian Peso",
    decimals: 0,
    symbolFirst: true,
  },
  ARS: {
    code: "ARS",
    symbol: "AR$",
    name: "Argentine Peso",
    decimals: 2,
    symbolFirst: true,
  },
  PEN: {
    code: "PEN",
    symbol: "S/",
    name: "Peruvian Sol",
    decimals: 2,
    symbolFirst: true,
  },
  KES: {
    code: "KES",
    symbol: "KSh",
    name: "Kenyan Shilling",
    decimals: 2,
    symbolFirst: true,
  },
  GHS: {
    code: "GHS",
    symbol: "GH₵",
    name: "Ghanaian Cedi",
    decimals: 2,
    symbolFirst: true,
  },
  HUF: {
    code: "HUF",
    symbol: "Ft",
    name: "Hungarian Forint",
    decimals: 0,
    symbolFirst: false,
  },
  CZK: {
    code: "CZK",
    symbol: "Kč",
    name: "Czech Koruna",
    decimals: 2,
    symbolFirst: false,
  },
  RON: {
    code: "RON",
    symbol: "lei",
    name: "Romanian Leu",
    decimals: 2,
    symbolFirst: false,
  },
  ILS: {
    code: "ILS",
    symbol: "₪",
    name: "Israeli Shekel",
    decimals: 2,
    symbolFirst: true,
  },
  QAR: {
    code: "QAR",
    symbol: "QR",
    name: "Qatari Riyal",
    decimals: 2,
    symbolFirst: true,
  },
  KWD: {
    code: "KWD",
    symbol: "KD",
    name: "Kuwaiti Dinar",
    decimals: 3,
    symbolFirst: true,
  },
  BHD: {
    code: "BHD",
    symbol: "BD",
    name: "Bahraini Dinar",
    decimals: 3,
    symbolFirst: true,
  },
  OMR: {
    code: "OMR",
    symbol: "OMR",
    name: "Omani Rial",
    decimals: 3,
    symbolFirst: true,
  },
};

/** Default currency when nothing is configured */
export const DEFAULT_CURRENCY = "INR";

/** Sorted list of currencies for the admin selector dropdown */
export const CURRENCY_LIST: CurrencyInfo[] = Object.values(CURRENCY_MAP).sort(
  (a, b) => a.name.localeCompare(b.name),
);

/**
 * Format a numeric price value with the correct currency symbol.
 *
 * @param amount  — The price value (number or string parseable to number)
 * @param currencyCode — ISO 4217 code (e.g. "INR", "USD").
 *                       Falls back to DEFAULT_CURRENCY if not found.
 * @returns A formatted price string, e.g. "₹499.00" or "299.00 kr"
 */
export function formatPrice(
  amount: string | number,
  currencyCode?: string | null,
): string {
  const code = currencyCode?.toUpperCase() || DEFAULT_CURRENCY;
  const info = CURRENCY_MAP[code] ?? CURRENCY_MAP[DEFAULT_CURRENCY];

  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) return `${info.symbol}0`;

  const formatted = num.toFixed(info.decimals);

  if (info.symbolFirst) {
    return `${info.symbol}${formatted}`;
  }
  return `${formatted} ${info.symbol}`;
}

/**
 * Get the currency symbol for a given currency code.
 */
export function getCurrencySymbol(currencyCode?: string | null): string {
  const code = currencyCode?.toUpperCase() || DEFAULT_CURRENCY;
  return (CURRENCY_MAP[code] ?? CURRENCY_MAP[DEFAULT_CURRENCY]).symbol;
}

/**
 * Get the currency info for a given currency code.
 */
export function getCurrencyInfo(
  currencyCode?: string | null,
): CurrencyInfo {
  const code = currencyCode?.toUpperCase() || DEFAULT_CURRENCY;
  return CURRENCY_MAP[code] ?? CURRENCY_MAP[DEFAULT_CURRENCY];
}

/**
 * Convert an amount to the smallest currency unit (e.g. paise for INR, cents for USD).
 * Razorpay expects amounts in the smallest unit.
 */
export function toSmallestUnit(
  amount: number,
  currencyCode?: string | null,
): number {
  const info = getCurrencyInfo(currencyCode);
  return Math.round(amount * Math.pow(10, info.decimals));
}

/**
 * Convert from the smallest currency unit back to the major unit.
 */
export function fromSmallestUnit(
  smallestAmount: number,
  currencyCode?: string | null,
): number {
  const info = getCurrencyInfo(currencyCode);
  return smallestAmount / Math.pow(10, info.decimals);
}
