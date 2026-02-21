"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DialogFooter } from "@/components/ui/dialog";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AsigneeSelect } from "@/components/task/AsigneeSelect";
import { useCreateTaskMutation } from "@/hooks/use-tasks";
import { BOARD_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { User } from "@prisma/client";

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
      dangerouslySetInnerHTML={{
        __html: text
          ? html
          : "<span class='text-muted-foreground'>No description</span>",
      }}
    />
  );
}

type FormState = {
  title: string;
  description: string;
  status: (typeof BOARD_STATUSES)[number];
  priority: (typeof PRIORITIES)[number];
  dueDate: string;
  assigneeId: string | null;
  assigneeName: string | null;
  tagIds: string[];
};

const initialForm: FormState = {
  title: "",
  description: "",
  status: "BACKLOG",
  priority: "MEDIUM",
  dueDate: "",
  assigneeId: null,
  assigneeName: null,
  tagIds: [],
};

export function AddTaskModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const createTask = useCreateTaskMutation();
  const { data: tagsList = [] } = useQuery({ queryKey: ["tags"], queryFn: getTags });

  function reset() {
    setForm(initialForm);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function setAssigneeValue(v: { id: string | null; name: string | null }) {
    setForm((f) => ({ ...f, assigneeId: v.id, assigneeName: v.name }));
  }

  function toggleTag(tag: { id: string; name: string }) {
    setForm((f) =>
      f.tagIds.includes(tag.id)
        ? { ...f, tagIds: f.tagIds.filter((id) => id !== tag.id) }
        : { ...f, tagIds: [...f.tagIds, tag.id] }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await createTask.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        assigneeId: form.assigneeId,
        tagIds: form.tagIds,
      });
      if (result.success) {
        handleOpenChange(false);
        reset();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <Plus className="h-4 w-4" />
        Add Task
      </Button>
      <Modal open={open} onOpenChange={handleOpenChange} title="Add task">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="add-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="add-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Task title"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="Supports **bold** and *italic*"
                />
                <div className="rounded-md border bg-muted/30 p-2 text-sm">
                  <span className="text-muted-foreground text-xs">Preview: </span>
                  <DescriptionPreview text={form.description} />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Assignee</label>
                <AsigneeSelect
                  value={{ id: form.assigneeId, name: form.assigneeName }}
                  onChange={(v) => setAssigneeValue(v && "email" in v ? (v as User) : { id: null, name: null })}
                  simpleValue
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="add-status" className="text-sm font-medium">
                    Status
                  </label>
                  <select
                    id="add-status"
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        status: e.target.value as FormState["status"],
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
                  <label htmlFor="add-priority" className="text-sm font-medium">
                    Priority
                  </label>
                  <select
                    id="add-priority"
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        priority: e.target.value as FormState["priority"],
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
                <label htmlFor="add-dueDate" className="text-sm font-medium">
                  Due date
                </label>
                <Input
                  id="add-dueDate"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tagsList.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={form.tagIds.includes(tag.id) ? "default" : "outline"}
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTask.isPending}>
                {createTask.isPending ? "Creating…" : "Create task"}
              </Button>
            </DialogFooter>
        </form>
      </Modal>
    </>
  );
}
