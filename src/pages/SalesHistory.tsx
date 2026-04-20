import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { sales, users } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fmtTZS, fmtDateTime } from "@/lib/format";
import { TraBadge } from "@/components/ui-ext/Badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";

export default function SalesHistory() {
  const { branch, user } = useApp();
  const [page, setPage] = useState(1);
  const [tra, setTra] = useState<string>("ALL");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = sales.filter((s) => s.branchId === branch.id);
    if (user?.role === "cashier") list = list.filter((s) => s.cashierId === user.id);
    if (tra !== "ALL") list = list.filter((s) => s.traStatus === tra);
    if (q.trim()) {
      const ql = q.toLowerCase();
      list = list.filter((s) => s.receiptNo.toLowerCase().includes(ql) || s.customerName.toLowerCase().includes(ql));
    }
    return list.sort((a,b) => +new Date(b.date) - +new Date(a.date));
  }, [branch.id, tra, q, user]);

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppLayout title="Sales History">
      <PageHeader title="Sales History" description={`${filtered.length} transactions`} />
      <Card className="p-3 mb-4 flex flex-wrap items-center gap-2">
        <Input placeholder="Search receipt or customer..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={tra} onValueChange={setTra}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All TRA statuses</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>TRA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((s) => {
              const cashier = users.find((u) => u.id === s.cashierId)?.name ?? "—";
              return (
                <TableRow key={s.id} className="cursor-pointer">
                  <TableCell className="font-medium num">{s.receiptNo}</TableCell>
                  <TableCell className="num text-xs text-muted-foreground">{fmtDateTime(s.date)}</TableCell>
                  <TableCell>{s.customerName}</TableCell>
                  <TableCell className="text-xs">{cashier}</TableCell>
                  <TableCell className="text-right num">{s.lines.length}</TableCell>
                  <TableCell className="text-right num">{fmtTZS(s.subtotal)}</TableCell>
                  <TableCell className="text-right num text-muted-foreground">{s.discountTotal > 0 ? fmtTZS(s.discountTotal) : "—"}</TableCell>
                  <TableCell className="text-right num font-medium">{fmtTZS(s.total)}</TableCell>
                  <TableCell className="text-xs">{s.payment}</TableCell>
                  <TableCell><TraBadge status={s.traStatus} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-3 border-t">
          <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </AppLayout>
  );
}
