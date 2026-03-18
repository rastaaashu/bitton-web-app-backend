"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { t as translate } from "@/i18n/translations";

export type LangCode =
  | "en" | "zh-CN" | "zh-TW" | "es" | "fr" | "de"
  | "ru" | "ko" | "ja" | "ar" | "pt" | "hi";

interface Language {
  code: LangCode;
  label: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en",    label: "English",    flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "zh-CN", label: "\u7B80\u4F53\u4E2D\u6587", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "zh-TW", label: "\u7E41\u9AD4\u4E2D\u6587", flag: "\u{1F1F9}\u{1F1FC}" },
  { code: "es",    label: "Espa\u00F1ol",    flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "fr",    label: "Fran\u00E7ais",   flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "de",    label: "Deutsch",    flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "ru",    label: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "ko",    label: "\uD55C\uAD6D\uC5B4", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "ja",    label: "\u65E5\u672C\u8A9E", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "ar",    label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "pt",    label: "Portugu\u00EAs",  flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "hi",    label: "\u0939\u093F\u0928\u094D\u0926\u0940", flag: "\u{1F1EE}\u{1F1F3}" },
];

interface LanguageContextType {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  current: Language;
  t: (key: string) => string;
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

  const t = useCallback((key: string) => translate(key, lang), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, current, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
