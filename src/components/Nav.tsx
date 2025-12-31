"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/today", label: "Today" },
  { href: "/plan", label: "Plan" },
  { href: "/plan/import", label: "Plan Import" },
  { href: "/review", label: "Review" },
];

export default function Nav({
  userName,
}: {
  userName?: string | null;
}) {
  const pathname = usePathname();
  const visibleLinks = links;

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--surface)]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white">
            Execution OS
          </div>
          <span className="text-sm text-muted">{userName ?? ""}</span>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {visibleLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-[color:var(--accent)] text-white"
                    : "text-muted hover:text-black"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-sm text-muted hover:text-black"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
