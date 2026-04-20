import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { products, customers } from "@/data/seed";
import type { Product, PaymentMethod } from "@/data/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtTZS } from "@/lib/format";
import { Wordmark } from "@/components/brand/Logo";
import { X, Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Line {
  productId: string; name: string; qty: number; unitPrice: number; discountPct: number; taxCode: "A" | "C" | "E";
}

export default function POS() {
  const { user, branch } = useApp();
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [customer, setCustomer] = useState<string>("Walk-in");
  const [payment, setPayment] = useState<PaymentMethod>("CASH");
  const [tendered, setTendered] = useState<string>("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [receiptNo, setReceiptNo] = useState(() => `RC-${String(Date.now()).slice(-5)}`);
  const [traCode] = useState(() => `RCT${Math.floor(Math.random() * 900000 + 100000)}`);

  const stockKey = branch.id === "br_main" ? "stockMain" : "stockUpanga";

  const filtered = useMemo(() => {
    if (!query.trim()) return products.slice(0, 20);
    const q = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q)).slice(0, 24);
  }, [query]);

  const addToCart = (p: Product) => {
    setCart((c) => {
      const ex = c.find((l) => l.productId === p.id);
      if (ex) return c.map((l) => l.productId === p.id ? { ...l, qty: l.qty + 1 } : l);
      return [...c, { productId: p.id, name: p.name, qty: 1, unitPrice: p.sellPrice, discountPct: 0, taxCode: p.taxCode }];
    });
  };

  const update = (pid: string, patch: Partial<Line>) => setCart((c) => c.map((l) => l.productId === pid ? { ...l, ...patch } : l));
  const remove = (pid: string) => setCart((c) => c.filter((l) => l.productId !== pid));

  const calc = useMemo(() => {
    let subtotal = 0, discount = 0, vatA = 0, vatC = 0, vatE = 0;
    cart.forEach((l) => {
      const gross = l.qty * l.unitPrice;
      const d = gross * (l.discountPct / 100);
      const net = gross - d;
      subtotal += gross; discount += d;
      if (l.taxCode === "A") vatA += (net * 18) / 118;
    });
    return { subtotal, discount, vatA, vatC, vatE, total: subtotal - discount };
  }, [cart]);

  const change = payment === "CASH" && tendered ? Math.max(0, Number(tendered) - calc.total) : 0;

  const completeSale = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (payment === "CASH" && Number(tendered) < calc.total) return toast.error("Insufficient cash tendered");
    const receipt = {
      receiptNo, traCode, date: new Date(), branch, cashier: user?.name, customer,
      lines: cart, ...calc, payment, tendered: Number(tendered), change,
    };
    setLastReceipt(receipt);
    setReceiptOpen(true);
  };

  const reset = () => {
    setCart([]); setTendered(""); setCustomer("Walk-in"); setPayment("CASH");
    setReceiptNo(`RC-${String(Date.now()).slice(-5)}`);
  };

  const allSameRateA = cart.length > 0 && cart.every((l) => l.taxCode === "A");
  const mixedRates = cart.length > 0 && !cart.every((l) => l.taxCode === cart[0].taxCode);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-14 border-b flex items-center px-4 gap-4 bg-card">
        <Wordmark size="sm" />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{branch.name}</span> • {user?.name}
        </div>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={() => nav("/")}>
            <X className="h-4 w-4 mr-1.5" /> Exit POS
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Product browse */}
        <div className="flex-1 lg:w-[60%] border-r flex flex-col min-h-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input autoFocus placeholder="Search by product name or scan barcode..." className="pl-9 h-11" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((p) => {
                const qty = (p as any)[stockKey];
                const oos = qty <= 0;
                return (
                  <button
                    key={p.id}
                    disabled={oos}
                    onClick={() => addToCart(p)}
                    className={cn(
                      "text-left rounded-lg border p-3 hover:border-primary hover:shadow-sm transition bg-card disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="text-xs text-muted-foreground">{p.packSize}</div>
                      <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", oos ? "border-destructive/30 text-destructive" : qty <= p.reorderPoint ? "border-warning/30 text-warning" : "border-success/30 text-success")}>
                        {qty} in stock
                      </Badge>
                    </div>
                    <div className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                    <div className="mt-2 text-base font-semibold num text-primary">{fmtTZS(p.sellPrice)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="w-full lg:w-[40%] max-w-[520px] flex flex-col bg-card min-h-0">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</div>
              <div className="font-medium">Receipt {receiptNo}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={reset} disabled={!cart.length}>
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <ShoppingCart className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">Add products to start a sale</p>
              </div>
            ) : (
              <div className="divide-y">
                {cart.map((l) => (
                  <div key={l.productId} className="p-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="text-sm font-medium leading-snug flex-1 min-w-0">{l.name}</div>
                      <button onClick={() => remove(l.productId)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-md">
                        <button className="px-2 py-1 hover:bg-muted" onClick={() => update(l.productId, { qty: Math.max(1, l.qty - 1) })}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <input className="w-10 text-center text-sm bg-transparent num" value={l.qty} onChange={(e) => update(l.productId, { qty: Math.max(1, Number(e.target.value) || 1) })} />
                        <button className="px-2 py-1 hover:bg-muted" onClick={() => update(l.productId, { qty: l.qty + 1 })}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground num">@ {fmtTZS(l.unitPrice)}</div>
                      <div className="ml-auto flex items-center gap-1">
                        <input type="number" min={0} max={100} value={l.discountPct}
                          onChange={(e) => update(l.productId, { discountPct: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                          className="w-12 h-7 text-xs border rounded px-1.5 text-right num bg-background" />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium num mt-1">
                      {fmtTZS(l.qty * l.unitPrice * (1 - l.discountPct / 100))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-4 space-y-3">
            <div className="space-y-1 text-sm">
              <Row label="Subtotal" value={fmtTZS(calc.subtotal)} />
              {calc.discount > 0 && <Row label="Discount" value={`- ${fmtTZS(calc.discount)}`} muted />}
              {allSameRateA && <Row label="VAT (18%)" value={fmtTZS(calc.vatA)} muted />}
              {mixedRates && (
                <>
                  <Row label="VAT A (18%)" value={fmtTZS(calc.vatA)} muted />
                  <Row label="VAT C (0%)" value={fmtTZS(0)} muted />
                  <Row label="VAT E (Exempt)" value="—" muted />
                </>
              )}
            </div>
            <div className="flex justify-between items-baseline">
              <div className="text-sm font-medium">Grand Total</div>
              <div className="text-2xl font-bold text-primary num">{fmtTZS(calc.total)}</div>
            </div>

            <div className="space-y-2">
              <Input placeholder="Customer (search or Walk-in)" list="customers" value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9" />
              <datalist id="customers">
                {customers.map((c) => <option key={c.id} value={c.name} />)}
              </datalist>

              <div className="grid grid-cols-3 gap-1.5">
                {(["CASH", "MOBILE", "CARD"] as const).map((m) => (
                  <Button key={m} type="button" variant={payment === m ? "default" : "outline"} size="sm" onClick={() => setPayment(m)}>
                    {m}
                  </Button>
                ))}
              </div>

              {payment === "CASH" && (
                <div className="grid grid-cols-2 gap-2 items-center">
                  <Input placeholder="Tendered" type="number" value={tendered} onChange={(e) => setTendered(e.target.value)} className="h-9 num" />
                  <div className="text-sm text-right">
                    <span className="text-muted-foreground">Change </span>
                    <span className="font-semibold num">{fmtTZS(change)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={reset}>Void</Button>
              <Button className="col-span-2 h-10" onClick={completeSale}>Complete Sale</Button>
            </div>
          </div>
        </div>
      </div>

      {receiptOpen && lastReceipt && (
        <ReceiptDialog open={receiptOpen} onClose={() => { setReceiptOpen(false); reset(); }} receipt={lastReceipt} />
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between", muted && "text-muted-foreground")}>
      <span>{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}

function ReceiptDialog({ open, onClose, receipt }: { open: boolean; onClose: () => void; receipt: any }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
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
            {receipt.lines.map((l: Line) => (
              <div key={l.productId}>
                <div className="truncate">{l.name}</div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="num">{l.qty} × {fmtTZS(l.unitPrice)}</span>
                  <span className="num">{fmtTZS(l.qty * l.unitPrice * (1 - l.discountPct / 100))}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed mt-2 pt-2 space-y-0.5">
            <div className="flex justify-between"><span>Subtotal</span><span className="num">{fmtTZS(receipt.subtotal)}</span></div>
            {receipt.discount > 0 && <div className="flex justify-between"><span>Discount</span><span className="num">- {fmtTZS(receipt.discount)}</span></div>}
            <div className="flex justify-between"><span>VAT A 18%</span><span className="num">{fmtTZS(receipt.vatA)}</span></div>
            <div className="flex justify-between"><span>VAT C 0%</span><span className="num">{fmtTZS(0)}</span></div>
            <div className="flex justify-between"><span>VAT E Exempt</span><span>—</span></div>
            <div className="flex justify-between font-semibold text-sm border-t pt-1 mt-1">
              <span>TOTAL</span><span className="num">{fmtTZS(receipt.total)}</span>
            </div>
            <div className="flex justify-between mt-1"><span>{receipt.payment}</span>
              {receipt.payment === "CASH" && <span className="num">Tendered {fmtTZS(receipt.tendered)} • Change {fmtTZS(receipt.change)}</span>}
            </div>
          </div>
          <div className="border-t border-dashed mt-3 pt-3 flex flex-col items-center gap-1">
            <div className="h-20 w-20 bg-foreground/90" style={{
              backgroundImage: "repeating-conic-gradient(hsl(var(--foreground)) 0% 25%, hsl(var(--background)) 25% 50%)",
              backgroundSize: "8px 8px",
            }} />
            <div className="text-[10px] text-muted-foreground">TRA Verification Code: {receipt.traCode}</div>
          </div>
          <div className="text-center mt-2 text-[10px] text-muted-foreground">Pharmacy. Simplified.</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => { window.print(); }}>Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
