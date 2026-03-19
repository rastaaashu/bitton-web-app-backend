"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { clsx } from "clsx";
import { TxButton } from "@/components/ui/TxButton";
import { useWithdrawableBalance, useWithdrawableInUSDC } from "@/hooks/useContracts";
import { useWithdrawAsBTN, useWithdrawAsUSDC } from "@/hooks/useContractWrite";
import { formatBTN, parseBTN } from "@/lib/format";
import { useCurrency } from "@/contexts/CurrencyContext";
import { BTN_PRICE_USD } from "@/config/constants";

export default function WithdrawPage() {
  const { isConnected } = useAccount();
  const {
    data: withdrawable,
    isLoading,
    refetch,
  } = useWithdrawableBalance();
  const { data: withdrawableUSDC } = useWithdrawableInUSDC();
  const { formatAmount, label: currLabel } = useCurrency();
  const withdrawBTNHook = useWithdrawAsBTN();
  const withdrawUSDCHook = useWithdrawAsUSDC();

  const [amount, setAmount] = useState("");
  const [withdrawMode, setWithdrawMode] = useState<"BTN" | "USDC">("USDC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const parsedAmount = parseBTN(amount);
  const balance = (withdrawable as bigint) || 0n;
  const balanceUSDC = (withdrawableUSDC as bigint) || 0n;
  const hasBalance = balance > 0n;
  const isValidAmount = parsedAmount > 0n && parsedAmount <= balance;

  const activeHook = withdrawMode === "BTN" ? withdrawBTNHook : withdrawUSDCHook;

  useEffect(() => {
    if (activeHook.isSuccess) {
      refetch();
      setAmount("");
    }
  }, [activeHook.isSuccess, refetch]);

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Withdrawal Wallet</h2>
        <p className="text-gray-400">
          Connect your wallet to withdraw.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Withdrawal Wallet</h2>
      <p className="text-gray-400 text-sm mb-6">
        Withdraw your available rewards. Choose to receive in USDC or BTN.
        Balance comes from reward settlements and vesting releases.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-lg">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-1">Balance ({currLabel})</p>
          {isLoading ? (
            <div className="h-8 w-32 bg-gray-800 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold">
              {formatAmount(balance)} <span className="text-gray-500">{currLabel}</span>
            </p>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-1">Equivalent (USDC)</p>
          {isLoading ? (
            <div className="h-8 w-32 bg-gray-800 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold">
              {formatAmount(balanceUSDC)} <span className="text-gray-500">USDC</span>
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">@ ${BTN_PRICE_USD}/BTN</p>
        </div>
      </div>

      <div className="max-w-md">
        {/* Withdraw Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setWithdrawMode("USDC")}
            className={clsx(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              withdrawMode === "USDC"
                ? "bg-green-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            )}
          >
            Withdraw as USDC
          </button>
          <button
            onClick={() => setWithdrawMode("BTN")}
            className={clsx(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              withdrawMode === "BTN"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            )}
          >
            Withdraw as BTN
          </button>
        </div>

        <div className="relative mb-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder={`Amount in BTN (withdraws as ${withdrawMode})`}
            value={amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "");
              const parts = val.split('.');
              if (parts[1] && parts[1].length > 6) return;
              setAmount(val);
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white pr-16"
          />
          <button
            onClick={() =>
              setAmount(formatBTN(balance).replace(/,/g, ""))
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-400 hover:text-brand-300"
          >
            MAX
          </button>
        </div>

        {withdrawMode === "USDC" && parsedAmount > 0n && (
          <p className="text-xs text-gray-400 mb-2">
            You will receive ~{(parseFloat(amount || "0") * BTN_PRICE_USD).toFixed(2)} USDC
          </p>
        )}

        {parsedAmount > balance && (
          <p className="text-xs text-red-400 mb-2">
            Amount exceeds your withdrawable balance.
          </p>
        )}

        <TxButton
          label={`Withdraw as ${withdrawMode}`}
          pendingLabel="Withdrawing..."
          successLabel="Withdrawn!"
          onClick={() => {
            if (isSubmitting) return;
            setIsSubmitting(true);
            try {
              activeHook.withdraw(parsedAmount);
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={!isValidAmount || isSubmitting}
          isPending={activeHook.isPending}
          isSuccess={activeHook.isSuccess}
          isError={activeHook.isError}
          hash={activeHook.hash}
          className="w-full"
        />

        <p className="text-xs text-gray-500 mt-3">
          {withdrawMode === "USDC"
            ? "USDC will be sent directly to your wallet at the platform BTN price."
            : "BTN tokens will be transferred directly to your connected wallet."}
        </p>
      </div>
    </div>
  );
}
