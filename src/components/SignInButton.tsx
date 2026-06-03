"use client";

import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <button className="button" type="button" onClick={() => signIn("google", { callbackUrl: "/" })}>
      Continue with Google
    </button>
  );
}

