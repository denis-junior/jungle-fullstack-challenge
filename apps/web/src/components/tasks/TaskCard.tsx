import { Link } from "@tanstack/react-router";
import type { Task, User } from "@/types";
import { TaskPriority, TaskStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatars } from "@/components/ui/user-avatars";
import { Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskCardProps {
  task: Task;
  users?: User[];
}

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

export const TaskCard: React.FC<TaskCardProps> = ({ task, users = [] }) => {
  const assignedUserIds = task.assignments?.map((a) => a.userId) || [];
  const assignedUsernames = users
    .filter((u) => assignedUserIds.includes(u.id))
    .map((u) => u.username);
  return (
    <Link to="/tasks/$taskId" params={{ taskId: task.id }}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">{task.title}</CardTitle>
            <div className="flex gap-1 flex-shrink-0">
              <Badge className={priorityColors[task.priority]}>
                {priorityLabels[task.priority]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Badge className={statusColors[task.status]}>
              {statusLabels[task.status]}
            </Badge>

            {task.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(task.deadline), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            )}

            {assignedUsernames.length > 0 && (
              <div className="flex items-center gap-2">
                <UserAvatars usernames={assignedUsernames} size="sm" maxDisplay={3} />
              </div>
            )}

            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{task.comments.length}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
