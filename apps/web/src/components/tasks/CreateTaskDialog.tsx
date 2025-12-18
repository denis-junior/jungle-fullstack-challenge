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
import { TaskPriority, TaskStatus, type ITaskSubmit, type User } from "@/types";
import { tasksService } from "@/services/tasks.service";
import { usersService } from "@/services/users.service";
import { Plus } from "lucide-react";

const taskSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres"),
  description: z.string().min(10, "Mínimo 10 caracteres"),
  deadline: z.string().optional(),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
  assignedUserIds: z.array(z.string()).optional(),
});

interface CreateTaskDialogProps {
  onSuccess?: () => void;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  onSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: "",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      assignedUserIds: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const usersList = await usersService.getAll();
      setUsers(usersList);
    } catch (error) {
      toast.error("Erro ao carregar usuários");
    }
  };

  const handleSubmit = async (data: z.infer<typeof taskSchema>) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        assignedUserIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      };
      await tasksService.createTask(payload);
      toast.success("Tarefa criada com sucesso!");
      setIsOpen(false);
      form.reset();
      setSelectedUserIds([]);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error 
      ? error.message 
      : (error as any)?.response?.data?.message || "Erro desconhecido";
      
      toast.error("Erro ao criar tarefa", {
      description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
          <DialogDescription>Preencha os detalhes da tarefa</DialogDescription>
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
              {isLoading ? "Criando.. ." : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
