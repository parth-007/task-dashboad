"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { TaskWithRelations } from "@/lib/types";
import type { TaskFilters } from "@/lib/tasks";
import { BOARD_STATUSES } from "@/lib/constants";
import { Column } from "./Column";
import { ColumnErrorBoundary } from "./ColumnErrorBoundary";
import { TaskCard } from "../task/TaskCard";
import { useTasks, useUpdateTaskStatusMutation } from "@/hooks/use-tasks";

export function Board({
  initialTasks,
  initialFilters = {},
}: {
  initialTasks: TaskWithRelations[];
  initialFilters?: TaskFilters;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rollbackToast, setRollbackToast] = useState(false);
  const [retryCounts, setRetryCounts] = useState<Record<string, number>>({});
  const [focusedTaskKey, setFocusedTaskKey] = useState<string | null>(null);
  const cardRefsMap = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const filters: TaskFilters = {
    status: initialFilters.status,
    assignee: initialFilters.assignee,
    priority: initialFilters.priority,
  };

  const { data: tasks = initialTasks } = useTasks(filters, initialTasks);
  const statusMutation = useUpdateTaskStatusMutation(filters);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;
      const taskId = String(active.id);
      const newStatus = over.id as TaskWithRelations["status"];
      if (!BOARD_STATUSES.includes(newStatus)) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;
      statusMutation.mutate(
        { id: taskId, status: newStatus },
        { onError: () => setRollbackToast(true) }
      );
    },
    [tasks, statusMutation]
  );

  const orderedTaskIds = BOARD_STATUSES.flatMap((status) =>
    tasks.filter((t) => t.status === status).map((t) => t.id)
  );
  const focusedIndex =
    focusedTaskKey !== null ? orderedTaskIds.indexOf(focusedTaskKey) : -1;

  const handleBoardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (focusedIndex < 0) return;
      let nextIndex = focusedIndex;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = Math.min(focusedIndex + 1, orderedTaskIds.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = Math.max(focusedIndex - 1, 0);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (focusedTaskKey) router.push(`/dashboard/task/${focusedTaskKey}`);
        return;
      } else return;
      if (nextIndex !== focusedIndex && orderedTaskIds[nextIndex]) {
        setFocusedTaskKey(orderedTaskIds[nextIndex]);
        const el = cardRefsMap.current.get(orderedTaskIds[nextIndex]);
        el?.focus();
      }
    },
    [focusedIndex, focusedTaskKey, orderedTaskIds, router]
  );

  const registerCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) cardRefsMap.current.set(id, el);
    else cardRefsMap.current.delete(id);
  }, []);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  useEffect(() => {
    if (!rollbackToast) return;
    const t = setTimeout(() => setRollbackToast(false), 4000);
    return () => clearTimeout(t);
  }, [rollbackToast]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {rollbackToast && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg border bg-destructive/10 text-destructive px-4 py-2 text-sm font-medium shadow-lg"
        >
          Update failed. Changes reverted.
        </div>
      )}
      <div
        className="flex gap-4 overflow-x-auto pb-4"
        onKeyDown={handleBoardKeyDown}
      >
        {BOARD_STATUSES.map((status) => (
          <ColumnErrorBoundary
            key={`${status}-${retryCounts[status] ?? 0}`}
            columnLabel={status.replace("_", " ")}
            onRetry={() =>
              setRetryCounts((c) => ({ ...c, [status]: (c[status] ?? 0) + 1 }))
            }
          >
            <Column
              status={status}
              tasks={tasks.filter((t) => t.status === status)}
              focusedTaskKey={focusedTaskKey}
              onTaskFocus={setFocusedTaskKey}
              registerCardRef={registerCardRef}
            />
          </ColumnErrorBoundary>
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
