"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/task/PriorityBadge";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/types";

function formatDueDate(date: Date | null) {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Card content only – used inside DragOverlay so the dragged card appears on top. */
export function TaskCardPreview({ task }: { task: TaskWithRelations }) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg ring-2 ring-primary/20 cursor-grabbing w-[260px]">
      <p className="font-medium text-sm text-foreground line-clamp-2">
        {task.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {task.assignee ? (
          <Avatar size="sm" className="h-6 w-6">
            <AvatarImage src={task.assignee.image ?? undefined} />
            <AvatarFallback className="text-xs">
              {task.assignee.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((t) => (
              <Badge
                key={t.id}
                variant="outline"
                className="text-[10px] px-1.5 py-0"
              >
                {t.name}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskCard({
  task,
  isDragging,
  focusedTaskKey,
  onTaskFocus,
  registerCardRef,
}: {
  task: TaskWithRelations;
  isDragging?: boolean;
  focusedTaskKey?: string | null;
  onTaskFocus?: (id: string | null) => void;
  registerCardRef?: (id: string, el: HTMLDivElement | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dndDragging,
  } = useDraggable({ id: task.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const dragging = dndDragging ?? isDragging;
  const focused = focusedTaskKey === task.id;

  const refCallback = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    registerCardRef?.(task.id, el);
  };

  return (
    <div
      ref={refCallback}
      style={style}
      tabIndex={focused ? 0 : -1}
      onFocus={() => onTaskFocus?.(task.id)}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm transition-shadow outline-none",
        dragging && "opacity-0 ring-2 ring-primary/20",
        focused && "ring-2 ring-ring"
      )}
    >
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
        <Link
          href={`/dashboard/task/${task.id}`}
          className="block focus:outline-none focus:ring-2 focus:ring-ring rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-medium text-sm text-foreground line-clamp-2">
            {task.title}
          </p>
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          {task.assignee ? (
            <Avatar size="sm" className="h-6 w-6">
              <AvatarImage src={task.assignee.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {task.assignee.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 2).map((t) => (
                <Badge
                  key={t.id}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  {t.name}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
