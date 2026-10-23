import { getLicenses } from "@/actions/licenses";
import { LicensesClient } from "@/components/dashboard/licenses-client";

interface LicensesPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}

export default async function LicensesPage({ searchParams }: LicensesPageProps) {
  const params = await searchParams;
  const initialLicenses = await getLicenses(params.q, params.status);

  return <LicensesClient initialLicenses={initialLicenses} initialQuery={params.q || ""} />;
}
