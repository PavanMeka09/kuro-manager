import { listAdmins } from "@/actions/admins";
import { AdminsClient } from "@/components/dashboard/admins-client";

export default async function AdminsPage() {
  const admins = await listAdmins();
  return <AdminsClient admins={admins} />;
}
