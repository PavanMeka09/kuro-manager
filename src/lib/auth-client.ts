"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // Omitting baseURL allows Better Auth to dynamically use window.location.origin
  // so requests always match the browser's origin.
  plugins: [
    adminClient(),
  ],
});

export const { signIn, signOut, signUp, useSession } = authClient;
