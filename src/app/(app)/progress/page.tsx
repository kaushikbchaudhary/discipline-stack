"use client";

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Progress</p>
        <h1 className="text-3xl font-semibold">Execution trend</h1>
        <p className="text-sm text-muted">
          Progress summaries will be restored once the Worker API is connected.
        </p>
      </div>
      <div className="card p-6">
        <p className="text-sm text-muted">This view is temporarily read-only.</p>
      </div>
    </div>
  );
}
