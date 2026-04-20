import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { StatCard } from "@/components/ui-ext/StatCard";
import { StatusBadge } from "@/components/ui-ext/Badges";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supplierPayables as seed, suppliers } from "@/data/seed";
import type { SupplierPayable } from "@/data/types";
import { fmtTZS, fmtDate } from "@/lib/format";
import { TrendingDown, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tone: Record<SupplierPayable["status"], "default" | "warning" | "danger" | "success"> = {
  OUTSTANDING: "warning", OVERDUE: "danger", PAID: "success",
};

export default function Creditors() {
  const [items, setItems] = useState<SupplierPayable[]>(seed);
  const [filter, setFilter] = useState<string>("ALL");
  const [payOpen, setPayOpen] = useState(false);
  const [active, setActive] = useState<SupplierPayable | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState("");

  const today = new Date();

  const filtered = useMemo(
    () => filter === "ALL" ? items : items.filter((i) => i.supplierId === filter),
    [items, filter]
  );

  const stats = useMemo(() => {
    const owed = items.filter((i) => i.status !== "PAID").reduce((a, i) => a + (i.amount - i.paid), 0);
    const overdue = items.filter((i) => i.status === "OVERDUE").length;
    const dueWeek = items.filter((i) => {
      if (i.status === "PAID") return false;
      const d = (new Date(i.dueDate).getTime() - today.getTime()) / 86400000;
      return d >= 0 && d <= 7;
    }).length;
    return { owed, overdue, dueWeek };
  }, [items]);

  const openPay = (it: SupplierPayable) => {
    setActive(it);
    setPayAmount(String(it.amount - it.paid));
    setPayMethod("CASH");
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayRef("");
    setPayOpen(true);
  };

  const savePayment = () => {
    if (!active) return;
    const amt = Math.max(0, Math.min(active.amount - active.paid, Number(payAmount) || 0));
    if (amt <= 0) return toast.error("Enter a valid amount");
    setItems((prev) => prev.map((i) => {
      if (i.id !== active.id) return i;
      const newPaid = i.paid + amt;
      const status: SupplierPayable["status"] = newPaid >= i.amount ? "PAID" : i.status === "OVERDUE" ? "OVERDUE" : "OUTSTANDING";
      return { ...i, paid: newPaid, status };
    }));
    toast.success(`Payment of ${fmtTZS(amt)} recorded`);
    setPayOpen(false);
  };

  return (
    <AppLayout title="Creditors">
      <PageHeader title="Creditors — Amounts We Owe Suppliers" description={`${items.length} payables`} actions={
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All suppliers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All suppliers (statement)</SelectItem>
            {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      } />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Owed" value={fmtTZS(stats.owed)} icon={<TrendingDown className="h-4 w-4" />} />
        <StatCard label="Overdue" value={stats.overdue} icon={<AlertCircle className="h-4 w-4" />} tone="danger" />
        <StatCard label="Due This Week" value={stats.dueWeek} icon={<Clock className="h-4 w-4" />} tone="warning" />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((it) => {
              const balance = it.amount - it.paid;
              return (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.supplierName}</TableCell>
                  <TableCell className="num text-xs">{it.reference}</TableCell>
                  <TableCell className="num text-xs">{fmtDate(it.date)}</TableCell>
                  <TableCell className="num text-xs">{fmtDate(it.dueDate)}</TableCell>
                  <TableCell className="text-right num">{fmtTZS(it.amount)}</TableCell>
                  <TableCell className="text-right num">{fmtTZS(it.paid)}</TableCell>
                  <TableCell className={cn("text-right num font-medium", balance > 0 && "text-destructive")}>{fmtTZS(balance)}</TableCell>
                  <TableCell><StatusBadge status={it.status} tone={tone[it.status]} /></TableCell>
                  <TableCell className="text-right">
                    {it.status !== "PAID" && (
                      <Button size="sm" variant="outline" onClick={() => openPay(it)}>Record Payment</Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment — {active?.reference}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Balance: <span className="font-semibold text-foreground num">{active && fmtTZS(active.amount - active.paid)}</span>
            </div>
            <div className="space-y-1.5"><Label>Amount Paid (TZS)</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="MOBILE">Mobile Money</SelectItem>
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Reference (optional)</Label><Input value={payRef} onChange={(e) => setPayRef(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={savePayment}>Save Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
