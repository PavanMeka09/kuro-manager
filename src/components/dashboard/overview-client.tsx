"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Coins, 
  Activity, 
  Plus, 
  Search, 
  ArrowUpRight,
  TrendingUp,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";
import { CreateLicenseModal } from "@/components/dashboard/create-license-modal";
import { useRouter } from "next/navigation";

interface DashboardStatsProps {
  stats: {
    totalRegistrations: number;
    activeRegistrations: number;
    disabledRegistrations: number;
    totalCreditsRemaining: number;
    totalTransactionsCount: number;
    recentLicenses: Array<{
      id: string;
      registrationNumber: string;
      creditsRemaining: number;
      status: string;
      createdAt: Date;
    }>;
    recentTransactions: Array<{
      id: string;
      licenseId: string;
      adminEmail: string | null;
      previousCredits: number;
      newCredits: number;
      reason: string;
      createdAt: Date;
      registrationNumber: string | null;
    }>;
  };
}

export function OverviewClient({ stats }: DashboardStatsProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/licenses?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/dashboard/licenses");
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Overview</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time telemetry for client registration numbers, credits, and EXE authorizations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search registration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 rounded-lg border border-zinc-800 bg-zinc-900/80 pl-9 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </form>

          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Registration
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <Card className="glow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-zinc-400">Total Registrations</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <KeyRound className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatNumber(stats.totalRegistrations)}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Managed client identifiers</p>
          </CardContent>
        </Card>

        {/* Active Licenses */}
        <Card className="glow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-zinc-400">Active Licenses</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {formatNumber(stats.activeRegistrations)}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Authorized for EXE access</p>
          </CardContent>
        </Card>

        {/* Disabled Licenses */}
        <Card className="glow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-zinc-400">Disabled Licenses</span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <XCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">
              {formatNumber(stats.disabledRegistrations)}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Blocked from authorization</p>
          </CardContent>
        </Card>

        {/* Remaining Credits */}
        <Card className="glow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-zinc-400">Remaining Credits</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Coins className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {formatNumber(stats.totalCreditsRemaining)}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Available across all clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Columns: Recent Registrations & Recent Credit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <Card className="border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/80">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-indigo-400" />
                Recently Added Registrations
              </CardTitle>
            </div>
            <Link
              href="/dashboard/licenses"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentLicenses.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">No registrations found.</div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {stats.recentLicenses.map((lic) => (
                  <div
                    key={lic.id}
                    className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div>
                      <div className="font-mono text-sm font-semibold text-white tracking-wide">
                        {lic.registrationNumber}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Created {formatDate(lic.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-amber-400 font-mono">
                          {formatNumber(lic.creditsRemaining)}
                        </div>
                        <div className="text-[10px] text-zinc-400 uppercase">credits</div>
                      </div>
                      <Badge variant={lic.status === "active" ? "success" : "destructive"}>
                        {lic.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Credit Transactions */}
        <Card className="border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/80">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-amber-400" />
                Recent Credit Activity
              </CardTitle>
            </div>
            <Link
              href="/dashboard/audit"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              Audit log
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">No credit activity logged.</div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {stats.recentTransactions.map((tx) => {
                  const delta = tx.newCredits - tx.previousCredits;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-white">
                            {tx.registrationNumber || "Deleted License"}
                          </span>
                          <span className="text-[11px] text-zinc-400 truncate">
                            by {tx.adminEmail || "System"}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">{tx.reason}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono text-sm font-bold ${
                            delta > 0
                              ? "text-emerald-400"
                              : delta < 0
                              ? "text-rose-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </div>
                        <div className="text-[10px] text-zinc-400">{formatDate(tx.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal for creating registration */}
      <CreateLicenseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
