import { notFound } from "next/navigation";
import { getTaskById } from "@/lib/tasks";
import { TaskDetail } from "@/components/task/TaskDetail";

export default async function TaskModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) notFound();
  return <TaskDetail task={task} />;
}
