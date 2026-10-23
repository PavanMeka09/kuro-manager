"use client";

import { useState, useTransition } from "react";
import { 
  KeyRound, 
  Search, 
  Plus, 
  Coins, 
  Power, 
  Trash2, 
  History, 
  Copy, 
  Check, 
  Filter,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatDate, formatNumber } from "@/lib/utils";
import { toggleLicenseStatus, deleteLicense } from "@/actions/licenses";
import { CreateLicenseModal } from "./create-license-modal";
import { AdjustCreditsModal } from "./adjust-credits-modal";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface License {
  id: string;
  registrationNumber: string;
  creditsRemaining: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface LicensesClientProps {
  initialLicenses: License[];
  initialQuery?: string;
}

export function LicensesClient({ initialLicenses, initialQuery = "" }: LicensesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLicenseForCredits, setSelectedLicenseForCredits] = useState<License | null>(null);
  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter licenses locally for instantaneous response
  const filteredLicenses = initialLicenses.filter((lic) => {
    const matchesSearch =
      search.trim() === "" ||
      lic.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (lic.notes && lic.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || lic.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleStatus = async (licenseId: string) => {
    startTransition(async () => {
      await toggleLicenseStatus(licenseId);
      router.refresh();
    });
  };

  const handleDeleteConfirm = async () => {
    if (!licenseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLicense(licenseToDelete.id);
      setLicenseToDelete(null);
      setIsDeleting(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-indigo-400" />
            Registration Management
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Authorize EXE clients, control status, and manage remaining credits.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Registration
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#11131c] p-3 rounded-xl border border-zinc-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by registration number or note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900/90 border-zinc-700/80 text-white placeholder:text-zinc-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All ({initialLicenses.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "active"
                ? "bg-emerald-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Active ({initialLicenses.filter((l) => l.status === "active").length})
          </button>
          <button
            onClick={() => setStatusFilter("disabled")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "disabled"
                ? "bg-rose-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Disabled ({initialLicenses.filter((l) => l.status === "disabled").length})
          </button>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="rounded-xl border border-zinc-800 bg-[#11131c]/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-[#161824] text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Registration Number</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Credits Remaining</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4">Created / Modified</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <KeyRound className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
                    <p className="text-sm font-medium text-zinc-400">No registrations found</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {search ? "Try adjusting your search criteria" : "Click 'Add Registration' to create one."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => {
                  const isActive = lic.status === "active";
                  return (
                    <tr
                      key={lic.id}
                      className="hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Registration Number */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm tracking-wider">
                            {lic.registrationNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(lic.registrationNumber)}
                            className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800 cursor-pointer"
                            title="Copy registration number"
                          >
                            {copiedKey === lic.registrationNumber ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">ID: {lic.id.slice(0, 8)}...</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={isActive ? "success" : "destructive"}>
                          {lic.status}
                        </Badge>
                      </td>

                      {/* Credits */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            {formatNumber(lic.creditsRemaining)}
                          </span>
                          <button
                            onClick={() => setSelectedLicenseForCredits(lic)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-xs text-zinc-400">
                        {lic.notes || "-"}
                      </td>

                      {/* Created / Updated */}
                      <td className="py-3.5 px-4 text-xs text-zinc-400">
                        <div>Created: {formatDate(lic.createdAt)}</div>
                        <div className="text-[11px] text-zinc-400">
                          Updated: {formatDate(lic.updatedAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle status */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleToggleStatus(lic.id)}
                            className={`h-8 px-2.5 text-xs ${
                              isActive
                                ? "text-amber-300 hover:text-amber-200 hover:bg-amber-950/30 border-amber-900/50"
                                : "text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/30 border-emerald-900/50"
                            }`}
                            title={isActive ? "Disable this registration" : "Activate this registration"}
                          >
                            <Power className="h-3.5 w-3.5 mr-1" />
                            {isActive ? "Disable" : "Enable"}
                          </Button>

                          {/* Adjust Credits Button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedLicenseForCredits(lic)}
                            className="h-8 px-2.5 text-xs text-zinc-200 hover:text-white"
                            title="Add, deduct or set credits"
                          >
                            <Coins className="h-3.5 w-3.5 mr-1 text-amber-400" />
                            Credits
                          </Button>

                          {/* View Audit Trail */}
                          <Link href={`/dashboard/audit?licenseId=${lic.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-400 hover:text-indigo-400"
                              title="View credit transactions audit log"
                            >
                              <History className="h-3.5 w-3.5" />
                            </Button>
                          </Link>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLicenseToDelete(lic)}
                            className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
                            title="Delete registration"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create License */}
      <CreateLicenseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          router.refresh();
        }}
      />

      {/* Modal: Adjust Credits */}
      <AdjustCreditsModal
        isOpen={!!selectedLicenseForCredits}
        license={selectedLicenseForCredits}
        onClose={() => setSelectedLicenseForCredits(null)}
        onSuccess={() => {
          setSelectedLicenseForCredits(null);
          router.refresh();
        }}
      />

      {/* Modal: Confirm Delete */}
      <Modal
        isOpen={!!licenseToDelete}
        onClose={() => setLicenseToDelete(null)}
        title="Delete Registration"
        description="Are you sure you want to delete this registration?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Permanent Action</p>
              <p className="mt-1">
                Deleting registration <span className="font-mono font-bold text-white">{licenseToDelete?.registrationNumber}</span> will remove it permanently. The EXE client will no longer be authorized.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLicenseToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
