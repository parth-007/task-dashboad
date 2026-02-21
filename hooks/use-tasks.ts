"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskWithRelations } from "@/lib/types";
import type { TaskFilters } from "@/lib/tasks";
import { fetchTasks } from "@/lib/tasks";
import {
  createTaskAction,
  updateTaskAction,
  updateTaskStatusAction,
} from "@/app/actions";

/** Base key for all task queries. Use with getTasksQueryKey(filters) for list, or invalidate [TASKS_QUERY_KEY] to invalidate all. */
export const TASKS_QUERY_KEY = "tasks" as const;

export function getTasksQueryKey(filters: TaskFilters = {}) {
  const { status, assignee, priority } = filters;
  return [TASKS_QUERY_KEY, { status, assignee, priority }] as const;
}

/** Invalidate all task list queries (e.g. after create/update from modal). */
export function invalidateTasksQuery(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
}

/** Fetch tasks list with filters. Use for the board and any filtered list. */
export function useTasks(
  filters: TaskFilters,
  initialTasks?: TaskWithRelations[]
) {
  const queryKey = getTasksQueryKey(filters);
  return useQuery({
    queryKey,
    queryFn: () => fetchTasks(filters),
    initialData: initialTasks,
  });
}

/** Create task mutation. On success invalidates task queries. */
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaskAction,
    onSuccess: (result) => {
      if (result.success) invalidateTasksQuery(queryClient);
    },
  });
}

/** Update task (full or partial). Caller handles optimistic update and invalidateTasksQuery. */
export function useUpdateTaskMutation() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateTaskAction>[1] }) =>
      updateTaskAction(id, body),
  });
}

/** Update only task status (e.g. drag-and-drop). Optimistic update + rollback built in. */
export function useUpdateTaskStatusMutation(filters: TaskFilters) {
  const queryClient = useQueryClient();
  const queryKey = getTasksQueryKey(filters);

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const result = await updateTaskStatusAction(id, status);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<TaskWithRelations[]>(queryKey);
      queryClient.setQueryData<TaskWithRelations[]>(queryKey, (old) =>
        (old ?? []).map((t) =>
          t.id === id ? { ...t, status: status as TaskWithRelations["status"] } : t
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
