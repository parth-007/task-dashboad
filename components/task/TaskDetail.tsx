"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUpdateTaskMutation, invalidateTasksQuery } from "@/hooks/use-tasks";
import { DialogFooter } from "@/components/ui/dialog";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AsigneeSelect } from "@/components/task/AsigneeSelect";
import type { TaskWithRelations } from "@/lib/types";
import type { User } from "@/lib/tasks";
import { BOARD_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

async function getTags(): Promise<{ id: string; name: string; color: string | null }[]> {
  const res = await fetch("/api/tags");
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}

function DescriptionPreview({ text }: { text: string }) {
  const html = useMemo(() => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");
  }, [text]);
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-foreground"
      dangerouslySetInnerHTML={{ __html: html || "<span class='text-muted-foreground'>No description</span>" }}
    />
  );
}

export function TaskDetail({
  task: initialTask,
  standalone = false,
}: {
  task: TaskWithRelations;
  standalone?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateTask = useUpdateTaskMutation();
  const [task, setTask] = useState(initialTask);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tagsList = [] } = useQuery({ queryKey: ["tags"], queryFn: getTags });

  const selectedTagIds = useMemo(
    () => task.tags.map((t) => t.id),
    [task.tags]
  );

  function handleClose() {
    if (standalone) router.push("/dashboard");
    else router.back();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      assigneeId: task.assigneeId ?? null,
      tagIds: task.tags.map((t) => t.id),
    };
    const prev = queryClient.getQueryData<TaskWithRelations[]>(["tasks"]);
    const optimisticTask: TaskWithRelations = {
      ...task,
      ...payload,
      dueDate: task.dueDate,
      assignee: task.assignee,
      tags: task.tags,
    };
    queryClient.setQueryData<TaskWithRelations[]>(["tasks"], (old) =>
      (old ?? []).map((t) => (t.id === task.id ? optimisticTask : t))
    );
    setSaving(true);
    try {
      const result = await updateTask.mutateAsync({ id: task.id, body: payload });
      if (result.success) {
        queryClient.setQueryData<TaskWithRelations[]>(["tasks"], (old) =>
          (old ?? []).map((t) => (t.id === task.id ? result.data : t))
        );
        invalidateTasksQuery(queryClient);
        if (standalone) router.push("/dashboard");
        else handleClose();
      } else {
        if (prev) queryClient.setQueryData(["tasks"], prev);
        setError(result.error);
      }
    } catch (err) {
      if (prev) queryClient.setQueryData(["tasks"], prev);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function setAssignee(user: User | null) {
    setTask((t) => ({
      ...t,
      assigneeId: user?.id ?? null,
      assignee: (user ?? null) as TaskWithRelations["assignee"],
    }));
  }

  function toggleTag(tag: { id: string; name: string; color: string | null }) {
    setTask((t) => {
      const has = t.tags.some((x) => x.id === tag.id);
      if (has) return { ...t, tags: t.tags.filter((x) => x.id !== tag.id) };
      return { ...t, tags: [...t.tags, tag] };
    });
  }

  const dueDateStr = task.dueDate
    ? new Date(task.dueDate).toISOString().slice(0, 16)
    : "";

  const formBody = (
    <>
      <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={task.title}
                onChange={(e) => setTask((t) => ({ ...t, title: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                value={task.description ?? ""}
                onChange={(e) =>
                  setTask((t) => ({ ...t, description: e.target.value || null }))
                }
                rows={3}
                placeholder="Supports **bold** and *italic*"
              />
              <div className="rounded-md border bg-muted/30 p-2 text-sm">
                <span className="text-muted-foreground text-xs">Preview: </span>
                <DescriptionPreview text={task.description ?? ""} />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Assignee</label>
              <AsigneeSelect
                value={task.assignee}
                onChange={(v) => setAssignee(v && "email" in v ? (v as User) : null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Status
                </label>
                <select
                  id="status"
                  value={task.status}
                  onChange={(e) =>
                    setTask((t) => ({
                      ...t,
                      status: e.target.value as TaskWithRelations["status"],
                    }))
                  }
                  className={cn(
                    "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                  )}
                >
                  {BOARD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </label>
                <select
                  id="priority"
                  value={task.priority}
                  onChange={(e) =>
                    setTask((t) => ({
                      ...t,
                      priority: e.target.value as TaskWithRelations["priority"],
                    }))
                  }
                  className={cn(
                    "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                  )}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="dueDate" className="text-sm font-medium">
                Due date
              </label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDateStr}
                onChange={(e) =>
                  setTask((t) => ({
                    ...t,
                    dueDate: e.target.value ? new Date(e.target.value) : null,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tagsList.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
    </>
  );

  if (standalone) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to board
        </Link>
        <div className="mt-4 rounded-lg border bg-card p-6 max-w-lg">
          <h1 className="text-xl font-semibold mb-4">Edit task</h1>
          <form onSubmit={handleSubmit}>
            {formBody}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Modal
      open
      onOpenChange={(open) => !open && handleClose()}
      title="Edit task"
    >
      <form onSubmit={handleSubmit}>
        {formBody}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
