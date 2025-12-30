import ExportClient from "@/app/(app)/export/ExportClient";
import { getServerAuthSession } from "@/lib/auth";
import { getQuietWeek } from "@/lib/quiet";
import { redirect } from "next/navigation";

export default async function ExportPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const quietWeek = await getQuietWeek(session.user.id);
  if (quietWeek) {
    redirect("/today");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Export</p>
        <h1 className="text-3xl font-semibold">Take your data with you</h1>
        <p className="text-sm text-muted">Download a JSON snapshot of your execution OS.</p>
      </div>
      <ExportClient />
    </div>
  );
}
