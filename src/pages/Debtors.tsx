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
import { invoices as seedInvoices } from "@/data/seed";
import type { Invoice } from "@/data/types";
import { fmtTZS, fmtDate } from "@/lib/format";
import { TrendingUp, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tone: Record<Invoice["status"], "default" | "info" | "warning" | "success" | "danger"> = {
  DRAFT: "default", SENT: "info", PARTIAL: "warning", PAID: "success", OVERDUE: "danger",
};

export default function Debtors() {
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);
  const [payOpen, setPayOpen] = useState(false);
  const [activeInv, setActiveInv] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState("");

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const stats = useMemo(() => {
    const outstanding = invoices.filter((i) => i.status !== "PAID").reduce((a, i) => a + (i.amount - i.paid), 0);
    const overdue = invoices.filter((i) => i.status === "OVERDUE").length;
    const dueIn7 = invoices.filter((i) => {
      if (i.status === "PAID") return false;
      const d = (new Date(i.dueDate).getTime() - today.getTime()) / 86400000;
      return d >= 0 && d <= 7;
    }).length;
    const collected = invoices.filter((i) => new Date(i.date) >= startOfMonth).reduce((a, i) => a + i.paid, 0);
    return { outstanding, overdue, dueIn7, collected };
  }, [invoices]);

  const aging = useMemo(() => {
    let a = 0, b = 0, c = 0;
    invoices.forEach((i) => {
      if (i.status === "PAID") return;
      const balance = i.amount - i.paid;
      const days = Math.floor((today.getTime() - new Date(i.dueDate).getTime()) / 86400000);
      if (days <= 30) a += balance;
      else if (days <= 60) b += balance;
      else c += balance;
    });
    const total = a + b + c || 1;
    return { a, b, c, total };
  }, [invoices]);

  const openPay = (inv: Invoice) => {
    setActiveInv(inv);
    setPayAmount(String(inv.amount - inv.paid));
    setPayMethod("CASH");
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayRef("");
    setPayOpen(true);
  };

  const savePayment = () => {
    if (!activeInv) return;
    const amt = Math.max(0, Math.min(activeInv.amount - activeInv.paid, Number(payAmount) || 0));
    if (amt <= 0) return toast.error("Enter a valid amount");
    setInvoices((prev) => prev.map((i) => {
      if (i.id !== activeInv.id) return i;
      const newPaid = i.paid + amt;
      const status: Invoice["status"] = newPaid >= i.amount ? "PAID" : "PARTIAL";
      return { ...i, paid: newPaid, status };
    }));
    toast.success(`Payment of ${fmtTZS(amt)} recorded`);
    setPayOpen(false);
  };

  return (
    <AppLayout title="Debtors">
      <PageHeader title="Debtors — Amounts Owed to Us" description={`${invoices.length} invoices on file`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Outstanding" value={fmtTZS(stats.outstanding)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Overdue" value={stats.overdue} icon={<AlertCircle className="h-4 w-4" />} tone="danger" />
        <StatCard label="Due in 7 Days" value={stats.dueIn7} icon={<Clock className="h-4 w-4" />} tone="warning" />
        <StatCard label="Collected This Month" value={fmtTZS(stats.collected)} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
      </div>

      <Card className="p-5 mb-6">
        <div className="text-sm font-medium mb-3">Aging Summary</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "0–30 days", val: aging.a, cls: "bg-success" },
            { label: "31–60 days", val: aging.b, cls: "bg-warning" },
            { label: "60+ days", val: aging.c, cls: "bg-destructive" },
          ].map((row) => (
            <div key={row.label}>
              <div className="text-xs text-muted-foreground mb-1">{row.label}</div>
              <div className="text-lg font-semibold num mb-1.5">{fmtTZS(row.val)}</div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full", row.cls)} style={{ width: `${(row.val / aging.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Days Outstanding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => {
              const balance = inv.amount - inv.paid;
              const days = Math.max(0, Math.floor((today.getTime() - new Date(inv.date).getTime()) / 86400000));
              return (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.customerName}</TableCell>
                  <TableCell className="num">{inv.invoiceNo}</TableCell>
                  <TableCell className="num text-xs">{fmtDate(inv.date)}</TableCell>
                  <TableCell className="num text-xs">{fmtDate(inv.dueDate)}</TableCell>
                  <TableCell className="text-right num">{fmtTZS(inv.amount)}</TableCell>
                  <TableCell className="text-right num">{fmtTZS(inv.paid)}</TableCell>
                  <TableCell className={cn("text-right num font-medium", balance > 0 && "text-destructive")}>{fmtTZS(balance)}</TableCell>
                  <TableCell className="text-right num">{days}</TableCell>
                  <TableCell><StatusBadge status={inv.status} tone={tone[inv.status]} /></TableCell>
                  <TableCell className="text-right">
                    {inv.status !== "PAID" && (
                      <Button size="sm" variant="outline" onClick={() => openPay(inv)}>Record Payment</Button>
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
            <DialogTitle>Record Payment — {activeInv?.invoiceNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Outstanding balance: <span className="font-semibold text-foreground num">{activeInv && fmtTZS(activeInv.amount - activeInv.paid)}</span>
            </div>
            <div className="space-y-1.5">
              <Label>Amount Paid (TZS)</Label>
              <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
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
            <div className="space-y-1.5">
              <Label>Reference (optional)</Label>
              <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Txn ID, receipt no..." />
            </div>
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
