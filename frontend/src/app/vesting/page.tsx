"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { StatCard } from "@/components/ui/StatCard";
import { TxButton } from "@/components/ui/TxButton";
import { useVestedBalance } from "@/hooks/useContracts";
import { useReleaseVesting } from "@/hooks/useContractWrite";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function VestingPage() {
  const { isConnected, address } = useAccount();
  const {
    vestedBalance,
    pendingRelease,
    depositCount,
    isLoading,
    refetch,
  } = useVestedBalance();
  const { formatAmount, label: currLabel } = useCurrency();
  const releaseHook = useReleaseVesting();

  useEffect(() => {
    if (releaseHook.isSuccess) {
      refetch();
    }
  }, [releaseHook.isSuccess, refetch]);

  const hasReleasable = (pendingRelease || 0n) > 0n;

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Vesting Pool</h2>
        <p className="text-gray-400">Connect your wallet to view vesting.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Vesting Pool</h2>
      <p className="text-gray-400 text-sm mb-6">
        Vested rewards follow a freeze + linear unlock schedule.
        Released tokens go to your Withdrawal Wallet.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Vested (Locked)"
          value={`${formatAmount(vestedBalance)} ${currLabel}`}
          loading={isLoading}
        />
        <StatCard
          label="Available to Release"
          value={`${formatAmount(pendingRelease)} ${currLabel}`}
          loading={isLoading}
          valueClassName={hasReleasable ? "text-green-400" : undefined}
        />
        <StatCard
          label="Vesting Deposits"
          value={`${Number(depositCount || 0n)}`}
          loading={isLoading}
          subtitle="Each with its own schedule"
        />
      </div>

      {/* Vesting Schedule Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 max-w-lg">
        <h3 className="font-bold mb-3">Vesting Schedules</h3>
        <div className="space-y-3 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="font-medium text-blue-400 mb-1">Short Vesting (Flex 30 rewards)</p>
            <p className="text-gray-400">30-day freeze period, then 60-day linear unlock</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="font-medium text-purple-400 mb-1">Long Vesting (Boost 180 / Max 360 rewards)</p>
            <p className="text-gray-400">180-day freeze period, then 180-day linear unlock</p>
          </div>
        </div>
      </div>

      {/* Release Progress */}
      {vestedBalance && vestedBalance > 0n && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 max-w-lg">
          <h3 className="font-bold mb-3">Release Progress</h3>
          <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(
                  Number(((pendingRelease || 0n) * 10000n) / vestedBalance) / 100,
                  100
                )}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatAmount(pendingRelease)} available</span>
            <span>{formatAmount(vestedBalance)} locked</span>
          </div>
        </div>
      )}

      <TxButton
        label="Release Vested Tokens"
        pendingLabel="Releasing..."
        successLabel="Tokens Released!"
        onClick={() => address && releaseHook.release(address)}
        disabled={!hasReleasable}
        isPending={releaseHook.isPending}
        isSuccess={releaseHook.isSuccess}
        isError={releaseHook.isError}
        hash={releaseHook.hash}
      />

      <p className="text-xs text-gray-500 mt-2">
        Released tokens are sent to your Withdrawal Wallet where you can
        withdraw them as USDC or BTN.
      </p>
    </div>
  );
}
