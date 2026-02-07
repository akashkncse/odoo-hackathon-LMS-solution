"use client";

import { useState, useEffect, useCallback } from "react";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  KRW: "₩",
  RUB: "₽",
  TRY: "₺",
  BRL: "R$",
  ZAR: "R",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  HKD: "HK$",
  NZD: "NZ$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  CHF: "CHF",
  MXN: "MX$",
  THB: "฿",
  IDR: "Rp",
  MYR: "RM",
  PHP: "₱",
  PLN: "zł",
  AED: "د.إ",
  SAR: "﷼",
  CLP: "CL$",
  COP: "COL$",
  ARS: "AR$",
  EGP: "E£",
  NGN: "₦",
  KES: "KSh",
  BDT: "৳",
  PKR: "₨",
  LKR: "Rs",
  NPR: "₨",
  VND: "₫",
  TWD: "NT$",
  ILS: "₪",
  HUF: "Ft",
  CZK: "Kč",
  RON: "lei",
  BGN: "лв",
  HRK: "kn",
  UAH: "₴",
  GEL: "₾",
  PEN: "S/.",
};

const DEFAULT_CURRENCY = "INR";

function getSymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
}

function formatPriceValue(
  amount: string | number,
  currency: string,
): string {
  const code = (currency || DEFAULT_CURRENCY).toUpperCase();
  const symbol = getSymbol(code);
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${symbol}0.00`;

  // For JPY and KRW, no decimal places
  const noDecimalCurrencies = ["JPY", "KRW", "VND", "CLP"];
  const decimals = noDecimalCurrencies.includes(code) ? 0 : 2;

  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol}${formatted}`;
}

interface CurrencyData {
  currency: string;
  currencySymbol: string;
  formatPrice: (amount: string | number) => string;
}

// Module-level cache so the fetch only happens once across all components
let cachedCurrency: string | null = null;
let currencyFetchPromise: Promise<string> | null = null;

async function fetchCurrency(): Promise<string> {
  try {
    const res = await fetch("/api/site-settings");
    if (res.ok) {
      const data = await res.json();
      return data.settings?.currency || DEFAULT_CURRENCY;
    }
  } catch {
    // Silently fall back to default
  }
  return DEFAULT_CURRENCY;
}

export function useCurrency(): CurrencyData & { loading: boolean } {
  const [currency, setCurrency] = useState<string>(
    () => cachedCurrency ?? DEFAULT_CURRENCY,
  );
  const [loading, setLoading] = useState(() => !cachedCurrency);

  const load = useCallback(() => {
    if (cachedCurrency) return;

    // Deduplicate concurrent fetches
    if (!currencyFetchPromise) {
      currencyFetchPromise = fetchCurrency();
    }

    let cancelled = false;

    currencyFetchPromise.then((result) => {
      if (cancelled) return;
      cachedCurrency = result;
      setCurrency(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const currencySymbol = getSymbol(currency);

  const formatPrice = useCallback(
    (amount: string | number) => formatPriceValue(amount, currency),
    [currency],
  );

  return { currency, currencySymbol, formatPrice, loading };
}

/**
 * Invalidate the cached currency so the next call to useCurrency()
 * will re-fetch from the server. Useful after the admin saves new settings.
 */
export function invalidateCurrencyCache() {
  cachedCurrency = null;
  currencyFetchPromise = null;
}

/**
 * Static helper for server-side or non-hook contexts.
 * If you already know the currency code, use this directly.
 */
export { formatPriceValue as formatPriceStatic, getSymbol, CURRENCY_SYMBOLS, DEFAULT_CURRENCY };
