import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, List, Plus, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { UserMenu } from "@/components/UserMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tablestakes",
  description: "Private restaurant memory app"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(251,250,247,0.92)] backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="grid size-8 place-items-center rounded-md bg-[var(--foreground)] text-sm text-white">T</span>
              <span>Tablestakes</span>
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-1">
              <Link className="button secondary !min-h-9 !px-3" href="/">
                <Search size={16} />
                <span className="hidden sm:inline">Library</span>
              </Link>
              <Link className="button secondary !min-h-9 !px-3" href="/sources">
                <Inbox size={16} />
                <span className="hidden sm:inline">Inbox</span>
              </Link>
              <Link className="button secondary !min-h-9 !px-3" href="/lists">
                <List size={16} />
                <span className="hidden sm:inline">Lists</span>
              </Link>
              <Link className="button secondary !min-h-9 !px-3" href="/profile">
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <Link className="button !min-h-9 !px-3" href="/restaurants/new">
                <Plus size={16} />
                <span className="hidden sm:inline">Add</span>
              </Link>
              <UserMenu user={user} />
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">{children}</main>
      </body>
    </html>
  );
}
