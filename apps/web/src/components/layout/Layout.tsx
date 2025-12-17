import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6">{children}</main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          TaskManager © 2025 - Sistema de Gestão de Tarefas Colaborativo
        </div>
      </footer>
    </div>
  );
};
