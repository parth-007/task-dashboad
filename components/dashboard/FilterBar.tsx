"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BOARD_STATUSES, STATUS_LABELS, PRIORITIES, PRIORITY_LABELS } from "@/lib/constants";
import { fetchUsers } from "@/lib/tasks";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const status = searchParams.get("status") ?? "";
  const assignee = searchParams.get("assignee") ?? "";
  const priority = searchParams.get("priority") ?? "";

  function updateParams(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/dashboard?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className={cn(selectClass, "w-[160px]")}
        value={status || "all"}
        onChange={(e) => updateParams({ status: e.target.value === "all" ? "" : e.target.value })}
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        {BOARD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <select
        className={cn(selectClass, "w-[180px]")}
        value={assignee || "all"}
        onChange={(e) => updateParams({ assignee: e.target.value === "all" ? "" : e.target.value })}
        aria-label="Filter by assignee"
      >
        <option value="all">All assignees</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <select
        className={cn(selectClass, "w-[140px]")}
        value={priority || "all"}
        onChange={(e) => updateParams({ priority: e.target.value === "all" ? "" : e.target.value })}
        aria-label="Filter by priority"
      >
        <option value="all">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </select>
    </div>
  );
}
