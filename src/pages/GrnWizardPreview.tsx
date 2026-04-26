import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { purchaseOrders, suppliers, products, branches } from "@/data/seed";
import { useApp } from "@/context/AppContext";
import { fmtTZS, fmtDate } from "@/lib/format";
import {
  Check, ChevronRight, ChevronLeft, FileText, PackageCheck, Tag,
  ScanLine, Paperclip, AlertTriangle, Copy, Sparkles, Save, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WizLine {
  productId: string;
  qtyOrdered: number;
  qtyAlreadyReceived: number;
  qtyReceived: number;
  batchNo: string;
  expiry: string;
  unitCost: number;
  origUnitCost: number;
  newSellPrice: string;
  applyTo: "current" | "all";
  skipPrice: boolean;
}

const STEPS = [
  { id: 1, title: "Source", desc: "Select PO & delivery info", icon: FileText },
  { id: 2, title: "Receive Items", desc: "Enter qty, batch & expiry", icon: PackageCheck },
  { id: 3, title: "Review & Confirm", desc: "Price changes & summary", icon: Tag },
];

export default function GrnWizardPreview() {
  const { user } = useApp();
  const [searchParams] = useSearchParams();
  const queryPoId = searchParams.get("poId") || "";
  // Step 1
  const eligible = purchaseOrders.filter((p) => p.status === "SENT" || p.status === "PARTIAL");
  // If a PO is preselected via URL, jump straight to step 2
  const [step, setStep] = useState(queryPoId ? 2 : 1);
  const [poId, setPoId] = useState<string>(queryPoId || eligible[0]?.id || "");
  const [grnNo] = useState(`GRN-${Date.now().toString().slice(-5)}`);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryNote, setDeliveryNote] = useState("");
  const [notes, setNotes] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);

  // Step 2
  const [lines, setLines] = useState<WizLine[]>([]);
  const [scanInput, setScanInput] = useState("");
  const scanRef = useRef<HTMLInputElement>(null);
  const lineRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const po = purchaseOrders.find((p) => p.id === poId);
  const sup = suppliers.find((s) => s.id === po?.supplierId);
  const branch = branches.find((b) => b.id === po?.branchId);
  const stockKey = po?.branchId === "br_main" ? "stockMain" : "stockUpanga";

  // Initialize lines when PO changes
  useEffect(() => {
    if (!po) return setLines([]);
    setLines(po.lines.map((l) => ({
      productId: l.productId,
      qtyOrdered: l.qty,
      qtyAlreadyReceived: l.received,
      qtyReceived: 0, // default to 0 — force entry
      batchNo: "",
      expiry: "",
      unitCost: l.buyPrice,
      origUnitCost: l.buyPrice,
      newSellPrice: "",
      applyTo: "all",
      skipPrice: false,
    })));
  }, [poId]); // eslint-disable-line

  const updateLine = (pid: string, patch: Partial<WizLine>) =>
    setLines((prev) => prev.map((l) => (l.productId === pid ? { ...l, ...patch } : l)));

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const code = scanInput.trim();
    const prod = products.find((p) => p.barcode === code || p.id === code);
    if (!prod) {
      toast.error(`Barcode ${code} not on this PO`);
      setScanInput("");
      return;
    }
    const line = lines.find((l) => l.productId === prod.id);
    if (!line) {
      toast.error(`${prod.name} is not on this PO`);
      setScanInput("");
      return;
    }
    // Increment received and focus
    updateLine(prod.id, { qtyReceived: line.qtyReceived + 1 });
    lineRefs.current[prod.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    lineRefs.current[prod.id]?.querySelector<HTMLInputElement>('input[data-batch="1"]')?.focus();
    setScanInput("");
  };

  const copyBatchFromPrev = (idx: number) => {
    if (idx === 0) return;
    const prev = lines[idx - 1];
    updateLine(lines[idx].productId, { batchNo: prev.batchNo, expiry: prev.expiry });
    toast.success("Copied batch & expiry from previous line");
  };

  const expiryStatus = (iso: string): { label: string; tone: "ok" | "warn" | "danger" } | null => {
    if (!iso) return null;
    const months = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    if (months < 3) return { label: `Expires in ${Math.max(0, Math.round(months))} mo`, tone: "danger" };
    if (months < 6) return { label: `${Math.round(months)} mo to expiry`, tone: "warn" };
    return { label: `${Math.round(months)} mo to expiry`, tone: "ok" };
  };

  // Validation per step
  const step1Valid = !!po && !!date;
  const receivedLines = lines.filter((l) => l.qtyReceived > 0);
  const step2Valid =
    receivedLines.length > 0 &&
    receivedLines.every((l) => l.batchNo.trim() && l.expiry);

  const grandTotal = useMemo(
    () => receivedLines.reduce((a, l) => a + l.qtyReceived * l.unitCost, 0),
    [receivedLines],
  );

  // Lines whose buy cost changed → need price review
  const priceChangedLines = receivedLines.filter((l) => l.unitCost !== l.origUnitCost);

  const goNext = () => {
    if (step === 1 && !step1Valid) return toast.error("Select a PO and delivery date");
    if (step === 2 && !step2Valid) return toast.error("Enter qty, batch & expiry for received items");
    setStep((s) => Math.min(3, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const confirm = () => {
    toast.success(`${grnNo} confirmed (preview only — nothing saved)`);
  };
  const saveDraft = () => toast.success(`${grnNo} saved as draft (preview only)`);

  return (
    <AppLayout title="GRN Wizard Preview">
      <PageHeader
        title="GRN Wizard — Preview"
        description="Step-by-step receive flow. This is a non-destructive preview — confirming does not save."
      />

      {/* Stepper header */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 sm:gap-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <div
                  className={cn(
                    "flex items-center gap-2.5 min-w-0 cursor-pointer",
                    active && "text-foreground",
                    done && "text-success",
                    !active && !done && "text-muted-foreground",
                  )}
                  onClick={() => done && setStep(s.id)}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full grid place-items-center shrink-0 border-2 transition",
                      active && "bg-primary text-primary-foreground border-primary",
                      done && "bg-success text-success-foreground border-success",
                      !active && !done && "bg-muted border-muted-foreground/20",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <div className="text-xs font-semibold uppercase tracking-wide leading-tight">
                      Step {s.id}
                    </div>
                    <div className="text-sm font-medium truncate">{s.title}</div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-[2px] bg-border min-w-4">
                    <div
                      className={cn("h-full transition-all", done ? "bg-success w-full" : "w-0")}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Progress value={(step / 3) * 100} className="h-1 mt-4" />
      </Card>

      {/* STEP 1 — Source */}
      {step === 1 && (
        <Card className="p-6 space-y-5">
          <div>
            <div className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Source & Delivery Info
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Choose the purchase order being received and capture delivery paperwork.
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Purchase Order *</Label>
            <Select value={poId} onValueChange={setPoId}>
              <SelectTrigger><SelectValue placeholder="Choose a PO..." /></SelectTrigger>
              <SelectContent>
                {eligible.map((p) => {
                  const s = suppliers.find((x) => x.id === p.supplierId);
                  const totalQty = p.lines.reduce((a, l) => a + l.qty, 0);
                  const totalRcv = p.lines.reduce((a, l) => a + l.received, 0);
                  return (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.poNo}</span>
                        <span className="text-muted-foreground">— {s?.name}</span>
                        <Badge variant={p.status === "PARTIAL" ? "secondary" : "outline"} className="text-[10px]">
                          {p.status === "PARTIAL" ? `${totalRcv}/${totalQty} received` : "Awaiting delivery"}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {po && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-lg bg-muted/40 border">
              <Field label="Supplier" value={sup?.name || "—"} />
              <Field label="Branch" value={branch?.name || "—"} />
              <Field label="GRN No." value={grnNo} mono />
              <Field label="Received By" value={user?.name || "—"} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Received Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Supplier Delivery Note #</Label>
              <Input
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. DN-44217"
                className="num"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any remarks about this delivery..." />
          </div>

          <div className="space-y-1.5">
            <Label>Attach Delivery Note / Invoice</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAttachment("delivery-note.pdf")}>
                <Paperclip className="h-4 w-4 mr-1.5" /> Choose file
              </Button>
              {attachment && (
                <Badge variant="secondary" className="gap-1">
                  {attachment}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setAttachment(null)} />
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2 — Receive items */}
      {step === 2 && po && (
        <div className="space-y-4">
          {/* Sticky context bar */}
          <Card className="p-3 flex flex-wrap items-center gap-3 sticky top-0 z-10">
            <Badge variant="outline" className="font-medium">{po.poNo}</Badge>
            <span className="text-sm">{sup?.name}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{branch?.name}</span>
            <div className="flex-1" />
            <div className="text-xs text-muted-foreground">Items received:</div>
            <span className="text-sm font-semibold num">
              {receivedLines.length} <span className="text-muted-foreground font-normal">/ {lines.length}</span>
            </span>
          </Card>

          {/* Barcode scanner */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <ScanLine className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <Label className="text-xs">Scan or type barcode (then Enter)</Label>
                <Input
                  ref={scanRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={handleScan}
                  placeholder="e.g. 60100000002"
                  className="num mt-1"
                  autoFocus
                />
              </div>
              <div className="text-xs text-muted-foreground hidden md:block max-w-[180px]">
                Scanning a barcode auto-increments quantity and focuses Batch No.
              </div>
            </div>
          </Card>

          {/* Line item cards */}
          <div className="space-y-3">
            {lines.map((l, idx) => {
              const p = products.find((x) => x.id === l.productId);
              const expStatus = expiryStatus(l.expiry);
              const outstanding = l.qtyOrdered - l.qtyAlreadyReceived;
              const isReceived = l.qtyReceived > 0;
              return (
                <Card
                  key={l.productId}
                  ref={(el) => (lineRefs.current[l.productId] = el)}
                  className={cn(
                    "p-4 transition border-2",
                    isReceived ? "border-primary/30 bg-primary/[0.02]" : "border-border",
                  )}
                >
                  {/* Header row */}
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{p?.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>Pack: {p?.packSize}</span>
                        <span>·</span>
                        <span>SOH: <span className="num">{(p as any)?.[stockKey] || 0}</span></span>
                        <span>·</span>
                        <span className="num">{p?.barcode}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {l.qtyAlreadyReceived > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {l.qtyAlreadyReceived}/{l.qtyOrdered} already received
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        Outstanding: <span className="num ml-1">{outstanding}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Inputs grid — large, touch-friendly */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Qty Received *</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => updateLine(l.productId, { qtyReceived: Math.max(0, l.qtyReceived - 1) })}
                        >−</Button>
                        <Input
                          type="number"
                          min={0}
                          value={l.qtyReceived}
                          className="h-10 text-center num font-semibold"
                          onChange={(e) => updateLine(l.productId, { qtyReceived: Math.max(0, Number(e.target.value) || 0) })}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => updateLine(l.productId, { qtyReceived: l.qtyReceived + 1 })}
                        >+</Button>
                      </div>
                      {l.qtyReceived > outstanding && (
                        <div className="text-[11px] text-warning flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Exceeds outstanding ({outstanding})
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Batch No. *</Label>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => copyBatchFromPrev(idx)}
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                          >
                            <Copy className="h-2.5 w-2.5" /> Copy prev
                          </button>
                        )}
                      </div>
                      <Input
                        data-batch="1"
                        value={l.batchNo}
                        placeholder="e.g. BN24017"
                        className="h-10 num"
                        onChange={(e) => updateLine(l.productId, { batchNo: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Expiry Date *</Label>
                      <Input
                        type="date"
                        value={l.expiry}
                        className="h-10 num"
                        onChange={(e) => updateLine(l.productId, { expiry: e.target.value })}
                      />
                      {expStatus && (
                        <div
                          className={cn(
                            "text-[11px] flex items-center gap-1",
                            expStatus.tone === "danger" && "text-destructive",
                            expStatus.tone === "warn" && "text-warning",
                            expStatus.tone === "ok" && "text-success",
                          )}
                        >
                          {expStatus.tone !== "ok" && <AlertTriangle className="h-3 w-3" />}
                          {expStatus.label}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Unit Cost (TZS)</Label>
                      <Input
                        type="number"
                        value={l.unitCost}
                        className="h-10 num"
                        onChange={(e) => updateLine(l.productId, { unitCost: Math.max(0, Number(e.target.value) || 0) })}
                      />
                      {l.unitCost !== l.origUnitCost && (
                        <div className="text-[11px] text-warning flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Cost changed (was {fmtTZS(l.origUnitCost)})
                        </div>
                      )}
                    </div>
                  </div>

                  {isReceived && (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Line total</span>
                      <span className="font-semibold num text-primary">{fmtTZS(l.qtyReceived * l.unitCost)}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {receivedLines.length > 0 && (
            <Card className="p-4 bg-muted/30 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {receivedLines.length} item{receivedLines.length > 1 ? "s" : ""} ready to receive
              </div>
              <div className="text-lg font-semibold">
                Subtotal: <span className="num text-primary">{fmtTZS(grandTotal)}</span>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* STEP 3 — Review & confirm */}
      {step === 3 && po && (
        <div className="space-y-4">
          {/* Summary card */}
          <Card className="p-5">
            <div className="text-base font-semibold flex items-center gap-2 mb-4">
              <PackageCheck className="h-4 w-4 text-primary" /> GRN Summary
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="GRN No." value={grnNo} mono />
              <Field label="Supplier" value={sup?.name || "—"} />
              <Field label="Branch" value={branch?.name || "—"} />
              <Field label="Received Date" value={fmtDate(date)} />
              <Field label="PO Reference" value={po.poNo} mono />
              <Field label="Delivery Note" value={deliveryNote || "—"} mono />
              <Field label="Items Received" value={`${receivedLines.length} of ${lines.length}`} />
              <Field label="Grand Total" value={fmtTZS(grandTotal)} highlight />
            </div>
          </Card>

          {/* Stock impact */}
          <Card className="p-5">
            <div className="text-sm font-semibold mb-3">Stock Impact</div>
            <div className="space-y-2">
              {receivedLines.map((l) => {
                const p = products.find((x) => x.id === l.productId);
                const before = (p as any)?.[stockKey] || 0;
                return (
                  <div key={l.productId} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{p?.name}</div>
                      <div className="text-[11px] text-muted-foreground">Batch {l.batchNo} · exp {fmtDate(l.expiry)}</div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground num">{before}</span>
                      <span className="text-success font-medium num">+{l.qtyReceived}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-semibold num">{before + l.qtyReceived}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Price review */}
          {priceChangedLines.length > 0 ? (
            <Card className="p-5 border-warning/40">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4 text-warning" />
                    Sell Price Review — {priceChangedLines.length} item{priceChangedLines.length > 1 ? "s" : ""} affected
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Buy cost changed. Update sell prices to maintain margin.
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setLines((prev) => prev.map((l) => ({ ...l, skipPrice: true, newSellPrice: "" })));
                    toast.success("Keeping all current sell prices");
                  }}>Skip all</Button>
                  <Button size="sm" variant="secondary" onClick={() => {
                    setLines((prev) => prev.map((l) => {
                      const p = products.find((x) => x.id === l.productId);
                      if (!p || l.unitCost === l.origUnitCost) return l;
                      const margin = (p.sellPrice - l.origUnitCost) / l.origUnitCost;
                      return { ...l, newSellPrice: String(Math.round(l.unitCost * (1 + margin))), skipPrice: false };
                    }));
                    toast.success("Applied original margin to all");
                  }}>Apply orig. margin</Button>
                </div>
              </div>

              <div className="space-y-3">
                {priceChangedLines.map((l) => {
                  const p = products.find((x) => x.id === l.productId);
                  if (!p) return null;
                  const oldMargin = ((p.sellPrice - l.origUnitCost) / l.origUnitCost) * 100;
                  const newPriceNum = Number(l.newSellPrice) || p.sellPrice;
                  const newMargin = ((newPriceNum - l.unitCost) / l.unitCost) * 100;
                  return (
                    <div key={l.productId} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center p-3 rounded-md bg-muted/30">
                      <div className="md:col-span-2">
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Cost: {fmtTZS(l.origUnitCost)} → <span className="text-foreground font-medium">{fmtTZS(l.unitCost)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">Current sell</div>
                        <div className="text-sm num">{fmtTZS(p.sellPrice)}</div>
                        <div className="text-[10px] text-muted-foreground">{oldMargin.toFixed(0)}% margin</div>
                      </div>
                      <div>
                        <Label className="text-[10px]">New sell price</Label>
                        <Input
                          type="number"
                          value={l.newSellPrice}
                          placeholder={String(p.sellPrice)}
                          className="h-9 num"
                          onChange={(e) => updateLine(l.productId, { newSellPrice: e.target.value, skipPrice: false })}
                        />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">New margin</div>
                        <div className={cn("text-sm font-semibold num", newMargin < oldMargin - 5 ? "text-destructive" : "text-success")}>
                          {newMargin.toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <Select value={l.applyTo} onValueChange={(v: any) => updateLine(l.productId, { applyTo: v })}>
                          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All branches</SelectItem>
                            <SelectItem value="current">This branch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              No buy-cost changes — sell prices remain unchanged.
            </Card>
          )}
        </div>
      )}

      {/* Footer nav */}
      <div className="sticky bottom-0 mt-6 -mx-4 sm:mx-0 px-4 sm:px-0">
        <Card className="p-3 flex items-center justify-between gap-2 shadow-lg">
          <Button variant="ghost" onClick={goBack} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="text-xs text-muted-foreground hidden sm:block">
            Step {step} of {STEPS.length} — {STEPS[step - 1].desc}
          </div>
          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button onClick={goNext}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={saveDraft}>
                  <Save className="h-4 w-4 mr-1.5" /> Save draft
                </Button>
                <Button onClick={confirm}>
                  <Check className="h-4 w-4 mr-1.5" /> Confirm GRN
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function Field({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div
        className={cn(
          "text-sm font-medium mt-0.5 truncate",
          mono && "num",
          highlight && "text-primary text-base font-semibold",
        )}
      >
        {value}
      </div>
    </div>
  );
}
