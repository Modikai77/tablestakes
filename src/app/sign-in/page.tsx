import { redirect } from "next/navigation";
import { CircleAlert } from "lucide-react";
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
          <div className="subtle-panel grid gap-3 p-4 text-sm leading-6 text-[var(--muted)]">
            <div className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 shrink-0 text-[var(--accent-2)]" size={16} />
              <div>
                <p className="font-semibold text-[var(--foreground)]">Sign-in is not available in this environment yet.</p>
                <p className="mt-1">Ask the workspace owner to finish Google sign-in setup, then come back to continue.</p>
              </div>
            </div>
            <details>
              <summary className="cursor-pointer font-semibold text-[var(--foreground)]">Developer setup</summary>
              <p className="mt-2">
                Add <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code> and <code>NEXTAUTH_SECRET</code>, then restart the app.
              </p>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
