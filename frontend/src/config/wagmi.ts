import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia, base } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "BitTON.AI",
  appDescription: "BitTON.AI Staking & Rewards Platform",
  appUrl: "https://bitton-contracts.vercel.app",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [baseSepolia, base],
  ssr: true,
});
