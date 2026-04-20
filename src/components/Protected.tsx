import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useApp, Permission } from "@/context/AppContext";

export function Protected({ children, perm }: { children: ReactNode; perm?: Permission }) {
  const { user, can } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (perm && !can(perm)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
