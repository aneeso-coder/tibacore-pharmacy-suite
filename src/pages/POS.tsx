import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { products, customers as seedCustomers, systemDefaults } from "@/data/seed";
import type { Product, PaymentMethod, MobileProvider, Customer, TaxCode } from "@/data/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtTZS } from "@/lib/format";
import { Wordmark } from "@/components/brand/Logo";
import {
  X, Search, Plus, Minus, Trash2, ShoppingCart, FileText, User as UserIcon, UserPlus,
  Footprints, Printer, MessageSquare, Mail, Lock, AlertTriangle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Line {
  productId: string; name: string; qty: number; unitPrice: number; discountPct: number; taxCode: TaxCode;
}

const TAX_RATE: Record<TaxCode, number> = { A: 18, B: 0, C: 0, D: 0, E: 0 };
const TAX_LABEL: Record<TaxCode, string> = { A: "VAT A 18%", B: "VAT B Special", C: "VAT C 0%", D: "VAT D Relief", E: "VAT E Exempt" };

export default function POS() {
  const { user, branch } = useApp();
  const nav = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("CASH");
  const [mobileProvider, setMobileProvider] = useState<MobileProvider | null>(null);
  const [mobileRef, setMobileRef] = useState("");
  const [creditDueDate, setCreditDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [tendered, setTendered] = useState<string>("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [receiptNo, setReceiptNo] = useState(() => `RC-${String(Date.now()).slice(-5)}`);
  const [traCode] = useState(() => `RCT${Math.floor(Math.random() * 900000 + 100000)}`);
  const [rxMode, setRxMode] = useState(false);
  const [rxId, setRxId] = useState<string | null>(null);

  // Customer dialog state
  const [custSearchOpen, setCustSearchOpen] = useState(false);
  const [custQuery, setCustQuery] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");

  useEffect(() => {
    const state: any = location.state;
    if (state?.rxLines) {
      const rxCart = state.rxLines
        .map((l: any) => {
          const product = products.find((p) => p.id === l.productId);
          if (!product) return null;
          const remaining = l.prescribedQty - l.dispensedQty;
          if (remaining <= 0) return null;
          return {
            productId: product.id, name: product.name, qty: remaining,
            unitPrice: product.sellPrice, discountPct: 0, taxCode: product.taxCode,
          } as Line;
        })
        .filter(Boolean) as Line[];
      setCart(rxCart);
      setRxMode(true);
      setRxId(state.rxId ?? null);
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Smart VAT calculation — group by tax code
  const calc = useMemo(() => {
    let subtotal = 0, discount = 0;
    const vatByCode: Partial<Record<TaxCode, number>> = {};
    cart.forEach((l) => {
      const gross = l.qty * l.unitPrice;
      const d = gross * (l.discountPct / 100);
      const net = gross - d;
      subtotal += gross; discount += d;
      const rate = TAX_RATE[l.taxCode];
      const v = rate > 0 ? (net * rate) / (100 + rate) : 0;
      vatByCode[l.taxCode] = (vatByCode[l.taxCode] || 0) + v;
    });
    const total = subtotal - discount;
    return { subtotal, discount, vatByCode, total };
  }, [cart]);

  const tenderedNum = Number(tendered.replace(/,/g, "")) || 0;
  const change = payment === "CASH" && tendered ? tenderedNum - calc.total : 0;

  const handleTenderedChange = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) return setTendered("");
    setTendered(Number(digits).toLocaleString("en-US"));
  };

  const completeSale = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (payment === "CASH" && tenderedNum < calc.total) return toast.error("Insufficient cash tendered");
    if (payment === "MOBILE" && !mobileProvider) return toast.error("Select a mobile money provider");
    if (payment === "MOBILE" && !mobileRef.trim()) return toast.error("Enter a reference number");

    // Rx requires customer when system setting on
    if (systemDefaults.requireCustomerForRx) {
      const hasRx = cart.some((l) => products.find((p) => p.id === l.productId)?.rxRequired);
      if (hasRx && !selectedCustomer) return toast.error("This sale contains Rx items — attach a customer first");
    }

    const receipt = {
      receiptNo, traCode, traStatus: "PENDING" as const, date: new Date(), branch, cashier: user?.name,
      customer: selectedCustomer?.name ?? "Walk-in",
      customerId: selectedCustomer?.id,
      lines: cart, ...calc, payment,
      mobileProvider, mobileRef,
      creditDueDate: payment === "CREDIT" ? creditDueDate : undefined,
      tendered: tenderedNum, change: Math.max(0, change),
    };
    setLastReceipt(receipt);
    setReceiptOpen(true);
  };

  const reset = () => {
    setCart([]); setTendered(""); setSelectedCustomer(null); setPayment("CASH");
    setMobileProvider(null); setMobileRef("");
    setReceiptNo(`RC-${String(Date.now()).slice(-5)}`);
    setRxMode(false); setRxId(null);
  };

  const filteredCustomers = useMemo(() => {
    if (!custQuery.trim()) return customers.slice(0, 20);
    const q = custQuery.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(custQuery)).slice(0, 20);
  }, [custQuery, customers]);

  const handleQuickAdd = () => {
    if (!quickName.trim() || !quickPhone.trim()) return toast.error("Name and phone are required");
    const newCust: Customer = { id: `c_new_${Date.now()}`, name: quickName.trim(), phone: quickPhone.trim() };
    setCustomers((cs) => [newCust, ...cs]);
    setSelectedCustomer(newCust);
    setQuickName(""); setQuickPhone("");
    setQuickAddOpen(false);
    toast.success(`${newCust.name} added`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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

      {rxMode && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-primary">
            <FileText className="h-4 w-4" />
            <span>Dispensing prescription <span className="font-semibold">{rxId}</span> — Rx items have been pre-loaded into cart.</span>
          </div>
          <button onClick={reset} className="text-primary hover:text-primary/70 text-xs font-medium flex items-center gap-1">
            <X className="h-3.5 w-3.5" /> Clear Rx
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
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
                  <button key={p.id} disabled={oos} onClick={() => addToCart(p)}
                    className={cn("text-left rounded-lg border p-3 hover:border-primary hover:shadow-sm transition bg-card disabled:opacity-50 disabled:cursor-not-allowed")}>
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
              {(() => {
                const codes = Object.keys(calc.vatByCode) as TaxCode[];
                const allA = codes.length === 1 && codes[0] === "A";
                if (allA) return <Row label="VAT (18%)" value={fmtTZS(calc.vatByCode.A || 0)} muted />;
                return codes.map((code) => (
                  <Row key={code} label={TAX_LABEL[code]} value={fmtTZS(calc.vatByCode[code] || 0)} muted />
                ));
              })()}
            </div>
            <div className="flex justify-between items-baseline">
              <div className="text-sm font-medium">Grand Total</div>
              <div className="text-2xl font-bold text-primary num">{fmtTZS(calc.total)}</div>
            </div>

            {/* Customer picker */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Customer</Label>
              {selectedCustomer ? (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-primary/10 border border-primary/30 text-sm">
                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium flex-1 truncate">{selectedCustomer.name}</span>
                  <span className="text-xs text-muted-foreground num">{selectedCustomer.phone}</span>
                  <button onClick={() => setSelectedCustomer(null)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setCustQuery(""); setCustSearchOpen(true); }}>
                    <Search className="h-3.5 w-3.5 mr-1" /> Search
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setQuickAddOpen(true)}>
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> Quick-Add
                  </Button>
                  <Button type="button" variant="default" size="sm" onClick={() => { setSelectedCustomer(null); toast.info("Walk-in sale"); }}>
                    <Footprints className="h-3.5 w-3.5 mr-1" /> Walk-in
                  </Button>
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <div className={cn("grid gap-1.5", systemDefaults.allowCreditSales ? "grid-cols-4" : "grid-cols-3")}>
                {(["CASH", "MOBILE", "CARD"] as const).map((m) => (
                  <Button key={m} type="button" variant={payment === m ? "default" : "outline"} size="sm"
                    onClick={() => { setPayment(m); if (m !== "MOBILE") { setMobileProvider(null); setMobileRef(""); } }}>
                    {m}
                  </Button>
                ))}
                {systemDefaults.allowCreditSales && (
                  <Button type="button" variant={payment === "CREDIT" ? "default" : "outline"} size="sm" onClick={() => setPayment("CREDIT")}>
                    CREDIT
                  </Button>
                )}
              </div>

              {payment === "MOBILE" && (
                <div className="space-y-2 rounded-md bg-muted/40 p-2">
                  <div className="grid grid-cols-4 gap-1">
                    {(["MPESA","TIGO_PESA","AIRTEL_MONEY","HALOPESA"] as MobileProvider[]).map((mp) => (
                      <button key={mp} type="button" onClick={() => setMobileProvider(mp)}
                        className={cn("text-[11px] px-1.5 py-1 rounded border transition",
                          mobileProvider === mp ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted")}>
                        {mp === "MPESA" ? "M-Pesa" : mp === "TIGO_PESA" ? "Tigo Pesa" : mp === "AIRTEL_MONEY" ? "Airtel" : "Halopesa"}
                      </button>
                    ))}
                  </div>
                  <Input placeholder="Reference No. (required)" value={mobileRef} onChange={(e) => setMobileRef(e.target.value)} className="h-8 text-xs num" />
                </div>
              )}

              {payment === "CREDIT" && (
                <div className="rounded-md bg-muted/40 p-2 space-y-1.5">
                  <Label className="text-xs">Due Date</Label>
                  <Input type="date" value={creditDueDate} onChange={(e) => setCreditDueDate(e.target.value)} className="h-8 text-xs" />
                </div>
              )}

              {payment === "CASH" && (
                <div className="grid grid-cols-2 gap-2 items-center">
                  <Input
                    placeholder="Tendered"
                    inputMode="numeric"
                    value={tendered}
                    onChange={(e) => handleTenderedChange(e.target.value)}
                    className="h-10 num text-base"
                  />
                  <div className="text-sm text-right">
                    <span className="text-muted-foreground">Change </span>
                    <span className={cn("font-semibold num text-base", change < 0 ? "text-destructive" : "text-foreground")}>
                      {change < 0 ? `- ${fmtTZS(Math.abs(change))}` : fmtTZS(change)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-1">
              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold shadow-sm hover:shadow-md transition-all"
                onClick={completeSale}
                disabled={!cart.length}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Complete Sale • {fmtTZS(calc.total)}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {receiptOpen && lastReceipt && (
        <ReceiptDialog open={receiptOpen} onClose={() => { setReceiptOpen(false); reset(); }} receipt={lastReceipt} />
      )}

      {/* Customer search dialog */}
      <Dialog open={custSearchOpen} onOpenChange={setCustSearchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Find Customer</DialogTitle></DialogHeader>
          <Input autoFocus placeholder="Search by name or phone..." value={custQuery} onChange={(e) => setCustQuery(e.target.value)} />
          <div className="max-h-72 overflow-y-auto -mx-2">
            {filteredCustomers.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">No matches</div>
            ) : filteredCustomers.map((c) => (
              <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustSearchOpen(false); }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted rounded-md text-left">
                <span className="font-medium text-sm">{c.name}</span>
                <span className="text-xs text-muted-foreground num">{c.phone}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick-add customer */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Quick-Add Customer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Full Name *</Label>
              <Input value={quickName} onChange={(e) => setQuickName(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Phone *</Label>
              <Input value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} placeholder="+255..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickAddOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickAdd}>Add & Select</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [voidOpen, setVoidOpen] = useState(false);
  const codes = Object.keys(receipt.vatByCode || {}) as TaxCode[];
  const allA = codes.length === 1 && codes[0] === "A";

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Receipt</DialogTitle>
              {receipt.payment === "CREDIT" && <Badge variant="outline" className="bg-info/15 text-info border-info/30">Credit Sale</Badge>}
            </div>
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
            {receipt.payment === "CREDIT" && receipt.creditDueDate && (
              <div className="flex justify-between"><span>Due</span><span className="num">{receipt.creditDueDate}</span></div>
            )}
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
              {allA ? (
                <div className="flex justify-between"><span>VAT 18%</span><span className="num">{fmtTZS(receipt.vatByCode.A || 0)}</span></div>
              ) : codes.map((code) => (
                <div key={code} className="flex justify-between"><span>{TAX_LABEL[code]}</span><span className="num">{fmtTZS(receipt.vatByCode[code] || 0)}</span></div>
              ))}
              <div className="flex justify-between font-semibold text-sm border-t pt-1 mt-1">
                <span>TOTAL</span><span className="num">{fmtTZS(receipt.total)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>{receipt.payment}{receipt.mobileProvider ? ` • ${receipt.mobileProvider}` : ""}</span>
                {receipt.payment === "CASH" && <span className="num">Tendered {fmtTZS(receipt.tendered)} • Change {fmtTZS(receipt.change)}</span>}
                {receipt.payment === "MOBILE" && receipt.mobileRef && <span className="num">Ref {receipt.mobileRef}</span>}
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
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="grid grid-cols-4 gap-1.5 w-full">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5 mr-1" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.success(`SMS sent to customer (demo)`)}>
                <MessageSquare className="h-3.5 w-3.5 mr-1" /> SMS
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.success(`Email sent to customer (demo)`)}>
                <Mail className="h-3.5 w-3.5 mr-1" /> Email
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>Skip — Close</Button>
            </div>
          </DialogFooter>
          <div className="text-xs text-muted-foreground text-center">
            Receipt #{receipt.receiptNo} can be reprinted from Sales History.
          </div>
          <div className="flex justify-center pt-1">
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setVoidOpen(true)}>
              Void This Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <VoidDialog open={voidOpen} onClose={() => setVoidOpen(false)} receipt={receipt} onVoided={() => { setVoidOpen(false); onClose(); }} />
    </>
  );
}

function VoidDialog({ open, onClose, receipt, onVoided }: { open: boolean; onClose: () => void; receipt: any; onVoided: () => void }) {
  const [reason, setReason] = useState("");
  const [pin, setPin] = useState("");
  const isSubmitted = receipt?.traStatus === "SUBMITTED";

  const handleConfirm = () => {
    if (!reason) return toast.error("Select a void reason");
    if (!pin) return toast.error("Enter authorisation PIN");
    if (pin !== "pharma123" && pin !== "admin123") return toast.error("Invalid PIN");
    if (isSubmitted) {
      const newGc = `RCT${Math.floor(Math.random() * 900000 + 100000)}`;
      toast.success(`Reversal receipt #${newGc} created and queued for TRA submission.`);
    } else {
      toast.success("Sale voided. TRA submission cancelled.");
    }
    setReason(""); setPin("");
    onVoided();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {isSubmitted ? "Reverse Submitted Sale" : "Void Sale"}
          </DialogTitle>
        </DialogHeader>
        {isSubmitted && (
          <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs flex gap-2">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              This sale was already submitted to TRA. A reversal receipt will be generated and submitted as a new transaction. The original sale stays in history marked as REVERSED.
            </div>
          </div>
        )}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pricing">Pricing Error</SelectItem>
                <SelectItem value="customer">Customer Request</SelectItem>
                <SelectItem value="duplicate">Duplicate Entry</SelectItem>
                <SelectItem value="system">System Error</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Pharmacist / Admin PIN</Label>
            <Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN" />
            <p className="text-xs text-muted-foreground">Hint (demo): pharma123 or admin123</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {isSubmitted ? "Generate Reversal" : "Void Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
