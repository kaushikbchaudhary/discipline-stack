import { supabase } from "@/lib/supabaseClient";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

const getToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
};

export const apiFetch = async <T>(path: string, options: RequestInit = {}) => {
  const token = await getToken();
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.error || "Request failed";
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};
