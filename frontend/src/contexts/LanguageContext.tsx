"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type LangCode =
  | "en" | "zh-CN" | "zh-TW" | "es" | "fr" | "de"
  | "ru" | "ko" | "ja" | "ar" | "pt" | "hi";

interface Language {
  code: LangCode;
  label: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en",    label: "English",    flag: "🇬🇧" },
  { code: "zh-CN", label: "简体中文",     flag: "🇨🇳" },
  { code: "zh-TW", label: "繁體中文",     flag: "🇹🇼" },
  { code: "es",    label: "Español",    flag: "🇪🇸" },
  { code: "fr",    label: "Français",   flag: "🇫🇷" },
  { code: "de",    label: "Deutsch",    flag: "🇩🇪" },
  { code: "ru",    label: "Русский",    flag: "🇷🇺" },
  { code: "ko",    label: "한국어",      flag: "🇰🇷" },
  { code: "ja",    label: "日本語",      flag: "🇯🇵" },
  { code: "ar",    label: "العربية",     flag: "🇸🇦" },
  { code: "pt",    label: "Português",  flag: "🇧🇷" },
  { code: "hi",    label: "हिन्दी",       flag: "🇮🇳" },
];

interface LanguageContextType {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  current: Language;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "bitton_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(STORAGE_KEY) as LangCode) || "en";
    }
    return "en";
  });

  const setLang = useCallback((code: LangCode) => {
    setLangState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ lang, setLang, current }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
