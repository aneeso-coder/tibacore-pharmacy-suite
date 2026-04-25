import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { auditLog, users } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";
import { Search } from "lucide-react";

const actionTone: any = {
  CREATE: "bg-success/15 text-success border-success/30",
  UPDATE: "bg-info/15 text-info border-info/30",
  DELETE: "bg-destructive/15 text-destructive border-destructive/30",
  LOGIN: "bg-muted text-muted-foreground border-border",
};

export default function AuditLog() {
  const [q, setQ] = useState("");
  const [action, setAction] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...auditLog];
    if (action !== "ALL") list = list.filter((a) => a.action === action);
    if (q.trim()) {
      const ql = q.toLowerCase();
      list = list.filter((a) => {
        const u = users.find((x) => x.id === a.userId)?.name ?? "";
        return (
          a.description.toLowerCase().includes(ql) ||
          a.module.toLowerCase().includes(ql) ||
          u.toLowerCase().includes(ql)
        );
      });
    }
    return list.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
  }, [q, action]);

  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppLayout title="Audit Log">
      <PageHeader title="Audit Log" description={`${filtered.length} events — system-wide activity trail`} />

      <Card className="p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search user, module, description..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All actions</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
            <SelectItem value="LOGIN">Login</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Timestamp</TableHead>
              <TableHead className="w-44">User</TableHead>
              <TableHead className="w-24">Action</TableHead>
              <TableHead className="w-32">Module</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                  No matching audit events
                </TableCell>
              </TableRow>
            ) : (
              paged.map((a) => {
                const u = users.find((x) => x.id === a.userId);
                return (
                  <TableRow key={a.id} className="[&>td]:py-2">
                    <TableCell className="num text-xs text-muted-foreground">{fmtDateTime(a.ts)}</TableCell>
                    <TableCell className="text-sm">{u?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${actionTone[a.action]} text-[10px] h-5 px-1.5`}>
                        {a.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{a.module}</TableCell>
                    <TableCell className="text-sm">{a.description}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-3 border-t">
          <div className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </AppLayout>
  );
}
