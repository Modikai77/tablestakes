"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button className="button secondary !min-h-9 !px-3" type="button" title="Sign out" onClick={() => signOut({ callbackUrl: "/sign-in" })}>
      <LogOut size={16} />
      <span className="hidden md:inline">Sign out</span>
    </button>
  );
}
