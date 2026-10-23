import { auth } from "./auth";
import { headers } from "next/headers";

export async function getCurrentAdmin() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) {
      return null;
    }
    return session.user;
  } catch (err) {
    console.error("Session check error:", err);
    return null;
  }
}

export async function requireAdmin() {
  const user = await getCurrentAdmin();
  if (!user) {
    throw new Error("Unauthorized: Admin authentication required");
  }
  return user;
}
