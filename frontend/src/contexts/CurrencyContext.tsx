"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { BTN_PRICE_USD } from "@/config/constants";
import { BTN_DECIMALS } from "@/config/contracts";

type Currency = "BTN" | "USD";

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  /** Format a bigint BTN amount in the active currency */
  formatAmount: (amount: bigint | undefined | null) => string;
  /** The active currency label (BTN or USD) */
  label: string;
  /** The symbol prefix for display */
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "bitton_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(STORAGE_KEY) as Currency) || "BTN";
    }
    return "BTN";
  });

  const toggleCurrency = useCallback(() => {
    setCurrency((prev) => {
      const next = prev === "BTN" ? "USD" : "BTN";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const formatAmount = useCallback(
    (amount: bigint | undefined | null): string => {
      if (amount === undefined || amount === null) return currency === "USD" ? "$0.00" : "0.00";
      const divisor = BigInt(10 ** BTN_DECIMALS);
      const whole = amount / divisor;
      const fraction = amount % divisor;
      const absFraction = fraction < 0n ? -fraction : fraction;
      const fractionStr = absFraction.toString().padStart(BTN_DECIMALS, "0");
      const btnValue = `${whole.toLocaleString()}.${fractionStr.slice(0, 2)}`;

      if (currency === "BTN") return btnValue;

      // Convert to USD
      const numericBTN = Number(whole) + Number(absFraction) / 10 ** BTN_DECIMALS;
      const usdValue = numericBTN * BTN_PRICE_USD;
      return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        toggleCurrency,
        formatAmount,
        label: currency === "BTN" ? "BTN" : "USD",
        symbol: currency === "BTN" ? "" : "$",
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
