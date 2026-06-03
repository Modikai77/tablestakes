import { redirect } from "next/navigation";
import { getCurrentUser, googleAuthConfigured } from "@/lib/auth";
import { SignInButton } from "@/components/SignInButton";

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto grid max-w-md gap-5 pt-12">
      <div>
        <p className="label">Private access</p>
        <h1 className="mt-1 text-3xl font-semibold">Sign in to Tablestakes</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">Your restaurant library, lists, sources and visit logs are scoped to your Google account.</p>
      </div>
      <div className="panel grid gap-4 p-4">
        {googleAuthConfigured ? (
          <SignInButton />
        ) : (
          <div className="rounded-md border border-[var(--line)] bg-[var(--soft)] p-4 text-sm leading-6 text-[var(--muted)]">
            Google login is not configured yet. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `NEXTAUTH_SECRET` to your environment, then restart the app.
          </div>
        )}
      </div>
    </div>
  );
}
