import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { tasksService } from "@/services/tasks.service";
import { usersService } from "@/services/users.service";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import type { User } from "@/types";

export const TasksPage = () => {
  const { isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  const loadUsers = async () => {
    try {
      const usersList = await usersService.getAll();
      setUsers(usersList);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tasks", page, status, priority, search],
    queryFn: () =>
      tasksService.getTasks({
        page,
        size: 12,
        status: status !== "all" ? status : undefined,
        priority: priority !== "all" ? priority : undefined,
        search: search || undefined,
      }),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-4xl font-bold mb-4">Bem-vindo ao TaskManager</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Sistema de gestão de tarefas colaborativo com notificações em tempo
            real
          </p>
          <Button size="lg" onClick={() => setIsAuthModalOpen(true)}>
            Entrar ou Cadastrar
          </Button>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minhas Tarefas</h1>
          <p className="text-muted-foreground">
            Gerencie suas tarefas de forma eficiente
          </p>
        </div>
        <CreateTaskDialog onSuccess={() => refetch()} />
      </div>

      {/* Filters */}
      <TaskFilters
        search={search}
        status={status}
        priority={priority}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
      />

      {/* Tasks Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((task) => (
              <TaskCard key={task.id} task={task} users={users} />
            ))}
          </div>

          {/* Pagination */}
          {data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4">
                Página {page} de {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === data.meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhuma tarefa encontrada
          </p>
          <CreateTaskDialog onSuccess={() => refetch()} />
        </div>
      )}
    </div>
  );
};
