import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { Layout } from "@/components/layout/Layout";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <Layout>
            <Outlet />
          </Layout>
          {import.meta.env.DEV && <TanStackRouterDevtools />}
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  ),
});
