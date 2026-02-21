type ColumnHeaderProps = {
  title: string;
  count: number;
};

export function ColumnHeader({ title, count }: ColumnHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {count}
      </span>
    </div>
  );
}
