"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";

export default function ExportClient() {
  const [isPending, startTransition] = useTransition();

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

  return (
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
  );
}
