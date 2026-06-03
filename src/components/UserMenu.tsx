import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { UserAvatar } from "@/components/UserAvatar";

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
      <UserAvatar email={user.email} image={user.image} />
      <SignOutButton />
    </div>
  );
}
