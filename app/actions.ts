"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/sse-broadcast";
import {
  createTaskBodySchema,
  updateTaskBodySchema,
} from "@/lib/validations";
import type { TaskWithRelations } from "@/lib/types";
import { Prisma } from "@prisma/client";

const taskInclude = {
  assignee: true,
  tags: true,
} as const;

export type ActionResult<T = TaskWithRelations> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Minimal server action for testing.
 */
export async function getServerPing(): Promise<{ pong: string; at: string }> {
  return {
    pong: "ok",
    at: new Date().toISOString(),
  };
}

/** Create a task. Validates with Zod, then Prisma create + SSE broadcast. */
export async function createTaskAction(payload: {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  assigneeId?: string | null;
  tagIds?: string[];
}): Promise<ActionResult<TaskWithRelations>> {
  const parsed = createTaskBodySchema.safeParse(payload);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors?.[0] ?? parsed.error.message;
    return { success: false, error: msg || "Validation failed" };
  }
  const { title, description, status, priority, dueDate, assigneeId, tagIds } =
    parsed.data;
  const dueDateValue =
    dueDate != null
      ? typeof dueDate === "string"
        ? new Date(dueDate)
        : dueDate
      : undefined;
  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDateValue,
        assigneeId: assigneeId ?? undefined,
        tags: tagIds?.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      },
      include: taskInclude,
    });
    publish("task", JSON.stringify({ type: "created", task }));
    revalidatePath("/dashboard");
    return { success: true, data: task as TaskWithRelations };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2003")
        return { success: false, error: "Invalid assignee or tag reference" };
    }
    console.error("[createTaskAction]", e);
    return { success: false, error: "Failed to create task" };
  }
}

/** Update a task by id. Validates with Zod, then Prisma update + SSE broadcast. */
export async function updateTaskAction(
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
): Promise<ActionResult<TaskWithRelations>> {
  const parsed = updateTaskBodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors?.[0] ?? parsed.error.message;
    return { success: false, error: msg || "Validation failed" };
  }
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Task not found" };

  const { title, description, status, priority, dueDate, assigneeId, tagIds, position } =
    parsed.data;
  const dueDateValue =
    dueDate !== undefined
      ? dueDate === null
        ? null
        : typeof dueDate === "string"
          ? new Date(dueDate)
          : dueDate
      : undefined;

  try {
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title != null && { title }),
        ...(description !== undefined && { description }),
        ...(status != null && { status }),
        ...(priority != null && { priority }),
        ...(dueDateValue !== undefined && { dueDate: dueDateValue }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(tagIds !== undefined && {
          tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
        }),
        ...(position !== undefined && { position }),
      },
      include: taskInclude,
    });
    publish("task", JSON.stringify({ type: "updated", task }));
    revalidatePath("/dashboard");
    return { success: true, data: task as TaskWithRelations };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return { success: false, error: "Task not found" };
      if (e.code === "P2003")
        return { success: false, error: "Invalid assignee or tag reference" };
    }
    console.error("[updateTaskAction]", e);
    return { success: false, error: "Failed to update task" };
  }
}

/** Update only task status (e.g. from drag-and-drop). */
export async function updateTaskStatusAction(
  id: string,
  status: string
): Promise<ActionResult<TaskWithRelations>> {
  return updateTaskAction(id, { status });
}
