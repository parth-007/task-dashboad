import { prisma } from "@/lib/prisma";
import {
  success,
  created,
  badRequest,
  serverError,
  handleZodError,
} from "@/lib/api-response";
import {
  getTasksQuerySchema,
  createTaskBodySchema,
} from "@/lib/validations";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { publish } from "@/lib/sse-broadcast";

const taskInclude = {
  assignee: true,
  tags: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = getTasksQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      assignee: searchParams.get("assignee") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const { status, assignee, priority, sort, order, page, limit } = parsed.data;

    const where: Prisma.TaskWhereInput = {};
    if (status) where.status = status;
    if (assignee) where.assigneeId = assignee;
    if (priority) where.priority = priority;

    const orderBy: Prisma.TaskOrderByWithRelationInput = {
      [sort]: order,
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: taskInclude,
      }),
      prisma.task.count({ where }),
    ]);

    return success({
      tasks,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("[GET /api/tasks]", error);
    return serverError("Failed to fetch tasks");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTaskBodySchema.safeParse(body);

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const { title, description, status, priority, dueDate, assigneeId, tagIds } =
      parsed.data;

    const dueDateValue =
      dueDate != null ? (typeof dueDate === "string" ? new Date(dueDate) : dueDate) : undefined;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDateValue,
        assigneeId: assigneeId ?? undefined,
        tags: tagIds?.length
          ? { connect: tagIds.map((id) => ({ id })) }
          : undefined,
      },
      include: taskInclude,
    });

    publish("task", JSON.stringify({ type: "created", task }));
    return created(task);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return badRequest("Invalid assignee or tag reference");
      }
    }
    console.error("[POST /api/tasks]", error);
    return serverError("Failed to create task");
  }
}
