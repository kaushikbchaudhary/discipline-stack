"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/today", label: "Today" },
  { href: "/timetable", label: "Timetable" },
  { href: "/plan", label: "Plan" },
  { href: "/progress", label: "Progress" },
  { href: "/timeline", label: "Timeline" },
  { href: "/review", label: "Review" },
  { href: "/export", label: "Export" },
];

export default function Nav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

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
          {links.map((link) => {
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
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-sm text-muted hover:text-black"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
