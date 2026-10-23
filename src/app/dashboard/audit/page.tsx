import { getLicenseTransactions } from "@/actions/licenses";
import { History, Shield, ArrowRight, Download, Filter } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AuditPageProps {
  searchParams: Promise<{
    licenseId?: string;
  }>;
}

export default async function AuditLogPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const transactions = await getLicenseTransactions(params.licenseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="h-6 w-6 text-amber-400" />
            Credit Transactions Audit Log
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Immutable historical record of every credit modification, initial allocation, and EXE deduction.
          </p>
        </div>

        {params.licenseId && (
          <Link href="/dashboard/audit">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Filter className="h-3.5 w-3.5" />
              Clear Filter (Showing 1 License)
            </Button>
          </Link>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-zinc-800 bg-[#11131c]/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-[#161824] text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Registration</th>
                <th className="py-3.5 px-4">Modified By</th>
                <th className="py-3.5 px-4">Credit Transition</th>
                <th className="py-3.5 px-4">Delta</th>
                <th className="py-3.5 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <History className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
                    <p className="text-sm font-medium text-zinc-400">No transaction logs found</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const delta = tx.newCredits - tx.previousCredits;
                  const isPositive = delta > 0;
                  const isNegative = delta < 0;

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-800/40 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-400 whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>

                      {/* Registration */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/licenses?q=${encodeURIComponent(tx.registrationNumber || "")}`}
                          className="font-mono font-bold text-white hover:text-indigo-400 transition-colors"
                        >
                          {tx.registrationNumber || "Deleted"}
                        </Link>
                      </td>

                      {/* Admin */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs text-zinc-300 flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-indigo-400" />
                          {tx.adminEmail || "System"}
                        </span>
                      </td>

                      {/* Transition */}
                      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">{formatNumber(tx.previousCredits)}</span>
                          <ArrowRight className="h-3 w-3 text-zinc-600" />
                          <span className="text-white font-semibold">{formatNumber(tx.newCredits)}</span>
                        </div>
                      </td>

                      {/* Delta */}
                      <td className="py-3.5 px-4 font-mono text-xs font-bold whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            isPositive
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : isNegative
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {isPositive ? `+${delta}` : delta}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-xs text-zinc-300 max-w-sm">
                        {tx.reason}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
