import { prisma } from "@/lib/prisma";
import {
  success,
  notFound,
  badRequest,
  serverError,
  handleZodError,
} from "@/lib/api-response";
import { updateTaskBodySchema } from "@/lib/validations";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { publish } from "@/lib/sse-broadcast";

const taskInclude = {
  assignee: true,
  tags: true,
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });
    if (!task) return notFound("Task not found");
    return success(task);
  } catch (error) {
    console.error("[GET /api/tasks/[id]]", error);
    return serverError("Failed to fetch task");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateTaskBodySchema.safeParse(body);

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return notFound("Task not found");
    }

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
    return success(task);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return notFound("Task not found");
      }
      if (error.code === "P2003") {
        return badRequest("Invalid assignee or tag reference");
      }
    }
    console.error("[PATCH /api/tasks/[id]]", error);
    return serverError("Failed to update task");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return notFound("Task not found");
    }

    await prisma.task.delete({ where: { id } });

    publish("task", JSON.stringify({ type: "deleted", id }));
    return success({ deleted: true, id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return notFound("Task not found");
      }
    }
    console.error("[DELETE /api/tasks/[id]]", error);
    return serverError("Failed to delete task");
  }
}
