import { Fragment, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { purchaseOrders as seed, suppliers, products } from "@/data/seed";
import type { Supplier } from "@/data/types";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui-ext/Badges";
import { fmtTZS, fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronRight, Search, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const tone = { DRAFT: "default", SENT: "info", PARTIAL: "warning", RECEIVED: "success", CANCELLED: "danger" } as const;

const termsLabel: Record<Supplier["paymentTerms"], string> = {
  COD: "Cash on Delivery", "30_days": "30 Days Credit", "60_days": "60 Days Credit", on_order: "On Order",
};

interface POLine { productId: string; qty: number; unitPrice: number; }

export default function PurchaseOrders() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <AppLayout title="Purchase Orders">
      <PageHeader title="Purchase Orders" description={`${seed.length} orders`} actions={
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New PO</Button>
      } />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>PO No.</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seed.map((po) => {
              const sup = suppliers.find((s) => s.id === po.supplierId);
              const isOpen = expanded === po.id;
              return (
                <Fragment key={po.id}>
                  <TableRow>
                    <TableCell>
                      <button onClick={() => setExpanded(isOpen ? null : po.id)} className="text-muted-foreground hover:text-foreground">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium num">{po.poNo}</TableCell>
                    <TableCell>{sup?.name}</TableCell>
                    <TableCell className="num text-xs">{fmtDate(po.date)}</TableCell>
                    <TableCell className="num text-xs">{fmtDate(po.expectedDate)}</TableCell>
                    <TableCell className="text-right num">{po.lines.length}</TableCell>
                    <TableCell className="text-right num">{fmtTZS(po.total)}</TableCell>
                    <TableCell><StatusBadge status={po.status} tone={tone[po.status]} /></TableCell>
                    <TableCell className="text-right">
                      {(po.status === "SENT" || po.status === "PARTIAL") && (
                        <Button size="sm" variant="outline" onClick={() => navigate("/grn", { state: { poId: po.id } })}>
                          Receive
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={9} className="p-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>UoM</TableHead>
                              <TableHead className="text-right">Qty Ordered</TableHead>
                              <TableHead className="text-right">Qty Received</TableHead>
                              <TableHead className="text-right">Unit Price</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {po.lines.map((l) => {
                              const p = products.find((x) => x.id === l.productId);
                              const lineStatus = l.received === 0 ? "Pending" : l.received < l.qty ? "Partial" : "Received";
                              const lineTone = l.received === 0 ? "default" : l.received < l.qty ? "warning" : "success";
                              return (
                                <TableRow key={l.productId}>
                                  <TableCell className="font-medium text-sm">{p?.name}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground">{p?.unit}</TableCell>
                                  <TableCell className="text-right num">{l.qty}</TableCell>
                                  <TableCell className="text-right num">{l.received}</TableCell>
                                  <TableCell className="text-right num">{fmtTZS(l.buyPrice)}</TableCell>
                                  <TableCell className="text-right num">{fmtTZS(l.qty * l.buyPrice)}</TableCell>
                                  <TableCell><StatusBadge status={lineStatus} tone={lineTone as any} /></TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <NewPOSheet open={open} onOpenChange={setOpen} />
    </AppLayout>
  );
}

function NewPOSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [branch, setBranch] = useState("br_main");
  const [supplierId, setSupplierId] = useState<string>(suppliers[0].id);
  const [expected, setExpected] = useState("");
  const [terms, setTerms] = useState<Supplier["paymentTerms"]>(suppliers[0].paymentTerms);
  const [credit, setCredit] = useState(false);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<POLine[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const supplier = suppliers.find((s) => s.id === supplierId);
  const supplierProducts = useMemo(() => products.filter((p) => supplier?.productIds.includes(p.id)), [supplierId]);
  const productResults = productSearch
    ? supplierProducts.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 6)
    : [];

  const total = lines.reduce((a, l) => a + l.qty * l.unitPrice, 0);

  const onSupplierChange = (id: string) => {
    setSupplierId(id);
    const sup = suppliers.find((s) => s.id === id);
    if (sup) setTerms(sup.paymentTerms);
    setLines([]);
  };

  const addLine = (pid: string) => {
    if (lines.find((l) => l.productId === pid)) return;
    const p = products.find((x) => x.id === pid);
    if (!p) return;
    setLines((prev) => [...prev, { productId: pid, qty: 1, unitPrice: p.buyPrice }]);
    setProductSearch("");
  };

  const updateLine = (pid: string, patch: Partial<POLine>) =>
    setLines((prev) => prev.map((l) => l.productId === pid ? { ...l, ...patch } : l));
  const removeLine = (pid: string) => setLines((prev) => prev.filter((l) => l.productId !== pid));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return toast.error("Add at least one line item");
    if (lines.some((l) => l.qty <= 0)) return toast.error("All quantities must be greater than 0");
    toast.success(`PO created (demo)${credit && terms !== "COD" ? " — creditor entry will be created" : ""}`);
    onOpenChange(false);
    setLines([]); setNotes(""); setExpected(""); setCredit(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader><SheetTitle>New Purchase Order</SheetTitle></SheetHeader>
        <form className="mt-4 space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Branch *</Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="br_main">Main Branch</SelectItem>
                  <SelectItem value="br_upanga">Upanga Branch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={onSupplierChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {supplier && <div className="text-xs text-muted-foreground">Payment terms: {termsLabel[supplier.paymentTerms]}</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Expected Delivery Date</Label>
              <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Terms</Label>
              <Select value={terms} onValueChange={(v) => setTerms(v as Supplier["paymentTerms"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COD">Cash on Delivery</SelectItem>
                  <SelectItem value="30_days">30 Days Credit</SelectItem>
                  <SelectItem value="60_days">60 Days Credit</SelectItem>
                  <SelectItem value="on_order">On Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Mark as Credit Purchase</div>
              <div className="text-xs text-muted-foreground">Will create a creditor entry on confirmation</div>
            </div>
            <Switch checked={credit} onCheckedChange={setCredit} disabled={terms === "COD"} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="text-sm font-medium">Order Items</div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder={`Search ${supplier?.name}'s products...`} className="pl-9" />
              {productResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
                  {productResults.map((p) => (
                    <button type="button" key={p.id} onClick={() => addLine(p.id)} className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between">
                      <span>{p.name}</span>
                      <span className="num text-muted-foreground">{fmtTZS(p.buyPrice)}</span>
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
                    <TableHead className="w-32">Unit Price (TZS)</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l) => {
                    const p = products.find((x) => x.id === l.productId);
                    return (
                      <TableRow key={l.productId}>
                        <TableCell className="text-sm">{p?.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p?.unit}</TableCell>
                        <TableCell><Input type="number" min={1} value={l.qty} className="h-8 num" onChange={(e) => updateLine(l.productId, { qty: Math.max(0, Number(e.target.value) || 0) })} /></TableCell>
                        <TableCell><Input type="number" value={l.unitPrice} className="h-8 num" onChange={(e) => updateLine(l.productId, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} /></TableCell>
                        <TableCell className="text-right num">{fmtTZS(l.qty * l.unitPrice)}</TableCell>
                        <TableCell><button type="button" onClick={() => removeLine(l.productId)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-end pt-2">
              <div className="text-lg font-semibold">Order Total: <span className="num text-primary">{fmtTZS(total)}</span></div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Create PO</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
