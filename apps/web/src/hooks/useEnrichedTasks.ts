import { useEffect, useState } from "react";
import type { Task, User } from "@/types";
import { usersService } from "@/services/users.service";

export interface EnrichedTask extends Task {
  assignedUsers?: User[];
}

export function useEnrichedTasks(tasks: Task[]) {
  const [enrichedTasks, setEnrichedTasks] = useState<EnrichedTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0 && tasks.length > 0) {
      enrichTasks();
    }
  }, [users, tasks]);

  const loadUsers = async () => {
    try {
      const usersList = await usersService.getAll();
      setUsers(usersList);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const enrichTasks = () => {
    const enriched = tasks.map((task) => {
      const assignedUserIds = task.assignments?.map((a) => a.userId) || [];
      const assignedUsers = users.filter((u) => assignedUserIds.includes(u.id));
      
      return {
        ...task,
        assignedUsers,
      };
    });
    
    setEnrichedTasks(enriched);
  };

  return { enrichedTasks, users, isLoading };
}
