"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, List, Plus, Search, UserCircle } from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "Library",
    icon: Search,
    isActive: (pathname: string) => pathname === "/" || (pathname.startsWith("/restaurants/") && pathname !== "/restaurants/new")
  },
  {
    href: "/sources",
    label: "Inbox",
    icon: Inbox,
    isActive: (pathname: string) => pathname.startsWith("/sources")
  },
  {
    href: "/lists",
    label: "Lists",
    icon: List,
    isActive: (pathname: string) => pathname.startsWith("/lists")
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle,
    isActive: (pathname: string) => pathname.startsWith("/profile")
  },
  {
    href: "/restaurants/new",
    label: "Add",
    icon: Plus,
    isActive: (pathname: string) => pathname === "/restaurants/new"
  }
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.isActive(pathname);
        return (
          <Link aria-current={active ? "page" : undefined} className={`button secondary nav-button !min-h-9 !px-3${active ? " active" : ""}`} href={item.href} key={item.href}>
            <Icon size={16} />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
