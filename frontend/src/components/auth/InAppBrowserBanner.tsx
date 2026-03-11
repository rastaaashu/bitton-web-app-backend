"use client";

import { useState, useEffect } from "react";
import { isInAppBrowser } from "@/lib/environment";

export function InAppBrowserBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShowBanner(isInAppBrowser());
  }, []);

  if (!showBanner) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silent fail
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
      <p className="text-yellow-400 text-sm font-medium mb-2">
        In-app browser detected
      </p>
      <p className="text-yellow-400/70 text-xs mb-2">
        For the best wallet experience, open this page in your phone&apos;s
        browser. Tap the menu (&bull;&bull;&bull;) and select &quot;Open in
        Browser&quot;.
      </p>
      <p className="text-yellow-400/70 text-xs mb-3">
        Or use WalletConnect below to connect your wallet directly.
      </p>
      <button
        onClick={handleCopyUrl}
        className="w-full text-xs bg-yellow-700/40 hover:bg-yellow-700/60 text-yellow-300 py-2 px-3 rounded-md transition-colors"
      >
        {copied ? "URL copied! Paste in your browser" : "Copy URL to open in external browser"}
      </button>
    </div>
  );
}
