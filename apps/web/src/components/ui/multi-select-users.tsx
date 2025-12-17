import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { User } from "@/types";

interface MultiSelectUsersProps {
  users: User[];
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  placeholder?: string;
}

export function MultiSelectUsers({
  users,
  selectedUserIds,
  onChange,
  placeholder = "Selecionar usuários...",
}: MultiSelectUsersProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedUsers = users.filter((user) =>
    selectedUserIds.includes(user.id)
  );

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const handleRemove = (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(selectedUserIds.filter((id) => id !== userId));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          type="button"
        >
          <div className="flex gap-1 flex-wrap">
            {selectedUsers.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedUsers.map((user) => (
                <Badge key={user.id} variant="secondary" className="mr-1">
                  {user.username}
                  <button
                    type="button"
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRemove(user.id, e as any);
                      }
                    }}
                    onMouseDown={(e) => handleRemove(user.id, e)}
                    onClick={(e) => handleRemove(user.id, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex flex-col gap-2 p-2">
          <Input
            placeholder="Buscar usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
          <div className="max-h-64 overflow-auto">
            {filteredUsers.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum usuário encontrado.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSelect(user.id)}
                  className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-accent rounded-sm"
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedUserIds.includes(user.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <span className="text-sm">{user.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
