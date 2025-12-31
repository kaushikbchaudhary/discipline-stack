"use client";

import { useEffect } from "react";

import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      window.location.href = data.session ? "/today" : "/login";
    });
  }, []);

  return null;
}
