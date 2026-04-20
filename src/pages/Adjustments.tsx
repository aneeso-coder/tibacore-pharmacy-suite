import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { StatCard } from "@/components/ui-ext/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { adjustments as seedAdjustments, products, batches, users } from "@/data/seed";
import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/format";
import { Plus, Minus, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AdjustmentRecord } from "@/data/types";

const TYPE_OPTIONS = [
  "Damaged", "Expired", "Stocktake Correction", "Inter-Branch Transfer", "Other",
] as const;

const typeTone: Record<AdjustmentRecord["type"], string> = {
  "Damaged": "bg-destructive/10 text-destructive border-destructive/20",
  "Expired": "bg-warning/10 text-warning border-warning/20",
  "Stocktake Correction": "bg-info/10 text-info border-info/20",
  "Inter-Branch Transfer": "bg-primary/10 text-primary border-primary/20",
  "Other": "bg-muted text-muted-foreground border-border",
};

export default function Adjustments() {
  const { user, branch, branches } = useApp();
  const isAdmin = user?.role === "super_admin";
  const [records, setRecords] = useState<AdjustmentRecord[]>(seedAdjustments);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [branchFilter, setBranchFilter] = useState<string>(isAdmin ? "ALL" : branch.id);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const visible = useMemo(() => {
    return records.filter((r) => {
      if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
      if (isAdmin) {
        if (branchFilter !== "ALL" && r.branchId !== branchFilter) return false;
      } else {
        if (r.branchId !== branch.id) return false;
      }
      if (dateFrom && new Date(r.date) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo); end.setHours(23, 59, 59, 999);
        if (new Date(r.date) > end) return false;
      }
      return true;
    }).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [records, typeFilter, branchFilter, isAdmin, branch.id, dateFrom, dateTo]);

  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthRecords = visible.filter((r) => new Date(r.date) >= monthStart);
  const writeOffs = monthRecords.filter((r) => r.qtyChange < 0).reduce((a, r) => a + Math.abs(r.qtyChange), 0);
  const netChange = monthRecords.reduce((a, r) => a + r.qtyChange, 0);

  return (
    <AppLayout title="Stock Adjustments">
      <PageHeader
        title="Stock Adjustments"
        description="Manual corrections, write-offs, and transfers"
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Adjustment
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <StatCard label="Adjustments This Month" value={monthRecords.length} icon={<ClipboardList className="h-4 w-4" />} />
        <StatCard label="Units Written Off" value={writeOffs} tone="danger" />
        <StatCard label="Net SOH Change" value={`${netChange > 0 ? "+" : ""}${netChange}`} tone={netChange < 0 ? "warning" : "success"} />
      </div>

      <Card className="p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Type:</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Branch:</Label>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Branches</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">From:</Label>
          <Input type="date" className="w-40 h-9" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Label className="text-xs text-muted-foreground">To:</Label>
          <Input type="date" className="w-40 h-9" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        {!isAdmin && (
          <Badge variant="secondary" className="ml-auto">{branch.name}</Badge>
        )}
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Batch No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty Change</TableHead>
              <TableHead className="text-right">SOH Before</TableHead>
              <TableHead className="text-right">SOH After</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Authorised By</TableHead>
              {isAdmin && <TableHead>Branch</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 10 : 9} className="text-center text-sm text-muted-foreground py-10">
                  No adjustments match the current filters.
                </TableCell>
              </TableRow>
            ) : visible.map((r) => {
              const p = products.find((x) => x.id === r.productId);
              const b = batches.find((x) => x.id === r.batchId);
              const u = users.find((x) => x.id === r.authorisedBy);
              const br = branches.find((x) => x.id === r.branchId);
              return (
                <TableRow key={r.id}>
                  <TableCell className="num text-xs">{fmtDate(r.date)}</TableCell>
                  <TableCell className="font-medium">{p?.name ?? "—"}</TableCell>
                  <TableCell className="num text-xs">{b?.batchNo ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", typeTone[r.type])}>{r.type}</Badge>
                  </TableCell>
                  <TableCell className={cn("text-right num font-medium", r.qtyChange < 0 ? "text-destructive" : "text-success")}>
                    {r.qtyChange > 0 ? `+${r.qtyChange}` : r.qtyChange}
                  </TableCell>
                  <TableCell className="text-right num">{r.sohBefore}</TableCell>
                  <TableCell className="text-right num">{r.sohAfter}</TableCell>
                  <TableCell className="max-w-xs">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground truncate block">{r.notes}</span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs"><p className="text-xs">{r.notes}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-xs">{u?.name ?? "—"}</TableCell>
                  {isAdmin && <TableCell className="text-xs">{br?.name ?? "—"}</TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <NewAdjustmentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={(rec) => {
          setRecords((prev) => [rec, ...prev]);
          setSheetOpen(false);
          toast.success("Adjustment recorded");
        }}
        defaultBranchId={branch.id}
      />
    </AppLayout>
  );
}

function NewAdjustmentSheet({ open, onClose, onSave, defaultBranchId }: { open: boolean; onClose: () => void; onSave: (r: AdjustmentRecord) => void; defaultBranchId: string }) {
  const [productId, setProductId] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");
  const [type, setType] = useState<AdjustmentRecord["type"]>("Damaged");
  const [qtyChange, setQtyChange] = useState<number>(-1);
  const [notes, setNotes] = useState("");
  const [authorisedBy, setAuthorisedBy] = useState<string>("");

  const product = products.find((p) => p.id === productId);
  const productBatches = batches.filter((b) => b.productId === productId);
  const currentSoh = product ? (defaultBranchId === "br_main" ? product.stockMain : product.stockUpanga) : 0;
  const newSoh = currentSoh + qtyChange;
  const eligibleAuthorisers = users.filter((u) => u.role === "pharmacist" || u.role === "super_admin");

  const reset = () => {
    setProductId(""); setBatchId(""); setType("Damaged"); setQtyChange(-1); setNotes(""); setAuthorisedBy("");
  };

  // Apply sign rules when type changes
  const handleTypeChange = (t: AdjustmentRecord["type"]) => {
    setType(t);
    if (t === "Damaged" || t === "Expired" || t === "Inter-Branch Transfer") {
      setQtyChange((q) => (q > 0 ? -Math.abs(q || 1) : q || -1));
    }
  };

  const adjustQty = (delta: number) => {
    setQtyChange((q) => {
      const next = q + delta;
      if ((type === "Damaged" || type === "Expired" || type === "Inter-Branch Transfer") && next > 0) return -Math.abs(next);
      return next;
    });
  };

  const canSubmit = productId && batchId && type && qtyChange !== 0 && notes.trim().length >= 10 && authorisedBy && newSoh >= 0;

  const submit = () => {
    if (!canSubmit || !product) return;
    onSave({
      id: `adj_${Date.now()}`,
      date: new Date().toISOString(),
      productId, batchId, type, qtyChange,
      sohBefore: currentSoh, sohAfter: newSoh,
      notes: notes.trim(), authorisedBy, branchId: defaultBranchId,
    });
    reset();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>New Stock Adjustment</SheetTitle></SheetHeader>

        <div className="space-y-5 mt-5">
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">1. Product &amp; Batch</h4>
            <div>
              <Label className="text-sm">Product *</Label>
              <Select value={productId} onValueChange={(v) => { setProductId(v); setBatchId(""); }}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Search products..." /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {products.map((p) => {
                    const soh = defaultBranchId === "br_main" ? p.stockMain : p.stockUpanga;
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span>{p.name}</span>
                          <span className="text-xs text-muted-foreground">({p.category} • SOH {soh})</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {productId && (
              <div>
                <Label className="text-sm">Batch *</Label>
                <Select value={batchId} onValueChange={setBatchId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select batch..." /></SelectTrigger>
                  <SelectContent>
                    {productBatches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        Batch {b.batchNo} • exp {fmtDate(b.expiryDate)} • {b.qtyRemaining} avail
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground mt-1.5">Current SOH: <span className="font-medium text-foreground">{currentSoh} units</span></div>
              </div>
            )}
          </section>

          <section className="space-y-3 border-t pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Adjustment Details</h4>
            <div>
              <Label className="text-sm">Type *</Label>
              <Select value={type} onValueChange={(v) => handleTypeChange(v as AdjustmentRecord["type"])}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Qty Change *</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Button type="button" variant="outline" size="icon" onClick={() => adjustQty(-1)}><Minus className="h-4 w-4" /></Button>
                <Input
                  type="number" className="w-28 text-center num" value={qtyChange}
                  onChange={(e) => setQtyChange(parseInt(e.target.value) || 0)}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => adjustQty(1)}><Plus className="h-4 w-4" /></Button>
              </div>
              {productId && (
                <div className={cn("mt-2 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium", newSoh < 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                  New SOH: {currentSoh} {qtyChange >= 0 ? "+" : "−"} {Math.abs(qtyChange)} = {newSoh} units
                  {newSoh < 0 && " (below zero!)"}
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm">Notes * <span className="text-xs text-muted-foreground font-normal">(min 10 chars)</span></Label>
              <Textarea
                rows={3} className="mt-1.5" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for adjustment..."
              />
            </div>
            <div>
              <Label className="text-sm">Authorised By *</Label>
              <Select value={authorisedBy} onValueChange={setAuthorisedBy}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select authoriser..." /></SelectTrigger>
                <SelectContent>
                  {eligibleAuthorisers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.role === "super_admin" ? "Admin" : "Pharmacist"})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => { onClose(); reset(); }}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit}>Record Adjustment</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
