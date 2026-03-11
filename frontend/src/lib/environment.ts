/**
 * Environment detection utilities for handling in-app browsers (Telegram, etc.)
 * that don't support browser extension wallets like MetaMask.
 */

export function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Telegram|TelegramBot|Instagram|FBAN|FBAV|Twitter|Line|WeChat|MicroMessenger/i.test(
    ua
  );
}

export function isMobileBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function isTelegramBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /Telegram/i.test(navigator.userAgent) ||
    !!(window as any).TelegramWebviewProxy
  );
}
