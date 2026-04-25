import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Moon, Sun, LogOut } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsPanel } from "./NotificationsPanel";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { products, batches, sales } from "@/data/seed";
import { GlobalSearch } from "./GlobalSearch";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = {
  super_admin: "bg-primary text-primary-foreground",
  pharmacist: "bg-info text-info-foreground",
  cashier: "bg-warning text-warning-foreground",
  viewer: "bg-muted text-muted-foreground",
};
const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  pharmacist: "Pharmacist",
  cashier: "Cashier",
  viewer: "Viewer",
};

export function Topbar({ title }: { title?: string }) {
  const { user, logout, branch } = useApp();
  const { theme, toggle } = useTheme();
  const [openNotif, setOpenNotif] = useState(false);
  const [read, setRead] = useState(false);
  const nav = useNavigate();

  const notifCount = useMemo(() => {
    const lowStock = products.filter((p) => {
      const qty = branch.id === "br_main" ? p.stockMain : p.stockUpanga;
      return qty <= p.reorderPoint;
    }).length;
    const expiring = batches.filter((b) => {
      const days = Math.floor((+new Date(b.expiryDate) - Date.now()) / 86400000);
      return days <= 90 && days >= 0;
    }).length;
    const failed = sales.filter((s) => s.traStatus === "FAILED").length;
    const zReport = new Date().getHours() >= 18 ? 1 : 0;
    return lowStock + expiring + failed + zReport;
  }, [branch.id]);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <GlobalSearch />
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="relative" onClick={() => { setOpenNotif(true); }}>
            <Bell className="h-4 w-4" />
            {!read && notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center num">
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2 gap-2">
                <div className="h-7 w-7 rounded-full bg-primary-muted text-primary flex items-center justify-center text-xs font-semibold">
                  {user?.name.split(" ").map((n) => n[0]).slice(0,2).join("")}
                </div>
                <span className="hidden md:inline text-sm">{user?.name.split(" ")[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); nav("/login"); }}>
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <NotificationsPanel open={openNotif} onClose={() => setOpenNotif(false)} onMarkAllRead={() => setRead(true)} />
    </header>
  );
}
