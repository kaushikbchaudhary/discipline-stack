"use client";

import { useEffect, useState } from "react";

import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabaseClient";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const name = data.session?.user?.user_metadata?.name ?? data.session?.user?.email ?? null;
      setUserName(name);
      if (data.session?.access_token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/user/ensure`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            "Content-Type": "application/json",
          },
        }).catch(() => null);
      }
    });
  }, []);

  return (
    <div className="app-shell">
      <Nav userName={userName} />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
