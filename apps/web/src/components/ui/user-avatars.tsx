import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarsProps {
  usernames: string[];
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
}

export function UserAvatars({
  usernames,
  maxDisplay = 3,
  size = "md",
}: UserAvatarsProps) {
  const displayedUsers = usernames.slice(0, maxDisplay);
  const remainingCount = Math.max(0, usernames.length - maxDisplay);

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (usernames.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">Não atribuída</span>
    );
  }

  return (
    <div className="flex items-center -space-x-2">
      {displayedUsers.map((username, index) => (
        <Avatar
          key={index}
          className={cn(
            sizeClasses[size],
            "border-2 border-background ring-1 ring-border"
          )}
          title={username}
        >
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(username)}
          </AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <Avatar
          className={cn(
            sizeClasses[size],
            "border-2 border-background ring-1 ring-border"
          )}
          title={`+${remainingCount} mais`}
        >
          <AvatarFallback className="bg-muted text-muted-foreground">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
