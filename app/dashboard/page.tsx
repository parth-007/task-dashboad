import { Suspense } from "react";
import { fetchTasks } from "@/lib/tasks";
import { Board } from "@/components/board/Board";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { AddTaskModal } from "@/components/dashboard/AddTaskModal";
import DashboardLoading from "./loading";

type PageProps = {
  searchParams: Promise<{ status?: string; assignee?: string; priority?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = {
    status: params.status,
    assignee: params.assignee,
    priority: params.priority,
  };
  const initialTasks = await fetchTasks(filters);
  return (
    <div className="min-h-screen bg-background p-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Task Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag cards between columns to update status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddTaskModal />
          <ConnectionStatus />
        </div>
      </header>
      <div className="mb-4">
        <FilterBar />
      </div>
      <Suspense fallback={<DashboardLoading />}>
        <Board initialTasks={initialTasks} initialFilters={filters} />
      </Suspense>
    </div>
  );
}
