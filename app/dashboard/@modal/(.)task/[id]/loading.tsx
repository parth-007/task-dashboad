export default function TaskModalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
      <div className="text-sm text-muted-foreground">Loading task…</div>
    </div>
  );
}
