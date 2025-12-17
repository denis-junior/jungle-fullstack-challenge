import { createFileRoute } from "@tanstack/react-router";
import { TaskDetailPage } from "@/pages/TaskDetailPage";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskDetailPage,
});
