export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-w-[280px] rounded-lg border bg-muted/30 p-3 animate-pulse"
          >
            <div className="mb-2 h-5 w-24 rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-20 rounded bg-muted" />
              <div className="h-20 rounded bg-muted" />
              <div className="h-20 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
