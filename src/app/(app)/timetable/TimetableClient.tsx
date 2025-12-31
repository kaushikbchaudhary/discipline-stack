"use client";

import { useState, useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";

import { minutesToTimeString, timeStringToMinutes } from "@/lib/time";
import { apiFetch } from "@/lib/api";

const categories = [
  "CoreWork",
  "SupportWork",
  "Learning",
  "Practice",
  "Health",
  "Reflection",
  "Recovery",
];

type BlockView = {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  category: string;
  mandatory: boolean;
};

type TimetableClientProps = {
  blocks: BlockView[];
};

export default function TimetableClient({ blocks }: TimetableClientProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    startTime: "06:00",
    endTime: "07:00",
    category: "CoreWork",
    mandatory: false,
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        const durationMinutes =
          timeStringToMinutes(form.endTime) - timeStringToMinutes(form.startTime);
        await apiFetch("/blocks", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            category: form.category,
            startTime: form.startTime,
            endTime: form.endTime,
            durationMinutes: Math.max(0, durationMinutes),
            mandatory: form.mandatory,
          }),
        });
        toast.success("Block added.");
        window.location.reload();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not add block.";
        toast.error(message);
      }
    });
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>, block: BlockView) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const startTime = String(formData.get("startTime"));
        const endTime = String(formData.get("endTime"));
        await apiFetch("/blocks", {
          method: "PATCH",
          body: JSON.stringify({
            id: block.id,
            name: String(formData.get("name")),
            category: String(formData.get("category")),
            startTime,
            endTime,
            durationMinutes: timeStringToMinutes(endTime) - timeStringToMinutes(startTime),
            mandatory: Boolean(formData.get("mandatory")),
          }),
        });
        toast.success("Block updated.");
        window.location.reload();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not update block.";
        toast.error(message);
      }
    });
  };

  const handleDelete = (blockId: string) => {
    startTransition(async () => {
      try {
        await apiFetch("/blocks", {
          method: "DELETE",
          body: JSON.stringify({ id: blockId }),
        });
        toast.success("Block deleted.");
        window.location.reload();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not delete block.";
        toast.error(message);
      }
    });
  };
  return (
    <div className="space-y-8">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Schedule lock</h2>
            <p className="text-sm text-muted">
              When locked, edits require a confirmation checkbox.
            </p>
          </div>
          <span className="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-muted">
            Locking disabled
          </span>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-2xl font-semibold">Add block</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            name="name"
            placeholder="Block name"
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
          <select
            name="category"
            className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
            required
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            name="startTime"
            type="time"
            required
            value={form.startTime}
            onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
            className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
          <input
            name="endTime"
            type="time"
            required
            value={form.endTime}
            onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
            className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              name="mandatory"
              type="checkbox"
              checked={form.mandatory}
              onChange={(event) => setForm((prev) => ({ ...prev, mandatory: event.target.checked }))}
            />
            Mandatory block
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Add block
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {blocks.map((block) => (
          <form
            key={block.id}
            onSubmit={(event) => handleUpdate(event, block)}
            className="card p-6"
          >
            <input type="hidden" name="id" value={block.id} />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{block.name}</h3>
                <p className="text-sm text-muted">
                  {minutesToTimeString(block.startTime)} - {minutesToTimeString(block.endTime)}
                </p>
              </div>
              <div className="chip text-muted">{block.category}</div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                name="name"
                defaultValue={block.name}
                className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
              />
              <select
                name="category"
                defaultValue={block.category}
                className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                name="startTime"
                type="time"
                defaultValue={minutesToTimeString(block.startTime)}
                className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
              />
              <input
                name="endTime"
                type="time"
                defaultValue={minutesToTimeString(block.endTime)}
                className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm">
                <input name="mandatory" type="checkbox" defaultChecked={block.mandatory} />
                Mandatory block
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Save changes
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDelete(block.id)}
                className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-muted"
              >
                Delete block
              </button>
            </div>
          </form>
        ))}
        {blocks.length === 0 ? (
          <div className="card p-6">
            <p className="text-sm text-muted">No schedule blocks yet.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
