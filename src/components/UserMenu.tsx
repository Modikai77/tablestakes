import Image from "next/image";
import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export function UserMenu({ user }: { user: CurrentUser | null }) {
  if (!user) {
    return (
      <Link className="button !min-h-9 !px-3" href="/sign-in">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.image ? (
        <Image src={user.image} alt="" width={28} height={28} className="rounded-full" />
      ) : (
        <span className="grid size-7 place-items-center rounded-full bg-[var(--soft)] text-xs font-semibold">{user.email.slice(0, 1).toUpperCase()}</span>
      )}
      <SignOutButton />
    </div>
  );
}
