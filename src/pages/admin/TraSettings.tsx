import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TraBadge } from "@/components/ui-ext/Badges";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtDateTime, fmtTZS } from "@/lib/format";
import { sales } from "@/data/seed";
import { toast } from "sonner";
import { ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";

export default function TraSettings() {
  const queue = sales.slice(0, 20);
  const failedCount = sales.filter((s) => s.traStatus === "FAILED").length;
  const pendingCount = sales.filter((s) => s.traStatus === "PENDING").length;
  const submittedCount = sales.filter((s) => s.traStatus === "SUBMITTED").length;

  return (
    <AppLayout title="TRA / VFD Settings">
      <PageHeader title="TRA / VFD Settings" description="Tax Revenue Authority compliance configuration" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> VFD Registration</h3>
            <Badge className="bg-success text-success-foreground border-0">Registered</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "TIN", v: "123-456-789" }, { l: "VRN", v: "40-012345-A" },
              { l: "REGID", v: "TZ-VFD-9981" }, { l: "EFD Serial", v: "EFD-77AA12" },
              { l: "Receipt Code", v: "RC" }, { l: "Tax Office", v: "Ilala" },
              { l: "Region", v: "Dar es Salaam" },
            ].map((f) => (
              <div key={f.l}>
                <Label className="text-xs text-muted-foreground">{f.l}</Label>
                <Input defaultValue={f.v} className="h-9 mt-1 num" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Token & Counters</h3>
            <Badge className="bg-success text-success-foreground border-0">Token Valid</Badge>
          </div>
          <div className="space-y-2 text-sm">
            <Row k="Token expires in" v="58 minutes" />
            <Row k="Global Counter (GC)" v="000054271" />
            <div className="flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle className="h-3 w-3" />
              <span>This counter must never be reset. Each receipt issued increments this permanently.</span>
            </div>
            <Row k="Daily Counter (DC)" v="00038" />
            <Row k="Last ZNUM" v="ZN-20250419-001" />
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => toast.success("New token requested")}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Request New Token
          </Button>
        </Card>
      </div>

      <Card className="p-5 mb-4">
        <h3 className="font-medium mb-3">Receipt Queue</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Stat label="Pending" value={pendingCount} tone="warning" />
          <Stat label="Submitted" value={submittedCount} tone="success" />
          <Stat label="Failed" value={failedCount} tone="danger" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Last Attempt</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.map((s, i) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium num">{s.receiptNo}</TableCell>
                <TableCell className="num">{fmtTZS(s.total)}</TableCell>
                <TableCell className="num text-xs">{fmtDateTime(s.date)}</TableCell>
                <TableCell className="num">{(i % 3) + 1}</TableCell>
                <TableCell><TraBadge status={s.traStatus} /></TableCell>
                <TableCell className="text-right">
                  {s.traStatus === "FAILED" && <Button size="sm" variant="outline" onClick={() => toast.success("Retry queued")}>Retry</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-5">
        <h3 className="font-medium mb-3">Z Report Log — Last 7 days</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Report No.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(); d.setDate(d.getDate() - i);
              const status = i === 0 ? "PENDING" : i === 3 ? "FAILED" : "SUBMITTED";
              return (
                <TableRow key={i}>
                  <TableCell className="num text-xs">{d.toLocaleDateString()}</TableCell>
                  <TableCell className="num font-medium">ZN-{d.toISOString().slice(0,10).replace(/-/g,"")}-001</TableCell>
                  <TableCell className="text-right num">{fmtTZS(800000 + i * 50000)}</TableCell>
                  <TableCell className="num text-xs">{i === 0 ? "—" : `${d.toLocaleDateString()} 23:55`}</TableCell>
                  <TableCell><TraBadge status={status as any} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppLayout>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b last:border-0 pb-1.5"><span className="text-muted-foreground">{k}</span><span className="font-medium num">{v}</span></div>;
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "warning" | "success" | "danger" }) {
  const cls = { warning: "text-warning bg-warning/10", success: "text-success bg-success/10", danger: "text-destructive bg-destructive/10" }[tone];
  return (
    <div className={`rounded-md p-3 ${cls}`}>
      <div className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-2xl font-semibold num mt-0.5">{value}</div>
    </div>
  );
}
