"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Equal, AlertCircle, Coins } from "lucide-react";
import { adjustCredits } from "@/actions/licenses";
import { formatNumber } from "@/lib/utils";

interface AdjustCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: {
    id: string;
    registrationNumber: string;
    creditsRemaining: number;
  } | null;
  onSuccess: () => void;
}

export function AdjustCreditsModal({
  isOpen,
  onClose,
  license,
  onSuccess,
}: AdjustCreditsModalProps) {
  const [mode, setMode] = useState<"add" | "deduct" | "set">("add");
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!license) return null;

  const currentCredits = license.creditsRemaining;
  let simulatedBalance = currentCredits;
  if (mode === "add") simulatedBalance = currentCredits + (Number(amount) || 0);
  if (mode === "deduct") simulatedBalance = Math.max(0, currentCredits - (Number(amount) || 0));
  if (mode === "set") simulatedBalance = Math.max(0, Number(amount) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Please provide a reason for the credit adjustment audit log.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await adjustCredits({
        licenseId: license.id,
        mode,
        amount: Number(amount) || 0,
        reason: reason.trim(),
      });

      if (!result.success) {
        setError(result.error || "Failed to adjust credits");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setReason("");
        onSuccess();
      }
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred while modifying credits.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Credits: ${license.registrationNumber}`}
      description="Update credit allocation with mandatory audit logging."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Balance Display */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Coins className="h-4 w-4 text-amber-400" />
            Current Balance:
          </div>
          <div className="font-mono text-base font-bold text-white">
            {formatNumber(currentCredits)} credits
          </div>
        </div>

        {/* Adjustment Mode Selector */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-2">Adjustment Action</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode("add")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                mode === "add"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              Add (+)
            </button>
            <button
              type="button"
              onClick={() => setMode("deduct")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                mode === "deduct"
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Minus className="h-3.5 w-3.5" />
              Deduct (-)
            </button>
            <button
              type="button"
              onClick={() => setMode("set")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                mode === "set"
                  ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Equal className="h-3.5 w-3.5" />
              Set Exact (=)
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            {mode === "set" ? "New Total Balance" : "Credit Amount"}
          </label>
          <Input
            type="number"
            min={0}
            step={1}
            required
            value={amount}
            onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
            className="font-mono text-white text-base"
          />
        </div>

        {/* Audit Reason */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Audit Reason <span className="text-red-400">*</span>
          </label>
          <Input
            required
            placeholder="e.g. Monthly refill, Promotional bonus, Billing correction"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-white placeholder:text-zinc-600"
          />
          <p className="text-[11px] text-zinc-400 mt-1">
            This reason will be recorded permanently in the credit transactions audit log.
          </p>
        </div>

        {/* Calculated Preview */}
        <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/40 flex items-center justify-between text-xs">
          <span className="text-zinc-400">Resulting Balance:</span>
          <span className="font-mono font-bold text-amber-300 text-sm">
            {formatNumber(simulatedBalance)} credits
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Confirm Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
