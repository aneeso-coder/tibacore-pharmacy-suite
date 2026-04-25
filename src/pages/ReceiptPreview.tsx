import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wordmark } from "@/components/brand/Logo";
import { fmtTZS } from "@/lib/format";
import {
  Printer, MessageSquare, Mail, Plus, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Eye,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

// ---- Mock receipt data shared across all three options ----
const mockReceipt = {
  receiptNo: "RC-48213",
  traCode: "RCT384921",
  traStatus: "PENDING" as const,
  date: new Date(),
  branch: { name: "Tibacore Pharmacy — Mwenge", address: "Mwenge Rd, Dar es Salaam", tin: "123-456-789" },
  cashier: "Asha M.",
  customer: "Walk-in",
  payment: "CASH" as const,
  tendered: 1500000,
  change: 15000,
  subtotal: 1258475,
  discount: 0,
  vatByCode: { A: 226525 } as Record<string, number>,
  total: 1485000,
  lines: [
    { productId: "p1", name: "Amoxicillin 500mg (Pack of 21)", qty: 2, unitPrice: 18500, discountPct: 0 },
    { productId: "p2", name: "Panadol Extra 500mg (Strip of 12)", qty: 5, unitPrice: 3200, discountPct: 0 },
    { productId: "p3", name: "Ventolin Inhaler 100mcg", qty: 1, unitPrice: 28000, discountPct: 0 },
  ],
};

type Receipt = typeof mockReceipt;

export default function ReceiptPreview() {
  return (
    <AppLayout title="Receipt Designs Preview">
      <PageHeader
        title="Receipt Designs — Preview"
        description="Three options for the post-checkout receipt dialog. Pick the one you like and we'll wire it into POS."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* OPTION A */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge>Option A</Badge>
            <span className="text-sm font-medium">Success-first card</span>
            <Badge variant="outline" className="ml-auto bg-success/10 text-success border-success/30">Recommended</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Modern modal: huge total, instant TRA status, "New Sale" as primary action. Paper view is one click away.
          </p>
          <Card className="p-0 overflow-hidden">
            <OptionA receipt={mockReceipt} />
          </Card>
        </div>

        {/* OPTION B */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge>Option B</Badge>
            <span className="text-sm font-medium">Split: Summary + paper</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Wider modal with summary on the left and the paper-tape preview on the right. Best of both worlds, more screen.
          </p>
          <Card className="p-0 overflow-hidden">
            <OptionB receipt={mockReceipt} />
          </Card>
        </div>

        {/* OPTION C */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge>Option C</Badge>
            <span className="text-sm font-medium">Toast + slide-over</span>
          </div>
          <p className="text-xs text-muted-foreground">
            No modal. Toast confirms the sale, POS resets instantly, "Last sale" pill opens a slide-over for the receipt.
          </p>
          <Card className="p-4">
            <OptionC receipt={mockReceipt} />
          </Card>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        Once you pick one, this preview page (<span className="num">/receipt-preview</span>) will be removed and the
        chosen design replaces the current <span className="font-medium">ReceiptDialog</span> in POS.
      </div>
    </AppLayout>
  );
}

/* =========================================================================
 * OPTION A — Success-first card
 * ========================================================================= */
function OptionA({ receipt }: { receipt: Receipt }) {
  const [showDetail, setShowDetail] = useState(false);
  const [showPaper, setShowPaper] = useState(false);

  return (
    <div className="p-6">
      {/* Success header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-success/15 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <div>
          <div className="font-semibold">Sale Complete</div>
          <div className="text-xs text-muted-foreground num">
            {receipt.receiptNo} · {new Date(receipt.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* Big total */}
      <div className="mt-5 rounded-lg bg-primary/5 border border-primary/15 p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Total paid</div>
        <div className="text-3xl font-semibold text-primary num">{fmtTZS(receipt.total)}</div>
        <div className="text-sm text-muted-foreground mt-1.5">
          <span className="font-medium text-foreground">{receipt.payment}</span>
          <span className="mx-1.5">·</span>
          Tendered <span className="num text-foreground">{fmtTZS(receipt.tendered)}</span>
          <span className="mx-1.5">·</span>
          Change <span className="num font-medium text-success">{fmtTZS(receipt.change)}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{receipt.customer}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Cashier</span><span>{receipt.cashier}</span></div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">TRA</span>
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1">
            <Clock className="h-3 w-3" /> Pending submission
          </Badge>
        </div>
      </div>

      {/* Collapsible items */}
      <button
        onClick={() => setShowDetail((v) => !v)}
        className="mt-4 w-full flex items-center justify-between text-sm py-2 px-3 rounded-md hover:bg-muted transition-colors"
      >
        <span>{receipt.lines.length} items</span>
        {showDetail ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {showDetail && (
        <div className="mt-1 space-y-2 text-sm border-t pt-3">
          {receipt.lines.map((l) => (
            <div key={l.productId} className="flex justify-between gap-2">
              <span className="truncate">{l.qty}× {l.name}</span>
              <span className="num text-muted-foreground whitespace-nowrap">{fmtTZS(l.qty * l.unitPrice)}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>VAT 18%</span><span className="num">{fmtTZS(receipt.vatByCode.A || 0)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" onClick={() => toast.success("Printed (demo)")}>
          <Printer className="h-3.5 w-3.5 mr-1" /> Print
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.success("SMS sent (demo)")}>
          <MessageSquare className="h-3.5 w-3.5 mr-1" /> SMS
        </Button>
        <Button size="sm" onClick={() => toast.success("Ready for next sale (demo)")}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New Sale
        </Button>
      </div>

      {/* Tertiary */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <button onClick={() => setShowPaper(true)} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <Eye className="h-3 w-3" /> View full receipt
        </button>
        <button className="text-destructive/80 hover:text-destructive">Void sale</button>
      </div>

      {/* Paper preview drawer */}
      <Sheet open={showPaper} onOpenChange={setShowPaper}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Full Receipt</SheetTitle></SheetHeader>
          <div className="mt-4">
            <PaperReceipt receipt={receipt} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* =========================================================================
 * OPTION B — Split summary + paper
 * ========================================================================= */
function OptionB({ receipt }: { receipt: Receipt }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2">
      {/* Summary side */}
      <div className="p-5 border-b sm:border-b-0 sm:border-r">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div className="font-semibold">Sale Complete</div>
        </div>
        <div className="text-xs text-muted-foreground num mt-1">{receipt.receiptNo}</div>

        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
          <div className="text-2xl font-semibold num">{fmtTZS(receipt.total)}</div>
        </div>

        <div className="mt-3 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Change</span><span className="num text-success font-medium">{fmtTZS(receipt.change)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{receipt.payment}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{receipt.customer}</span></div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">TRA</span>
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-[10px]">Pending</Badge>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm"><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
          <Button variant="outline" size="sm"><MessageSquare className="h-3.5 w-3.5 mr-1" />SMS</Button>
          <Button variant="outline" size="sm"><Mail className="h-3.5 w-3.5 mr-1" />Email</Button>
          <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />New Sale</Button>
        </div>
      </div>

      {/* Paper side */}
      <div className="p-4 bg-muted/30 max-h-[640px] overflow-y-auto">
        <PaperReceipt receipt={receipt} />
      </div>
    </div>
  );
}

/* =========================================================================
 * OPTION C — Toast + slide-over (simulated)
 * ========================================================================= */
function OptionC({ receipt }: { receipt: Receipt }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showPill, setShowPill] = useState(true);

  const simulateCheckout = () => {
    setShowPill(true);
    toast.success(
      <div className="flex flex-col gap-0.5">
        <div className="font-medium num">{receipt.receiptNo} · {fmtTZS(receipt.total)}</div>
        <div className="text-xs text-muted-foreground num">CASH · Change {fmtTZS(receipt.change)}</div>
      </div>,
      {
        duration: 6000,
        action: { label: "Print", onClick: () => toast.success("Printed (demo)") },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-4 text-sm">
        <div className="font-medium mb-1">How it behaves in production</div>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
          <li>Cashier hits "Complete Sale".</li>
          <li>A toast appears (bottom-right) with total + Print action.</li>
          <li>POS instantly clears — ready for the next customer.</li>
          <li>A "Last sale" pill stays in the topbar for ~30s.</li>
          <li>Clicking the pill opens a slide-over with the full receipt + Void / SMS / Email.</li>
        </ol>
      </div>

      <Button onClick={simulateCheckout} className="w-full">
        Simulate checkout — fire toast
      </Button>

      {/* Mock topbar pill */}
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Mock topbar pill</div>
        <div className="rounded-md border p-2 flex items-center justify-between bg-card">
          <span className="text-xs text-muted-foreground">… rest of topbar …</span>
          {showPill && (
            <button
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-success/10 border border-success/30 text-success text-xs hover:bg-success/15"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span className="num font-medium">{receipt.receiptNo}</span>
              <span className="num">{fmtTZS(receipt.total)}</span>
            </button>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Trade-off:</span> fastest throughput, but loses the explicit
        "moment" of a printed receipt — some pharmacies expect that confirmation step.
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Last Sale · {receipt.receiptNo}</SheetTitle></SheetHeader>
          <div className="mt-4">
            <PaperReceipt receipt={receipt} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm"><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
            <Button variant="outline" size="sm"><MessageSquare className="h-3.5 w-3.5 mr-1" />SMS</Button>
            <Button variant="outline" size="sm"><Mail className="h-3.5 w-3.5 mr-1" />Email</Button>
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-2 text-destructive hover:text-destructive hover:bg-destructive/10">
            Void sale
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* =========================================================================
 * Shared paper-tape view (current style, lightly cleaned up)
 * ========================================================================= */
function PaperReceipt({ receipt }: { receipt: Receipt }) {
  return (
    <div className="bg-card border rounded-md p-5 font-mono text-xs">
      <div className="flex flex-col items-center mb-3">
        <Wordmark size="sm" />
      </div>
      <div className="text-center mb-3">
        <div className="font-semibold text-sm">{receipt.branch.name}</div>
        <div className="text-muted-foreground">{receipt.branch.address}</div>
        <div className="text-muted-foreground">TIN: {receipt.branch.tin}</div>
      </div>
      <div className="border-t border-dashed pt-2 mb-2 flex justify-between">
        <span>Receipt</span><span className="num">{receipt.receiptNo}</span>
      </div>
      <div className="flex justify-between"><span>Date</span><span className="num">{new Date(receipt.date).toLocaleString()}</span></div>
      <div className="flex justify-between"><span>Cashier</span><span>{receipt.cashier}</span></div>
      <div className="flex justify-between"><span>Customer</span><span>{receipt.customer}</span></div>
      <div className="border-t border-dashed mt-2 pt-2 space-y-1">
        {receipt.lines.map((l) => (
          <div key={l.productId}>
            <div className="truncate">{l.name}</div>
            <div className="flex justify-between text-muted-foreground">
              <span className="num">{l.qty} × {fmtTZS(l.unitPrice)}</span>
              <span className="num">{fmtTZS(l.qty * l.unitPrice)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-dashed mt-2 pt-2 space-y-0.5">
        <div className="flex justify-between"><span>Subtotal</span><span className="num">{fmtTZS(receipt.subtotal)}</span></div>
        <div className="flex justify-between"><span>VAT 18%</span><span className="num">{fmtTZS(receipt.vatByCode.A || 0)}</span></div>
        <div className="flex justify-between font-semibold text-sm border-t pt-1 mt-1">
          <span>TOTAL</span><span className="num">{fmtTZS(receipt.total)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>{receipt.payment}</span>
          <span className="num">Tendered {fmtTZS(receipt.tendered)} · Change {fmtTZS(receipt.change)}</span>
        </div>
      </div>
      <div className="border-t border-dashed mt-3 pt-3 flex flex-col items-center gap-1">
        <div
          className="h-16 w-16"
          style={{
            backgroundImage: "repeating-conic-gradient(hsl(var(--foreground)) 0% 25%, hsl(var(--background)) 25% 50%)",
            backgroundSize: "8px 8px",
          }}
        />
        <div className="text-[10px] text-muted-foreground">TRA Verification: {receipt.traCode}</div>
      </div>
      <div className="text-center mt-2 text-[10px] text-muted-foreground">Pharmacy. Simplified.</div>
    </div>
  );
}
