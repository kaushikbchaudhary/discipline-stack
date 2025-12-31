"use client";

export default function TimetablePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Timetable</p>
        <h1 className="text-3xl font-semibold">Daily blocks</h1>
        <p className="text-sm text-muted">
          Timetable editing will be restored once the Worker API is connected.
        </p>
      </div>
      <div className="card p-6">
        <p className="text-sm text-muted">This section is temporarily read-only.</p>
      </div>
    </div>
  );
}
