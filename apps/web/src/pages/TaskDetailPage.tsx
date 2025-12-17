import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { tasksService } from "@/services/tasks.service";
import { usersService } from "@/services/users.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { UserAvatars } from "@/components/ui/user-avatars";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { CommentSection } from "@/components/tasks/CommentSection";
import { TaskPriority, TaskStatus, type User } from "@/types";
import { ArrowLeft, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const priorityColors = {
  [TaskPriority.LOW]: "bg-blue-100 text-blue-800",
  [TaskPriority.MEDIUM]: "bg-yellow-100 text-yellow-800",
  [TaskPriority.HIGH]: "bg-orange-100 text-orange-800",
  [TaskPriority.URGENT]: "bg-red-100 text-red-800",
};

const statusColors = {
  [TaskStatus.TODO]: "bg-gray-100 text-gray-800",
  [TaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800",
  [TaskStatus.REVIEW]: "bg-purple-100 text-purple-800",
  [TaskStatus.DONE]: "bg-green-100 text-green-800",
};

const statusLabels = {
  [TaskStatus.TODO]: "A Fazer",
  [TaskStatus.IN_PROGRESS]: "Em Progresso",
  [TaskStatus.REVIEW]: "Em Revisão",
  [TaskStatus.DONE]: "Concluído",
};

const priorityLabels = {
  [TaskPriority.LOW]: "Baixa",
  [TaskPriority.MEDIUM]: "Média",
  [TaskPriority.HIGH]: "Alta",
  [TaskPriority.URGENT]: "Urgente",
};

export const TaskDetailPage = () => {
  const { taskId } = useParams({ from: "/tasks/$taskId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersList = await usersService.getAll();
      setUsers(usersList);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => tasksService.getTask(taskId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksService.deleteTask(taskId),
    onSuccess: () => {
      toast.success("Tarefa deletada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      navigate({ to: "/tasks" });
    },
    onError: (error: any) => {
      toast.error("Erro ao deletar tarefa", {
        description: error.response?.data?.message || "Erro desconhecido",
      });
    },
  });

  const handleBack = () => {
    navigate({ to: "/tasks" });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleTaskUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Tarefa não encontrada</h2>
        <Button onClick={handleBack}>Voltar para tarefas</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      {/* Task Details Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{task.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className={statusColors[task.status]}>
                  {statusLabels[task.status]}
                </Badge>
                <Badge className={priorityColors[task.priority]}>
                  {priorityLabels[task.priority]}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <EditTaskDialog task={task} onSuccess={handleTaskUpdated} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja deletar esta tarefa? Esta ação não
                      pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Deletar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {task.description}
            </p>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {task.deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Prazo</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(task.deadline), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            )}

            {task.assignments && task.assignments.length > 0 && (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">Atribuído a</p>
                  <UserAvatars
                    usernames={users
                      .filter((u) => task.assignments.map((a) => a.userId).includes(u.id))
                      .map((u) => u.username)}
                    size="md"
                    maxDisplay={5}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Criado em</p>
              <p className="text-muted-foreground">
                {format(new Date(task.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
            <div>
              <p className="font-medium">Última atualização</p>
              <p className="text-muted-foreground">
                {format(new Date(task.updatedAt), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <CommentSection taskId={taskId} />
    </div>
  );
};
