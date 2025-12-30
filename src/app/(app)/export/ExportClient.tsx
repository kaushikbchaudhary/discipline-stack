"use client";

import { useState, useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";

export default function ExportClient() {
  const [isPending, startTransition] = useTransition();
  const [format, setFormat] = useState<"md" | "pdf">("md");

  const handleDownload = () => {
    startTransition(async () => {
      const response = await fetch("/api/export");
      if (!response.ok) {
        toast.error("Could not export data.");
        return;
      }
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "execution-os-export.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Export ready.");
    });
  };

  const handleOutputExport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const start = formData.get("start");
    const end = formData.get("end");
    const url = `/api/outputs/export?start=${start}&end=${end}&format=${format}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-semibold">Download your progress</h2>
        <p className="mt-2 text-sm text-muted">
          Export schedule blocks, plan, task completion, and weekly reviews as JSON.
        </p>
        <button
          type="button"
          disabled={isPending}
          onClick={handleDownload}
          className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Download JSON
        </button>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold">Export goal artifacts</h2>
        <p className="mt-2 text-sm text-muted">
          Export goal artifacts as Markdown or a weekly PDF summary.
        </p>
        <form onSubmit={handleOutputExport} className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            name="start"
            type="date"
            required
            className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="end"
            type="date"
            required
            className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
          />
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as "md" | "pdf")}
            className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
          >
            <option value="md">Markdown</option>
            <option value="pdf">Weekly PDF</option>
          </select>
          <button
            type="submit"
            className="md:col-span-3 rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
          >
            Export artifacts
          </button>
        </form>
      </div>
    </div>
  );
}
