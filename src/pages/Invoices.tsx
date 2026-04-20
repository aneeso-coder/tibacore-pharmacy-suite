import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { StatusBadge } from "@/components/ui-ext/Badges";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { invoices as seed, customers, products } from "@/data/seed";
import type { Invoice, SaleLine } from "@/data/types";
import { fmtTZS, fmtDate } from "@/lib/format";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tone: Record<Invoice["status"], "default" | "info" | "warning" | "success" | "danger"> = {
  DRAFT: "default", SENT: "info", PARTIAL: "warning", PAID: "success", OVERDUE: "danger",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(seed);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<Invoice | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [active, setActive] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => invoices.filter((i) => {
    if (filter !== "ALL" && i.status !== filter) return false;
    if (search && !i.customerName.toLowerCase().includes(search.toLowerCase()) && !i.invoiceNo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [invoices, filter, search]);

  const openPay = (inv: Invoice) => {
    setActive(inv); setPayAmount(String(inv.amount - inv.paid)); setPayMethod("CASH"); setPayOpen(true);
  };

  const savePayment = () => {
    if (!active) return;
    const amt = Math.max(0, Math.min(active.amount - active.paid, Number(payAmount) || 0));
    if (amt <= 0) return toast.error("Enter a valid amount");
    setInvoices((prev) => prev.map((i) => {
      if (i.id !== active.id) return i;
      const newPaid = i.paid + amt;
      return { ...i, paid: newPaid, status: newPaid >= i.amount ? "PAID" : "PARTIAL" };
    }));
    toast.success(`Payment recorded`);
    setPayOpen(false);
  };

  const markPaid = (inv: Invoice) => {
    setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, paid: i.amount, status: "PAID" } : i));
    toast.success(`${inv.invoiceNo} marked as paid`);
  };

  return (
    <AppLayout title="Invoices">
      <PageHeader title="Invoice Management" description={`${invoices.length} invoices`} actions={
        <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New Invoice</Button>
      } />

      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer or invoice no..." className="pl-9" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv) => {
              const balance = inv.amount - inv.paid;
              return (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium num">{inv.invoiceNo}</TableCell>
                  <TableCell>{inv.customerName}</TableCell>
                  <TableCell className="num text-xs">{fmtDate(inv.date)}</TableCell>
                  <TableCell className="num text-xs">{fmtDate(inv.dueDate)}</TableCell>
                  <TableCell className="text-right num">{fmtTZS(inv.amount)}</TableCell>
                  <TableCell className="text-right num">{fmtTZS(inv.paid)}</TableCell>
                  <TableCell className={cn("text-right num font-medium", balance > 0 && "text-destructive")}>{fmtTZS(balance)}</TableCell>
                  <TableCell><StatusBadge status={inv.status} tone={tone[inv.status]} /></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => setView(inv)}>View</Button>
                    {inv.status !== "PAID" && <Button size="sm" variant="ghost" onClick={() => markPaid(inv)}>Mark Paid</Button>}
                    {(inv.status === "PARTIAL" || inv.status === "SENT") && (
                      <Button size="sm" variant="outline" onClick={() => openPay(inv)}>Record Partial</Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* View Invoice */}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{view?.invoiceNo} — {view?.customerName}</DialogTitle>
          </DialogHeader>
          {view && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><div className="text-xs text-muted-foreground">Date</div><div className="font-medium num">{fmtDate(view.date)}</div></div>
                <div><div className="text-xs text-muted-foreground">Due Date</div><div className="font-medium num">{fmtDate(view.dueDate)}</div></div>
                <div><div className="text-xs text-muted-foreground">Status</div><StatusBadge status={view.status} tone={tone[view.status]} /></div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>UoM</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.lines.map((l, idx) => {
                    const p = products.find((x) => x.id === l.productId);
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-sm">{l.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p?.unit}</TableCell>
                        <TableCell className="text-right num">{l.qty}</TableCell>
                        <TableCell className="text-right num">{fmtTZS(l.unitPrice)}</TableCell>
                        <TableCell className="text-right num">{l.discountPct}%</TableCell>
                        <TableCell className="text-right num">{fmtTZS(l.lineTotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-end text-sm space-y-0.5 flex-col items-end">
                <div>Amount: <span className="num font-medium">{fmtTZS(view.amount)}</span></div>
                <div>Paid: <span className="num">{fmtTZS(view.paid)}</span></div>
                <div className="text-base font-semibold">Balance: <span className="num text-destructive">{fmtTZS(view.amount - view.paid)}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Payment — {active?.invoiceNo}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Amount Paid (TZS)</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={savePayment}>Save Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewInvoiceSheet open={newOpen} onOpenChange={setNewOpen} />
    </AppLayout>
  );
}

function NewInvoiceSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [customer, setCustomer] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const productResults = productSearch
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 6)
    : [];

  const addLine = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setLines((prev) => [...prev, {
      productId: p.id, name: p.name, qty: 1, unitPrice: p.sellPrice, discountPct: 0, taxCode: p.taxCode, lineTotal: p.sellPrice,
    }]);
    setProductSearch("");
  };

  const updateLine = (idx: number, patch: Partial<SaleLine>) => {
    setLines((prev) => prev.map((l, i) => {
      if (i !== idx) return l;
      const merged = { ...l, ...patch };
      merged.lineTotal = merged.qty * merged.unitPrice * (1 - merged.discountPct / 100);
      return merged;
    }));
  };

  const removeLine = (idx: number) => setLines((p) => p.filter((_, i) => i !== idx));
  const total = lines.reduce((a, l) => a + l.lineTotal, 0);

  const submit = (status: "DRAFT" | "SENT") => {
    if (!customer.trim()) return toast.error("Customer is required");
    if (lines.length === 0) return toast.error("Add at least one line item");
    toast.success(`Invoice ${status === "DRAFT" ? "saved as draft" : "sent"} (demo)`);
    onOpenChange(false);
    setCustomer(""); setNotes(""); setLines([]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader><SheetTitle>New Invoice</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Input list="inv-customers" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Type or select customer" />
            <datalist id="inv-customers">
              {customers.map((c) => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Line Items</div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search product to add..." className="pl-9" />
              {productResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
                  {productResults.map((p) => (
                    <button key={p.id} onClick={() => addLine(p.id)} className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between">
                      <span>{p.name}</span>
                      <span className="num text-muted-foreground">{fmtTZS(p.sellPrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {lines.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>UoM</TableHead>
                    <TableHead className="w-20">Qty</TableHead>
                    <TableHead className="w-28">Unit Price</TableHead>
                    <TableHead className="w-20">Disc %</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l, idx) => {
                    const p = products.find((x) => x.id === l.productId);
                    return (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{l.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p?.unit}</TableCell>
                        <TableCell><Input type="number" value={l.qty} className="h-8 num" onChange={(e) => updateLine(idx, { qty: Math.max(1, Number(e.target.value) || 1) })} /></TableCell>
                        <TableCell><Input type="number" value={l.unitPrice} className="h-8 num" onChange={(e) => updateLine(idx, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} /></TableCell>
                        <TableCell><Input type="number" value={l.discountPct} className="h-8 num" onChange={(e) => updateLine(idx, { discountPct: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} /></TableCell>
                        <TableCell className="text-right num">{fmtTZS(l.lineTotal)}</TableCell>
                        <TableCell><button onClick={() => removeLine(idx)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-end pt-2">
              <div className="text-lg font-semibold">Total: <span className="num text-primary">{fmtTZS(total)}</span></div>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <Button variant="outline" className="flex-1" onClick={() => submit("DRAFT")}>Save as Draft</Button>
            <Button className="flex-1" onClick={() => submit("SENT")}>Send Invoice</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
