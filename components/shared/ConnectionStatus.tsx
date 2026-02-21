"use client";

import { useSSE } from "@/hooks/use-sse";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateTasksQuery } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";

export function ConnectionStatus() {
  const queryClient = useQueryClient();
  const { status } = useSSE(() => invalidateTasksQuery(queryClient));

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs",
        status === "connected" && "text-green-600 dark:text-green-400",
        status === "reconnecting" && "text-amber-600 dark:text-amber-400",
        status === "disconnected" && "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status === "connected" && "bg-green-500",
          status === "reconnecting" && "bg-amber-500 animate-pulse",
          status === "disconnected" && "bg-muted-foreground"
        )}
      />
      {status === "connected" && "Live"}
      {status === "reconnecting" && "Reconnecting…"}
      {status === "disconnected" && "Offline"}
    </div>
  );
}
