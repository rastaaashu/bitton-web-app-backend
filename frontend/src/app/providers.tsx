"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { config } from "@/config/wagmi";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "sonner";
import { useState } from "react";
import { baseSepolia } from "wagmi/chains";

import "@rainbow-me/rainbowkit/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme()}
          initialChain={baseSepolia}
          modalSize="compact"
          appInfo={{
            appName: "BitTON.AI",
          }}
        >
          <AuthProvider>
            <LanguageProvider>
              <CurrencyProvider>
                {children}
                <Toaster theme="dark" position="top-right" richColors />
              </CurrencyProvider>
            </LanguageProvider>
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
