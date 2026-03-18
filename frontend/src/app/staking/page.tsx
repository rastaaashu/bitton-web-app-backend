"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { clsx } from "clsx";
import { CONTRACTS } from "@/config/contracts";
import { PROGRAM_CONFIGS, BTN_PRICE_USD } from "@/config/constants";
import {
  useUSDCBalance,
  useVaultStatus,
  useStakes,
  useAllowance,
} from "@/hooks/useContracts";
import { useApproveToken, useStakeUSDC, useUnstake } from "@/hooks/useContractWrite";
import { formatBTN, parseBTN, formatDate, formatCountdown, tierName } from "@/lib/format";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TxButton } from "@/components/ui/TxButton";
import { Modal } from "@/components/ui/Modal";
import type { StakeInfo } from "@/types";

export default function StakingPage() {
  const { isConnected, address } = useAccount();
  const { data: usdcBalance } = useUSDCBalance();
  const { isActive, tier } = useVaultStatus();
  const { data: stakesRaw, isLoading: stakesLoading, refetch: refetchStakes } = useStakes();
  const { formatAmount, label: currLabel } = useCurrency();
  const stakes = (stakesRaw as StakeInfo[] | undefined) || [];

  const [amount, setAmount] = useState("");
  const [programType, setProgramType] = useState<0 | 1 | 2>(0);
  const [step, setStep] = useState<"idle" | "approve" | "stake">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Unstake modal
  const [unstakeIndex, setUnstakeIndex] = useState<number | null>(null);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);

  const approveHook = useApproveToken();
  const stakeHook = useStakeUSDC();
  const unstakeHook = useUnstake();

  const parsedAmount = parseBTN(amount); // works for USDC too (6 decimals)
  const { data: allowance, refetch: refetchAllowance } = useAllowance(
    CONTRACTS.usdcToken,
    CONTRACTS.stakingVault
  );

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  // Step machine
  useEffect(() => {
    if (step === "approve" && parsedAmount > 0n) {
      const currentAllowance = (allowance as bigint) || 0n;
      if (currentAllowance >= parsedAmount) {
        setStep("stake");
      }
    }
  }, [allowance, step, parsedAmount]);

  useEffect(() => {
    if (approveHook.isSuccess) refetchAllowance();
  }, [approveHook.isSuccess, refetchAllowance]);

  useEffect(() => {
    if (stakeHook.isSuccess) {
      refetchStakes();
      setStep("idle");
      setAmount("");
      stakeHook.reset();
    }
  }, [stakeHook.isSuccess, refetchStakes]);

  useEffect(() => {
    if (unstakeHook.isSuccess) {
      refetchStakes();
      setShowUnstakeModal(false);
      setUnstakeIndex(null);
      unstakeHook.reset();
    }
  }, [unstakeHook.isSuccess, refetchStakes]);

  const handleStartStake = () => {
    if (isSubmitting) return;
    if (parsedAmount <= 0n) return;
    setIsSubmitting(true);
    try {
      const currentAllowance = (allowance as bigint) || 0n;
      if (currentAllowance >= parsedAmount) {
        setStep("stake");
      } else {
        setStep("approve");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estimate rewards
  const config = PROGRAM_CONFIGS[programType];
  const amountNum = parseFloat(amount || "0");
  const btnEquivalent = amountNum / BTN_PRICE_USD;
  const dailyRewardBTN = btnEquivalent * config.dailyRateBps / 10_000;
  const dailyRewardUSD = dailyRewardBTN * BTN_PRICE_USD;
  const weeklyRewardUSD = dailyRewardUSD * 7;
  const cycleRewardPct = (config.dailyRateBps / 100) * config.lockDays;

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Staking</h2>
        <p className="text-gray-400">Connect your wallet to stake.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Staking</h2>
      <p className="text-gray-400 text-sm mb-6">
        Stake USDC to earn dual-channel rewards. Choose from Flex 30, Boost 180, or Max 360 products.
      </p>

      {!isActive && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 mb-6">
          <p className="text-yellow-300 text-sm">
            You need to activate a vault before you can stake.{" "}
            <a href="/vault" className="underline">
              Go to Vault
            </a>
          </p>
        </div>
      )}

      {/* Stake Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">New Stake</h3>

          {/* Program Toggle — 3 Products */}
          <div className="flex gap-2 mb-4">
            {([0, 1, 2] as const).map((pt) => {
              const c = PROGRAM_CONFIGS[pt];
              return (
                <button
                  key={pt}
                  onClick={() => setProgramType(pt)}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                    programType === pt
                      ? pt === 0
                        ? "bg-blue-600 text-white"
                        : pt === 1
                        ? "bg-purple-600 text-white"
                        : "bg-amber-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          {/* Amount Input */}
          <div className="relative mb-4">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Amount (USDC)"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setAmount(val);
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white pr-20"
            />
            <button
              onClick={() => {
                const bal = usdcBalance as bigint | undefined;
                if (bal) setAmount(formatBTN(bal).replace(/,/g, ""));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-400 hover:text-brand-300"
            >
              MAX
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Balance: {formatBTN(usdcBalance as bigint | undefined)} USDC
          </p>

          {/* Estimates */}
          <div className="bg-gray-800/50 rounded-lg p-3 mb-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Product</span>
              <span className="text-white font-medium">{config.fullName}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Duration</span>
              <span>{config.lockDays} days</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Daily Rate</span>
              <span>{config.dailyRatePercent}%</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Est. Cycle Return</span>
              <span className="text-green-400">~{cycleRewardPct.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Est. Weekly Reward</span>
              <span className="text-green-400">~${weeklyRewardUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400 pt-1 border-t border-gray-700">
              <span>Reward Split</span>
              <span>
                {config.liquidSplitPct}% liquid / {config.vestedSplitPct}% vested
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Principal</span>
              <span>{config.principalReturned ? "Returned at end" : "Distributed in rewards"}</span>
            </div>
            {config.earlyExitAllowed && (
              <div className="flex justify-between text-yellow-400 text-xs pt-1 border-t border-gray-700">
                <span>Early Exit Penalty</span>
                <span>{config.earlyExitPenaltyBps / 100}%</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {step === "idle" && (
            <button
              onClick={handleStartStake}
              disabled={!isActive || parsedAmount <= 0n || isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              Stake USDC into {config.name}
            </button>
          )}

          {step === "approve" && (
            <TxButton
              label={`Approve ${amount} USDC`}
              pendingLabel="Approving..."
              onClick={() => {
                if (isSubmitting) return;
                setIsSubmitting(true);
                try {
                  approveHook.approve(
                    CONTRACTS.usdcToken,
                    CONTRACTS.stakingVault,
                    parsedAmount
                  );
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              isPending={approveHook.isPending}
              isSuccess={approveHook.isSuccess}
              isError={approveHook.isError}
              hash={approveHook.hash}
              className="w-full"
            />
          )}

          {step === "stake" && (
            <TxButton
              label={`Confirm Stake`}
              pendingLabel="Staking..."
              onClick={() => {
                if (isSubmitting) return;
                setIsSubmitting(true);
                try {
                  stakeHook.stake(parsedAmount, programType);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              isPending={stakeHook.isPending}
              isSuccess={stakeHook.isSuccess}
              isError={stakeHook.isError}
              hash={stakeHook.hash}
              successLabel="Staked!"
              className="w-full"
            />
          )}

          {step !== "idle" && (
            <button
              onClick={() => {
                setStep("idle");
                approveHook.reset();
                stakeHook.reset();
              }}
              className="w-full mt-2 text-sm text-gray-500 hover:text-gray-300"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Info Panel — 3 Products */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Product Details</h3>
          <div className="space-y-4">
            {([0, 1, 2] as const).map((pt) => {
              const c = PROGRAM_CONFIGS[pt];
              return (
                <div
                  key={pt}
                  className={clsx(
                    "p-4 rounded-lg border",
                    pt === programType
                      ? "border-brand-600/50 bg-brand-600/5"
                      : "border-gray-800"
                  )}
                >
                  <h4 className="font-medium mb-2">{c.fullName}</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>Duration: {c.lockDays} days</li>
                    <li>Daily Rate: {c.dailyRatePercent}% ({c.aprEstimate} APR)</li>
                    <li>Reward Split: {c.liquidSplitPct}% liquid / {c.vestedSplitPct}% vested</li>
                    <li>Vesting: {c.vestingType === "short" ? "30d freeze + 60d linear" : "180d freeze + 180d linear"}</li>
                    <li>Principal: {c.principalReturned ? "Returned" : "Distributed in rewards"}</li>
                    <li>
                      Early Exit:{" "}
                      {c.earlyExitAllowed
                        ? `Allowed (${c.earlyExitPenaltyBps / 100}% penalty → Reserve Fund)`
                        : "Not allowed"}
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Stakes Table */}
      <h3 className="text-lg font-bold mb-4">Your Stakes</h3>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        {stakesLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : stakes.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            No stakes yet. Create one above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Started</th>
                <th className="text-left px-4 py-3 font-medium">Time Left</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {stakes.map((stake, index) => {
                const c =
                  PROGRAM_CONFIGS[stake.programType as 0 | 1 | 2] ||
                  PROGRAM_CONFIGS[0];
                const lockEnd = Number(stake.startTime) + c.lockSeconds;
                const remaining = lockEnd - now;
                const tokenLabel = stake.isUSDC ? "USDC" : "BTN";

                return (
                  <tr
                    key={index}
                    className={clsx(
                      "border-b border-gray-800/50",
                      !stake.active && "opacity-50"
                    )}
                  >
                    <td className="px-4 py-3 text-gray-500">{index}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          stake.programType === 0
                            ? "text-blue-400"
                            : stake.programType === 1
                            ? "text-purple-400"
                            : "text-amber-400"
                        }
                      >
                        {c.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {stake.isUSDC ? formatBTN(stake.amount) : formatAmount(stake.amount)} {stake.isUSDC ? "USDC" : currLabel}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatDate(stake.startTime)}
                    </td>
                    <td className="px-4 py-3">
                      {stake.active ? (
                        <span
                          className={
                            remaining <= 0
                              ? "text-green-400"
                              : "text-yellow-400"
                          }
                        >
                          {formatCountdown(remaining)}
                        </span>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded text-xs",
                          stake.active
                            ? "bg-green-900/50 text-green-400"
                            : "bg-gray-800 text-gray-500"
                        )}
                      >
                        {stake.active ? "Active" : "Closed"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {stake.active && (
                        <button
                          onClick={() => {
                            setUnstakeIndex(index);
                            setShowUnstakeModal(true);
                          }}
                          className="text-red-400 hover:text-red-300 text-xs font-medium"
                        >
                          Unstake
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Unstake Confirmation Modal */}
      <Modal
        open={showUnstakeModal}
        onClose={() => {
          setShowUnstakeModal(false);
          setUnstakeIndex(null);
          unstakeHook.reset();
        }}
        title="Confirm Unstake"
      >
        {unstakeIndex !== null && stakes[unstakeIndex] && (
          <div>
            {(() => {
              const s = stakes[unstakeIndex];
              const c =
                PROGRAM_CONFIGS[s.programType as 0 | 1 | 2] || PROGRAM_CONFIGS[0];
              const lockEnd = Number(s.startTime) + c.lockSeconds;
              const isEarlyExit = now < lockEnd;
              const tokenLabel = s.isUSDC ? "USDC" : "BTN";

              return (
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stake Amount</span>
                      <span>{s.isUSDC ? formatBTN(s.amount) : formatAmount(s.amount)} {s.isUSDC ? "USDC" : currLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Product</span>
                      <span>{c.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Principal</span>
                      <span>{c.principalReturned ? "Returned to you" : "Sent to treasury"}</span>
                    </div>
                    {isEarlyExit && c.earlyExitAllowed && (
                      <div className="flex justify-between text-yellow-400">
                        <span>Early Exit Penalty (15%)</span>
                        <span>
                          -{s.isUSDC ? formatBTN((s.amount * 15n) / 100n) : formatAmount((s.amount * 15n) / 100n)} {s.isUSDC ? "USDC" : currLabel}
                        </span>
                      </div>
                    )}
                    {isEarlyExit && !c.earlyExitAllowed && (
                      <p className="text-red-400 text-xs">
                        This product cannot be exited early. Lock period has not ended.
                      </p>
                    )}
                  </div>

                  {isEarlyExit && c.earlyExitAllowed && (
                    <p className="text-yellow-400 text-xs">
                      Warning: Early exit incurs a 15% penalty. Penalty goes to the Reserve Fund.
                    </p>
                  )}

                  {(!isEarlyExit || c.earlyExitAllowed) && (
                    <TxButton
                      label="Confirm Unstake"
                      pendingLabel="Unstaking..."
                      onClick={() => unstakeHook.unstake(unstakeIndex)}
                      isPending={unstakeHook.isPending}
                      isSuccess={unstakeHook.isSuccess}
                      isError={unstakeHook.isError}
                      hash={unstakeHook.hash}
                      variant="danger"
                      className="w-full"
                    />
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
