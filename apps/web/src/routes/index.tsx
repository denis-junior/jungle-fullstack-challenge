import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Redirecionar para /tasks
    throw redirect({ to: "/tasks" });
  },
});
