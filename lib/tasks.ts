import type { TaskWithRelations } from "@/lib/types";

export type User = { id: string; name: string; email: string; image: string | null };
export type Tag = { id: string; name: string; color: string | null };

function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser: same-origin relative URL
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export type TaskFilters = {
  status?: string;
  assignee?: string;
  priority?: string;
  limit?: number;
};

export async function fetchTasks(filters?: TaskFilters): Promise<TaskWithRelations[]> {
  const base = getBaseUrl();
  const params = new URLSearchParams();
  params.set("limit", String(filters?.limit ?? 100));
  if (filters?.status) params.set("status", filters.status);
  if (filters?.assignee) params.set("assignee", filters.assignee);
  if (filters?.priority) params.set("priority", filters.priority);
  const res = await fetch(`${base}/api/tasks?${params.toString()}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = await res.json();
  return data.tasks;
}

export async function getTaskById(
  id: string
): Promise<TaskWithRelations | null> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/tasks/${id}`, {
    next: { revalidate: 0 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch task");
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/users`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchTags(): Promise<Tag[]> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/tags`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}

export async function updateTask(
  id: string,
  body: {
    title?: string;
    description?: string | null;
    status?: string;
    priority?: string;
    dueDate?: string | null;
    assigneeId?: string | null;
    tagIds?: string[];
  }
): Promise<TaskWithRelations> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to update task");
  }
  return res.json();
}

export async function updateTaskStatus(
  id: string,
  status: string
): Promise<TaskWithRelations> {
  return updateTask(id, { status });
}

export async function createTask(body: {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  assigneeId?: string | null;
  tagIds?: string[];
}): Promise<TaskWithRelations> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to create task");
  }
  return res.json();
}