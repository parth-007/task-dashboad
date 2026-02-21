import type { Prisma } from "@prisma/client";

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: { assignee: true; tags: true };
}>;
