import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskPriority, TaskStatus } from "@/types";
import { Search } from "lucide-react";

interface TaskFiltersProps {
  search: string;
  status: string;
  priority: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  search,
  status,
  priority,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tarefas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value={TaskStatus.TODO}>A Fazer</SelectItem>
          <SelectItem value={TaskStatus.IN_PROGRESS}>Em Progresso</SelectItem>
          <SelectItem value={TaskStatus.REVIEW}>Em Revisão</SelectItem>
          <SelectItem value={TaskStatus.DONE}>Concluído</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select value={priority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Prioridades</SelectItem>
          <SelectItem value={TaskPriority.LOW}>Baixa</SelectItem>
          <SelectItem value={TaskPriority.MEDIUM}>Média</SelectItem>
          <SelectItem value={TaskPriority.HIGH}>Alta</SelectItem>
          <SelectItem value={TaskPriority.URGENT}>Urgente</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
