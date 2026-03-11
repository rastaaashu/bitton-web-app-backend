"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "wagmi";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isConnected } = useAccount();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isConnected)) {
      setRedirecting(true);

      // Store a message so the login page can optionally display it
      if (typeof window !== "undefined") {
        const reason = !isAuthenticated
          ? "session_expired"
          : "wallet_disconnected";
        sessionStorage.setItem("bitton_redirect_reason", reason);
      }

      // Small delay so the user sees the message before redirect
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isConnected, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (redirecting || !isAuthenticated || !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="text-yellow-400 text-sm font-medium">
          {!isAuthenticated
            ? "Your session has expired. Redirecting to login..."
            : "Wallet disconnected. Redirecting to login..."}
        </div>
        <div className="text-gray-500 text-xs">
          Please reconnect your wallet to continue.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
