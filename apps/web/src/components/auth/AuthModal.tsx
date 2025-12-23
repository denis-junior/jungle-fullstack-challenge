import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { IAuthLogin, IAuthRegister } from "@/types";

const loginSchema = z.object({
  emailOrUsername: z.string().min(3, "Mínimo 3 caracteres"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Mínimo 3 caracteres"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
  });

  const handleLogin = async (data: IAuthLogin) => {
    try {
      await login(data);
      toast.success("Login realizado com sucesso!");
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao fazer login: ${errorMessage}`);
    }
  };

  const handleRegister = async (data: IAuthRegister) => {
    try {
      await register(data);
      toast.success("Cadastro realizado com sucesso!");
      onClose();
    } catch (error) {
      const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao cadastrar: ${errorMessage}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isLogin ? "Login" : "Cadastro"}</DialogTitle>
          <DialogDescription>
            {isLogin
              ? "Entre com suas credenciais"
              : "Crie sua conta gratuitamente"}
          </DialogDescription>
        </DialogHeader>

        {isLogin ? (
          <form
            onSubmit={loginForm.handleSubmit(handleLogin)}
            className="space-y-4"
          >
            <div>
              <Label>Email ou Username</Label>
              <Input {...loginForm.register("emailOrUsername")} />
              {loginForm.formState.errors.emailOrUsername && (
                <p className="text-sm text-red-500">
                  {loginForm.formState.errors.emailOrUsername.message}
                </p>
              )}
            </div>

            <div>
              <Label>Senha</Label>
              <Input type="password" {...loginForm.register("password")} />
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full">
              Entrar
            </Button>

            <p className="text-center text-sm">
              Não tem conta?{" "}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-primary underline"
              >
                Cadastre-se
              </button>
            </p>
          </form>
        ) : (
          <form
            onSubmit={registerForm.handleSubmit(handleRegister)}
            className="space-y-4"
          >
            <div>
              <Label>Email</Label>
              <Input type="email" {...registerForm.register("email")} />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label>Username</Label>
              <Input {...registerForm.register("username")} />
              {registerForm.formState.errors.username && (
                <p className="text-sm text-red-500">
                  {registerForm.formState.errors.username.message}
                </p>
              )}
            </div>

            <div>
              <Label>Senha</Label>
              <Input type="password" {...registerForm.register("password")} />
              {registerForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full">
              Cadastrar
            </Button>

            <p className="text-center text-sm">
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-primary underline"
              >
                Faça login
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
