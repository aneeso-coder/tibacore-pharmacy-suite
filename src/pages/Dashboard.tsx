import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import AdminDashboard from "./dashboards/AdminDashboard";
import PharmacistDashboard from "./dashboards/PharmacistDashboard";
import CashierDashboard from "./dashboards/CashierDashboard";
import ViewerDashboard from "./dashboards/ViewerDashboard";

export default function Dashboard() {
  const { user } = useApp();
  const role = user?.role;

  const Body = useMemo(() => {
    switch (role) {
      case "super_admin": return <AdminDashboard />;
      case "pharmacist": return <PharmacistDashboard />;
      case "cashier": return <CashierDashboard />;
      case "viewer": return <ViewerDashboard />;
      default: return null;
    }
  }, [role]);

  return <AppLayout title="Dashboard">{Body}</AppLayout>;
}
