import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { users as seedUsers, branches } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Check, Minus, Pencil, Settings2 } from "lucide-react";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui-ext/PhoneInput";
import { toast } from "sonner";

const roleLabels: any = { super_admin: "Super Admin", pharmacist: "Pharmacist", cashier: "Cashier", viewer: "Viewer" };
const roleClass: any = {
  super_admin: "bg-primary text-primary-foreground",
  pharmacist: "bg-info text-info-foreground",
  cashier: "bg-warning text-warning-foreground",
  viewer: "bg-muted text-muted-foreground",
};

const initialMatrix = [
  { module: "Dashboard",      sa: true,  ph: true,  ca: false, vw: true },
  { module: "Point of Sale",  sa: true,  ph: true,  ca: true,  vw: false },
  { module: "Sales History",  sa: true,  ph: true,  ca: "own", vw: false },
  { module: "Inventory",      sa: true,  ph: true,  ca: false, vw: false },
  { module: "Purchasing",     sa: true,  ph: true,  ca: false, vw: false },
  { module: "Reports",        sa: true,  ph: true,  ca: false, vw: true },
  { module: "Buying Prices",  sa: true,  ph: true,  ca: false, vw: false },
  { module: "Adjustments",    sa: true,  ph: true,  ca: false, vw: false },
  { module: "Prescriptions",  sa: true,  ph: true,  ca: false, vw: false },
  { module: "Debtors",        sa: true,  ph: false, ca: false, vw: false },
  { module: "Creditors",      sa: true,  ph: false, ca: false, vw: false },
  { module: "Invoices",       sa: true,  ph: false, ca: false, vw: false },
  { module: "User Management",sa: true,  ph: false, ca: false, vw: false },
  { module: "TRA Settings",   sa: true,  ph: false, ca: false, vw: false },
  { module: "Audit Log",      sa: true,  ph: false, ca: false, vw: false },
];

export default function Users() {
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [matrix, setMatrix] = useState(initialMatrix);
  const [editMatrix, setEditMatrix] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [customRoleOpen, setCustomRoleOpen] = useState(false);

  const toggleCell = (rowIdx: number, key: "sa"|"ph"|"ca"|"vw") => {
    setMatrix((m) => m.map((r, i) => i === rowIdx ? { ...r, [key]: r[key] === true ? false : true } : r));
    setDirty(true);
  };

  return (
    <AppLayout title="Users & Roles">
      <PageHeader title="Users & Roles" description={`${seedUsers.length} users`}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Add User</Button>} />
      <Card className="overflow-hidden mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seedUsers.map((u) => (
              <TableRow key={u.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setEditUser(u)}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-xs">{u.email}</TableCell>
                <TableCell><Badge className={cn("border-0", roleClass[u.role])}>{roleLabels[u.role]}</Badge></TableCell>
                <TableCell className="text-xs">{u.branchId === "ALL" ? "All branches" : branches.find((b) => b.id === u.branchId)?.name}</TableCell>
                <TableCell className="num text-xs text-muted-foreground">{u.lastLogin ? fmtDateTime(u.lastLogin) : "—"}</TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}><Switch defaultChecked={u.active} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" onClick={() => setEditUser(u)}><Pencil className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-medium">Role Management</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Permissions matrix for role-based access control</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setCustomRoleOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Custom Role
            </Button>
            <Button size="sm" variant={editMatrix ? "default" : "outline"} onClick={() => setEditMatrix((v) => !v)}>
              <Settings2 className="h-4 w-4 mr-1.5" /> {editMatrix ? "Done Editing" : "Edit Permissions"}
            </Button>
          </div>
        </div>
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
            {matrix.map((m, idx) => (
              <TableRow key={m.module}>
                <TableCell className="font-medium">{m.module}</TableCell>
                {(["sa","ph","ca","vw"] as const).map((k) => {
                  const v = m[k];
                  const original = initialMatrix[idx][k];
                  const changed = v !== original;
                  return (
                    <TableCell key={k} className={cn("text-center", changed && "bg-warning/10")}>
                      {editMatrix ? (
                        <Switch checked={v === true} onCheckedChange={() => toggleCell(idx, k)} />
                      ) : v === true ? <Check className="h-4 w-4 text-success inline" />
                        : v === "own" ? <span className="text-xs text-warning">Own only</span>
                        : <Minus className="h-4 w-4 text-muted-foreground inline" />}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {editMatrix && dirty && (
          <div className="p-4 border-t flex justify-end">
            <Button onClick={() => { toast.success("Role permissions updated (demo)"); setDirty(false); }}>
              Save Role Permissions
            </Button>
          </div>
        )}
      </Card>

      <UserSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <UserSheet open={!!editUser} onClose={() => setEditUser(null)} user={editUser} />

      <Sheet open={customRoleOpen} onOpenChange={(o) => !o && setCustomRoleOpen(false)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>Add Custom Role</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-5">
            <div><Label>Role Name</Label><Input className="mt-1.5" placeholder="e.g. Inventory Clerk" /></div>
            <div><Label>Description</Label><Textarea className="mt-1.5" rows={2} placeholder="What can this role do?" /></div>
            <div>
              <Label className="mb-2 block">Permissions</Label>
              <div className="border rounded-md divide-y max-h-72 overflow-y-auto">
                {initialMatrix.map((m) => (
                  <div key={m.module} className="flex items-center justify-between p-2.5">
                    <span className="text-sm">{m.module}</span>
                    <Switch />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SheetFooter className="mt-5">
            <Button variant="outline" onClick={() => setCustomRoleOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success("Custom role created (demo)"); setCustomRoleOpen(false); }}>Create Role</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

function UserSheet({ open, onClose, user }: { open: boolean; onClose: () => void; user?: any }) {
  const [role, setRole] = useState<string>(user?.role ?? "cashier");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const strength = pwd.length === 0 ? null : pwd.length < 6 ? "short" : pwd.length < 8 ? "weak" : /[a-z]/i.test(pwd) && /\d/.test(pwd) ? "good" : "weak";
  const match = pwd && pwd === pwd2;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>{user ? "Edit User" : "Add User"}</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-5">
          <div><Label>Full Name *</Label><Input className="mt-1.5" defaultValue={user?.name ?? ""} /></div>
          <div><Label>Email *</Label><Input className="mt-1.5" type="email" defaultValue={user?.email ?? ""} /></div>
          <div><Label>Phone Number</Label><Input className="mt-1.5" placeholder="+255..." /></div>
          <div>
            <Label>Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="pharmacist">Pharmacist</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Branch Assignment *</Label>
            <Select defaultValue={user?.branchId ?? (role === "super_admin" ? "ALL" : "br_main")}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {role === "super_admin"
                  ? <SelectItem value="ALL">All Branches</SelectItem>
                  : branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Temporary Password *</Label>
            <Input className="mt-1.5" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            {strength === "short" && <div className="text-xs text-destructive mt-1">Too short</div>}
            {strength === "weak" && <div className="text-xs text-warning mt-1">Weak — add letters and numbers, ≥8 chars</div>}
            {strength === "good" && <div className="text-xs text-success mt-1">Good</div>}
          </div>
          <div>
            <Label>Confirm Password *</Label>
            <Input className="mt-1.5" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
            {pwd2 && !match && <div className="text-xs text-destructive mt-1">Passwords do not match</div>}
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <Label>Active</Label>
            <Switch defaultChecked={user?.active ?? true} />
          </div>
        </div>
        <SheetFooter className="mt-5">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (!user && (!match || strength === "short")) { toast.error("Please fix password issues"); return; }
            toast.success(user ? "User updated (demo)" : "User added (demo)");
            onClose();
          }}>{user ? "Save Changes" : "Add User"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
