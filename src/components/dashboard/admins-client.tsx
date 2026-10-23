"use client";

import { useState } from "react";
import { Users, UserPlus, Shield, Trash2, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { createAdminUser, removeAdminUser } from "@/actions/admins";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: Date;
}

interface AdminsClientProps {
  admins: AdminUser[];
}

export function AdminsClient({ admins }: AdminsClientProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await createAdminUser({
        name,
        email,
        password,
      });

      if (!res.success) {
        setError(res.error || "Failed to create administrator");
        setIsLoading(false);
      } else {
        setName("");
        setEmail("");
        setPassword("");
        setIsLoading(false);
        setIsAddOpen(false);
        router.refresh();
      }
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred while adding admin.");
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this administrator's access?")) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await removeAdminUser(id);
      if (!res.success) {
        alert(res.error);
      }
      setDeletingId(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-400" />
            Administrator Team
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Public sign-up is completely disabled. Only existing administrators can provision new admin accounts.
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Admin Account
        </Button>
      </div>

      {/* Admin List Table */}
      <div className="rounded-xl border border-zinc-800 bg-[#11131c]/90 overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-[#161824] text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Admin Name</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Created Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-zinc-800/40 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">
                    {admin.name.slice(0, 1).toUpperCase()}
                  </div>
                  {admin.name}
                </td>
                <td className="py-3.5 px-4 text-zinc-300 font-mono text-xs">
                  {admin.email}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    <Shield className="h-3 w-3" />
                    {admin.role || "admin"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-zinc-400 text-xs">
                  {formatDate(admin.createdAt)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(admin.id)}
                    isLoading={deletingId === admin.id}
                    className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
                    title="Remove admin access"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal to Add Admin */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Provision Admin Account"
        description="Create an authorized administrator who can log in to the Kuro Manager portal."
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Full Name
            </label>
            <Input
              required
              placeholder="e.g. Alex Mercer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-white placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type="email"
                required
                placeholder="alex@kuro.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-white placeholder:text-zinc-600 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 text-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Admin
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
