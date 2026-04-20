import { NavLink } from "@/components/NavLink";
import { useApp, Permission } from "@/context/AppContext";
import { Wordmark } from "@/components/brand/Logo";
import {
  LayoutDashboard, ShoppingCart, Receipt, FileText, Users, Package, Boxes,
  Layers, ClipboardList, Truck, ShoppingBag, PackageCheck, BarChart3, FileBarChart,
  Wallet, FileCheck2, ShieldCheck, ScrollText, Settings, Cog, Building2, ChevronDown,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Item { to: string; label: string; icon: any; perm?: Permission }
interface Group { label: string; items: Item[]; perm?: Permission }

const groups: Group[] = [
  { label: "Main", items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Operations", items: [
    { to: "/pos", label: "Point of Sale", icon: ShoppingCart, perm: "pos" },
    { to: "/sales", label: "Sales History", icon: Receipt },
    { to: "/prescriptions", label: "Prescriptions", icon: FileText, perm: "inventory" },
    { to: "/customers", label: "Customers", icon: Users, perm: "inventory" },
    { to: "/debtors", label: "Debtors", icon: TrendingUp, perm: "debtors" },
    { to: "/invoices", label: "Invoices", icon: FileText, perm: "invoices" },
  ]},
  { label: "Inventory", perm: "inventory", items: [
    { to: "/products", label: "Products", icon: Package },
    { to: "/stock", label: "Stock Levels", icon: Boxes },
    { to: "/batches", label: "Batch Tracker", icon: Layers },
    { to: "/adjustments", label: "Adjustments", icon: ClipboardList },
  ]},
  { label: "Purchasing", perm: "purchasing", items: [
    { to: "/purchase-orders", label: "Purchase Orders", icon: ShoppingBag },
    { to: "/suppliers", label: "Suppliers", icon: Truck },
    { to: "/grn", label: "Goods Received", icon: PackageCheck },
    { to: "/creditors", label: "Creditors", icon: TrendingDown, perm: "creditors" },
  ]},
  { label: "Reports", perm: "reports", items: [
    { to: "/reports/sales", label: "Sales Reports", icon: BarChart3 },
    { to: "/reports/stock", label: "Stock Reports", icon: FileBarChart },
    { to: "/reports/financial", label: "Financial Reports", icon: Wallet },
    { to: "/reports/tra", label: "TRA Summary", icon: FileCheck2 },
  ]},
  { label: "Admin", perm: "users", items: [
    { to: "/admin/users", label: "Users & Roles", icon: ShieldCheck },
    { to: "/admin/audit", label: "Audit Log", icon: ScrollText, perm: "audit" },
    { to: "/admin/tra", label: "TRA / VFD Settings", icon: Settings, perm: "tra_settings" },
    { to: "/admin/system", label: "System Settings", icon: Cog, perm: "system_settings" },
  ]},
];

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

export function AppSidebar() {
  const { user, branch, branches, setBranch, can } = useApp();
  if (!user) return null;

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="px-4 py-4 border-b border-sidebar-border">
        <Wordmark />
      </div>

      <div className="px-3 py-3 border-b border-sidebar-border space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm hover:bg-sidebar-accent transition">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-left min-w-0">
                <div className="truncate font-medium">{branch.name}</div>
                <div className="truncate text-[11px] text-muted-foreground">{branch.location}</div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="start">
            {branches.map((b) => (
              <DropdownMenuItem key={b.id} onClick={() => setBranch(b)} disabled={user.branchId !== "ALL" && user.branchId !== b.id}>
                <Building2 className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{b.name}</span>
                  <span className="text-xs text-muted-foreground">{b.location}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 px-1">
          <div className="h-8 w-8 rounded-full bg-primary-muted text-primary flex items-center justify-center text-sm font-semibold">
            {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <Badge className={cn("text-[10px] h-4 px-1.5 font-medium border-0", roleColors[user.role])}>
              {roleLabels[user.role]}
            </Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {groups.map((g) => {
          if (g.perm && !can(g.perm)) return null;
          const items = g.items.filter((i) => !i.perm || can(i.perm));
          if (!items.length) return null;
          return (
            <div key={g.label}>
              <div className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {g.label}
              </div>
              <div className="space-y-0.5">
                {items.map((i) => {
                  const Icon = i.icon;
                  return (
                    <NavLink
                      key={i.to}
                      to={i.to}
                      end={i.to === "/"}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition"
                      activeClassName="!bg-sidebar-accent !text-sidebar-accent-foreground font-medium"
                    >
                      <Icon className="h-4 w-4" />
                      {i.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
