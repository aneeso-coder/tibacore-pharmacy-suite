import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { auditLog, users } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fmtDateTime } from "@/lib/format";

const actionTone: any = {
  CREATE: "bg-success/15 text-success border-success/30",
  UPDATE: "bg-info/15 text-info border-info/30",
  DELETE: "bg-destructive/15 text-destructive border-destructive/30",
  LOGIN: "bg-muted text-muted-foreground border-border",
};

export default function AuditLog() {
  return (
    <AppLayout title="Audit Log">
      <PageHeader title="Audit Log" description="System-wide activity trail" />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLog.map((a) => {
              const u = users.find((x) => x.id === a.userId);
              return (
                <TableRow key={a.id}>
                  <TableCell className="num text-xs">{fmtDateTime(a.ts)}</TableCell>
                  <TableCell className="text-sm">{u?.name}</TableCell>
                  <TableCell><Badge variant="outline" className={actionTone[a.action]}>{a.action}</Badge></TableCell>
                  <TableCell className="text-xs">{a.module}</TableCell>
                  <TableCell className="text-sm">{a.description}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppLayout>
  );
}
