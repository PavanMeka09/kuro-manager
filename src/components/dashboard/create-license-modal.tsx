"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, AlertCircle } from "lucide-react";
import { createLicense } from "@/actions/licenses";

interface CreateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLicenseModal({ isOpen, onClose, onSuccess }: CreateLicenseModalProps) {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [initialCredits, setInitialCredits] = useState<number>(50);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRandomKey = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setRegistrationNumber(`KURO-${randomSuffix}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await createLicense({
        registrationNumber,
        initialCredits: Number(initialCredits) || 0,
        notes,
      });

      if (!result.success) {
        setError(result.error || "Failed to create registration");
        setIsLoading(false);
      } else {
        setRegistrationNumber("");
        setInitialCredits(50);
        setNotes("");
        setIsLoading(false);
        onSuccess();
      }
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred while creating registration.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Registration"
      description="Add a new client registration number with an initial credit balance for EXE authorization."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Registration Number
            </label>
            <button
              type="button"
              onClick={generateRandomKey}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Sparkles className="h-3 w-3" />
              Generate
            </button>
          </div>
          <Input
            required
            placeholder="e.g. KURO-1001"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
            className="font-mono text-white tracking-wider"
          />
          <p className="text-[11px] text-zinc-400 mt-1">
            Must be unique. This is the exact key queried by the EXE client via POST /api/authorize.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Initial Credits
          </label>
          <Input
            type="number"
            min={0}
            step={1}
            required
            value={initialCredits}
            onChange={(e) => setInitialCredits(Math.max(0, parseInt(e.target.value) || 0))}
            className="font-mono text-white"
          />
          <p className="text-[11px] text-zinc-400 mt-1">
            Credits will be immediately available to the client upon creation.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Notes / Client Identifier (Optional)
          </label>
          <Input
            placeholder="e.g. Machine ID, Workstation name, or Client branch"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-white placeholder:text-zinc-600"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Registration
          </Button>
        </div>
      </form>
    </Modal>
  );
}
