import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { tasksService } from "@/services/tasks.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const commentSchema = z.object({
  content: z.string().min(1, "Comentário não pode estar vazio"),
});

interface CommentSectionProps {
  taskId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ taskId }) => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: commentsData, isLoading } = useQuery({
    queryKey: ["comments", taskId, page],
    queryFn: () => tasksService.getComments(taskId, { page, size: 10 }),
  });

  const form = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) =>
      tasksService.createComment(taskId, content),
    onSuccess: () => {
      toast.success("Comentário adicionado! ");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar comentário", {
        description: error.response?.data?.message || "Erro desconhecido",
      });
    },
  });

  const handleSubmit = (data: any) => {
    createCommentMutation.mutate(data.content);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentários
          {commentsData && (
            <span className="text-sm text-muted-foreground">
              ({commentsData.meta.total})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Textarea
            placeholder="Adicione um comentário..."
            {...form.register("content")}
            rows={3}
          />
          {form.formState.errors.content && (
            <p className="text-sm text-red-500">
              {form.formState.errors.content.message}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={createCommentMutation.isPending}>
              <Send className="mr-2 h-4 w-4" />
              {createCommentMutation.isPending ? "Enviando..." : "Comentar"}
            </Button>
          </div>
        </form>

        <Separator />

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : commentsData && commentsData.data.length > 0 ? (
          <>
            <div className="space-y-6">
              {commentsData.data.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {comment.user?.username
                        ? comment.user.username.substring(0, 2).toUpperCase()
                        : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.user?.username || "Usuário desconhecido"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(comment.createdAt),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {commentsData.meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Página {page} de {commentsData.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === commentsData.meta.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum comentário ainda</p>
            <p className="text-sm">Seja o primeiro a comentar!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
