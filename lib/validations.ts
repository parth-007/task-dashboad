import { z } from "zod";

const taskStatusEnum = z.enum(["BACKLOG", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
const priorityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
const sortOrderEnum = z.enum(["asc", "desc"]);
const sortFieldEnum = z.enum(["createdAt", "updatedAt", "dueDate", "priority", "title"]);

/** Query params for GET /api/tasks */
export const getTasksQuerySchema = z.object({
  status: taskStatusEnum.optional(),
  assignee: z.string().cuid().optional(),
  priority: priorityEnum.optional(),
  sort: sortFieldEnum.optional().default("createdAt"),
  order: sortOrderEnum.optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/** Body for POST /api/tasks */
export const createTaskBodySchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10_000).optional(),
  status: taskStatusEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: z.union([z.string(), z.date()]).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

/** Body for PATCH /api/tasks/[id] */
export const updateTaskBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10_000).optional().nullable(),
  status: taskStatusEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: z.union([z.string(), z.date()]).nullable().optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
  position: z.number().int().min(0).optional(),
});

export type GetTasksQuery = z.infer<typeof getTasksQuerySchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
