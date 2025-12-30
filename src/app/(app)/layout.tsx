import { getServerAuthSession } from "@/lib/auth";
import { getQuietWeek } from "@/lib/quiet";
import Nav from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  const quietWeek = session?.user?.id ? await getQuietWeek(session.user.id) : null;

  return (
    <div className="app-shell">
      <Nav userName={session?.user?.name} quietMode={Boolean(quietWeek)} />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
