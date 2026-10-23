import { getDashboardStats } from "@/actions/licenses";
import { OverviewClient } from "@/components/dashboard/overview-client";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return <OverviewClient stats={stats} />;
}
