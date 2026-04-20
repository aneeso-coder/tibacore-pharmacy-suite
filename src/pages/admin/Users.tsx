import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { users, branches } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Check, Minus } from "lucide-react";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const roleLabels: any = { super_admin: "Super Admin", pharmacist: "Pharmacist", cashier: "Cashier", viewer: "Viewer" };
const roleClass: any = {
  super_admin: "bg-primary text-primary-foreground",
  pharmacist: "bg-info text-info-foreground",
  cashier: "bg-warning text-warning-foreground",
  viewer: "bg-muted text-muted-foreground",
};

const matrix = [
  { module: "Dashboard",      sa: true,  ph: true,  ca: false, vw: true },
  { module: "Point of Sale",  sa: true,  ph: true,  ca: true,  vw: false },
  { module: "Sales History",  sa: true,  ph: true,  ca: "own", vw: false },
  { module: "Inventory",      sa: true,  ph: true,  ca: false, vw: false },
  { module: "Purchasing",     sa: true,  ph: true,  ca: false, vw: false },
  { module: "Reports",        sa: true,  ph: true,  ca: false, vw: true },
  { module: "Buying Prices",  sa: true,  ph: false, ca: false, vw: false },
  { module: "User Management",sa: true,  ph: false, ca: false, vw: false },
  { module: "TRA Settings",   sa: true,  ph: false, ca: false, vw: false },
  { module: "Audit Log",      sa: true,  ph: false, ca: false, vw: false },
];

export default function Users() {
  return (
    <AppLayout title="Users & Roles">
      <PageHeader title="Users & Roles" description={`${users.length} users`}
        actions={<Button><Plus className="h-4 w-4 mr-1.5" /> Add User</Button>} />
      <Card className="overflow-hidden mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-xs">{u.email}</TableCell>
                <TableCell><Badge className={cn("border-0", roleClass[u.role])}>{roleLabels[u.role]}</Badge></TableCell>
                <TableCell className="text-xs">{u.branchId === "ALL" ? "All branches" : branches.find((b) => b.id === u.branchId)?.name}</TableCell>
                <TableCell className="num text-xs text-muted-foreground">{u.lastLogin ? fmtDateTime(u.lastLogin) : "—"}</TableCell>
                <TableCell className="text-right"><Switch defaultChecked={u.active} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <PageHeader title="Permissions Matrix" description="Reference for role-based access control" />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead className="text-center">Super Admin</TableHead>
              <TableHead className="text-center">Pharmacist</TableHead>
              <TableHead className="text-center">Cashier</TableHead>
              <TableHead className="text-center">Viewer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrix.map((m) => (
              <TableRow key={m.module}>
                <TableCell className="font-medium">{m.module}</TableCell>
                {(["sa","ph","ca","vw"] as const).map((k) => (
                  <TableCell key={k} className="text-center">
                    {m[k] === true ? <Check className="h-4 w-4 text-success inline" />
                      : m[k] === "own" ? <span className="text-xs text-warning">Own only</span>
                      : <Minus className="h-4 w-4 text-muted-foreground inline" />}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AppLayout>
  );
}
