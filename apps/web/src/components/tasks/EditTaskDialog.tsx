import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelectUsers } from "@/components/ui/multi-select-users";
import type { Task, User } from "@/types";
import { TaskPriority, TaskStatus } from "@/types";
import { tasksService } from "@/services/tasks.service";
import { usersService } from "@/services/users.service";
import { Edit } from "lucide-react";

const taskSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres"),
  description: z.string().min(10, "Mínimo 10 caracteres"),
  deadline: z.string().optional(),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
  assignedUserIds: z.array(z.string()).optional(),
});

interface EditTaskDialogProps {
  task: Task;
  onSuccess?: () => void;
}

export const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  task,
  onSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    task.assignments?.map((a) => a.userId) || []
  );

  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      deadline: task.deadline
        ? new Date(task.deadline).toISOString().split("T")[0]
        : "",
      priority: task.priority,
      status: task.status,
      assignedUserIds: task.assignments?.map((a) => a.userId) || [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSelectedUserIds(task.assignments?.map((a) => a.userId) || []);
    }
  }, [isOpen, task]);

  const loadUsers = async () => {
    try {
      const usersList = await usersService.getAll();
      setUsers(usersList);
    } catch (error) {
      toast.error("Erro ao carregar usuários");
    }
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        assignedUserIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      };
      await tasksService.updateTask(task.id, payload);
      toast.success("Tarefa atualizada com sucesso!");
      setIsOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erro ao atualizar tarefa", {
        description: error.response?.data?.message || "Erro desconhecido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
          <DialogDescription>Atualize os detalhes da tarefa</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label>Descrição *</Label>
            <Textarea {...form.register("description")} rows={4} />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label>Atribuir Usuários</Label>
            <MultiSelectUsers
              users={users}
              selectedUserIds={selectedUserIds}
              onChange={setSelectedUserIds}
              placeholder="Selecionar usuários..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Prazo</Label>
              <Input type="date" {...form.register("deadline")} />
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(value) =>
                  form.setValue("priority", value as TaskPriority)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Baixa</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Média</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>Alta</SelectItem>
                  <SelectItem value={TaskPriority.URGENT}>Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) =>
                  form.setValue("status", value as TaskStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.TODO}>A Fazer</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>
                    Em Progresso
                  </SelectItem>
                  <SelectItem value={TaskStatus.REVIEW}>Em Revisão</SelectItem>
                  <SelectItem value={TaskStatus.DONE}>Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
