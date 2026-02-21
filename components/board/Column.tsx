"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Status } from "@prisma/client";
import type { TaskWithRelations } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/constants";
import { ColumnHeader } from "./ColumnHeader";
import { TaskCard } from "../task/TaskCard";

const ROW_HEIGHT = 120;
const USE_VIRTUAL_THRESHOLD = 200;

type ColumnProps = {
  status: Status;
  tasks: TaskWithRelations[];
  focusedTaskKey?: string | null;
  onTaskFocus?: (id: string | null) => void;
  registerCardRef?: (id: string, el: HTMLDivElement | null) => void;
};

export function Column({
  status,
  tasks,
  focusedTaskKey = null,
  onTaskFocus,
  registerCardRef,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const label = STATUS_LABELS[status];
  const parentRef = useRef<HTMLDivElement>(null);
  const useVirtual = tasks.length >= USE_VIRTUAL_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const cardProps = {
    focusedTaskKey,
    onTaskFocus: onTaskFocus ?? (() => {}),
    registerCardRef: registerCardRef ?? (() => {}),
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-[280px] flex-col rounded-lg border bg-muted/30 p-3 transition-colors",
        isOver && "bg-muted/60 ring-2 ring-primary/30"
      )}
    >
      <ColumnHeader title={label} count={tasks.length} />
      <div
        ref={parentRef}
        className={cn(
          "flex-1 overflow-y-auto",
          useVirtual && "min-h-[400px] max-h-[70vh]"
        )}
      >
        {useVirtual ? (
          <div
            style={{
              height: virtualizer.getTotalSize() + "px",
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const task = tasks[virtualRow.index];
              const itemStyle = {
                position: "absolute" as const,
                top: 0,
                left: 0,
                width: "100%",
                transform: "translateY(" + String(virtualRow.start) + "px)",
              };
              return (
                <div key={task.id} style={itemStyle} className="pb-2">
                  <TaskCard task={task} {...cardProps} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} {...cardProps} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
