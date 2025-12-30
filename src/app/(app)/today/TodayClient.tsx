"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { saveArtifactFile, saveOutput, toggleTaskCompletion } from "@/app/(app)/today/actions";

type TaskView = {
  id: string;
  title: string;
  description: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  completed: boolean;
};

type TodayClientProps = {
  tasks: TaskView[];
  outputType?: string | null;
  outputContent?: string | null;
  progress: {
    percent: number;
    doneCount: number;
    totalCount: number;
  };
  status: {
    outputReady: boolean;
    isComplete: boolean;
  };
};

export default function TodayClient({
  tasks,
  outputType,
  outputContent,
  progress,
  status,
}: TodayClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscribeRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const sendSubscription = async (subscription: PushSubscription) => {
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Could not save subscription.");
    }
  };

  const ensurePushSubscription = async () => {
    if (subscribeRef.current) {
      return;
    }
    subscribeRef.current = true;
    try {
      if (!("serviceWorker" in navigator)) {
        toast.error("Service workers are not supported in this browser.");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await sendSubscription(existing);
        setIsSubscribed(true);
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("Missing VAPID public key.");
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await sendSubscription(subscription);
      setIsSubscribed(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not enable notifications.";
      toast.error(message);
    } finally {
      subscribeRef.current = false;
    }
  };

  useEffect(() => {
    if (permission !== "granted") {
      return;
    }
    ensurePushSubscription();
  }, [permission]);

  const handleTaskToggle = (taskId: string) => {
    startTransition(async () => {
      const result = await toggleTaskCompletion(taskId);
      if (result.ok) {
        toast.success("Task updated.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not update task.");
      }
    });
  };

  const handleOutput = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveOutput(formData);
      if (result.ok) {
        toast.success("Proof saved.");
        router.refresh();
      } else {
        toast.error(result.error || "Add a valid proof entry.");
      }
    });
  };

  const handleFile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveArtifactFile(formData);
      if (result.ok) {
        toast.success("File uploaded.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not upload file.");
      }
    });
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported in this browser.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Notifications enabled.");
      ensurePushSubscription();
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Today</h2>
          <span className="chip text-muted">
            {progress.doneCount}/{progress.totalCount} done
          </span>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[color:var(--bg-alt)]">
          <div
            className="h-full rounded-full bg-[color:var(--accent)] transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-muted">
          Status: {status.isComplete ? "Complete" : "In progress"}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={enableNotifications}
            className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs font-semibold"
          >
            {permission === "granted" && isSubscribed
              ? "Notifications enabled"
              : "Enable notifications"}
          </button>
          <span className="text-xs text-muted">
            Background alerts fire near task start times.
          </span>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-xl font-semibold">Today tasks</h3>
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              disabled={isPending}
              onClick={() => handleTaskToggle(task.id)}
              className={`flex w-full items-start justify-between rounded-2xl border border-[color:var(--border)] px-4 py-3 text-left transition hover:border-[color:var(--accent)] ${
                task.completed ? "bg-[color:var(--bg-alt)]" : "bg-white"
              }`}
            >
              <div>
                <p className="text-base font-semibold">{task.title}</p>
                {task.description ? (
                  <p className="text-xs text-muted">{task.description}</p>
                ) : null}
                <p className="text-xs text-muted">
                  {task.startTime && task.endTime
                    ? `${task.startTime}–${task.endTime}`
                    : "Time not set"}
                  {task.durationMinutes ? ` · ${task.durationMinutes} min` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {task.completed ? (
                  <span className="text-sm font-semibold text-[color:var(--accent)]">✓</span>
                ) : null}
              </div>
            </button>
          ))}
          {tasks.length === 0 ? (
            <p className="text-sm text-muted">No tasks planned for today.</p>
          ) : null}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-xl font-semibold">Proof</h3>
        <p className="mt-2 text-sm text-muted">Add a link or a short note.</p>
        <form onSubmit={handleOutput} className="mt-4 space-y-3">
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="outputType"
                value="TEXT"
                defaultChecked={!outputType || outputType === "TEXT"}
              />
              Text
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="outputType"
                value="URL"
                defaultChecked={outputType === "URL"}
              />
              Link
            </label>
          </div>
          <textarea
            name="outputContent"
            defaultValue={outputContent ?? ""}
            rows={4}
            placeholder="Paste a link or write a short note"
            className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Save proof
          </button>
        </form>

        <form onSubmit={handleFile} className="mt-4 space-y-3">
          <input
            name="file"
            type="file"
            required
            className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted">Max file size: 20MB.</p>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
          >
            Upload file proof
          </button>
        </form>

        <p className="mt-3 text-sm text-muted">
          Proof attached: {status.outputReady ? "Yes" : "No"}
        </p>
      </div>
    </div>
  );
}
