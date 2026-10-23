import { getCurrentAdmin } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-zinc-100">
      <DashboardNav userEmail={admin.email} userName={admin.name} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
