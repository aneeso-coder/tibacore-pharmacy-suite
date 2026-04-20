import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui-ext/Badges";
import { prescriptions as seedRx, products, customers, batches, sales, insuranceProviders, insurancePrices } from "@/data/seed";
import { fmtDate, fmtTZS } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Eye, X } from "lucide-react";
import type { Prescription } from "@/data/types";

const tone = { ACTIVE: "info", DISPENSED: "success", PARTIAL: "warning", EXPIRED: "danger" } as const;

export default function Prescriptions() {
  const [list, setList] = useState<Prescription[]>(seedRx);
  const [tab, setTab] = useState("pending");
  const [dispenseRx, setDispenseRx] = useState<Prescription | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [viewRx, setViewRx] = useState<Prescription | null>(null);

  const pending = list.filter((r) => r.status === "ACTIVE" || r.status === "PARTIAL");
  const dispensed = list.filter((r) => r.status === "DISPENSED" || r.status === "EXPIRED");

  return (
    <AppLayout title="Prescriptions">
      <PageHeader
        title="Prescriptions"
        description={`${pending.length} pending • ${dispensed.length} dispensed`}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New Prescription</Button>}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Rx ({pending.length})</TabsTrigger>
          <TabsTrigger value="dispensed">Dispensed Rx ({dispensed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rx No.</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">No pending prescriptions</TableCell></TableRow>
                ) : pending.map((rx) => (
                  <TableRow key={rx.id}>
                    <TableCell className="font-medium num">{rx.rxNo}</TableCell>
                    <TableCell>{rx.patient}</TableCell>
                    <TableCell className="text-xs">{rx.prescriber}</TableCell>
                    <TableCell className="text-right num">{rx.lines.length}</TableCell>
                    <TableCell className="num text-xs">{fmtDate(rx.date)}</TableCell>
                    <TableCell><StatusBadge status={rx.status} tone={tone[rx.status]} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => setDispenseRx(rx)}>Dispense</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="dispensed">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rx No.</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Sale Ref</TableHead>
                  <TableHead>Dispensed</TableHead>
                  <TableHead>Insurer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispensed.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-sm text-muted-foreground">No dispensed prescriptions</TableCell></TableRow>
                ) : dispensed.map((rx) => {
                  // Mock: link sale by name match
                  const sale = sales.find((s) => s.customerName === rx.patient);
                  return (
                    <TableRow key={rx.id}>
                      <TableCell className="font-medium num">{rx.rxNo}</TableCell>
                      <TableCell>{rx.patient}</TableCell>
                      <TableCell className="text-xs">{rx.prescriber}</TableCell>
                      <TableCell className="num text-xs">{sale?.receiptNo ?? "—"}</TableCell>
                      <TableCell className="num text-xs">{fmtDate(rx.date)}</TableCell>
                      <TableCell className="text-xs">Cash</TableCell>
                      <TableCell className="text-right num">{sale ? fmtTZS(sale.total) : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setViewRx(rx)}><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {dispenseRx && <DispenseSheet rx={dispenseRx} onClose={() => setDispenseRx(null)} />}
      {addOpen && <NewRxSheet onClose={() => setAddOpen(false)} onSave={(r) => { setList((p) => [r, ...p]); setAddOpen(false); toast.success("Prescription added"); }} />}
      {viewRx && <ViewRxSheet rx={viewRx} onClose={() => setViewRx(null)} />}
    </AppLayout>
  );
}

function DispenseSheet({ rx, onClose }: { rx: Prescription; onClose: () => void }) {
  const navigate = useNavigate();
  const [isInsurance, setIsInsurance] = useState(false);
  const [providerId, setProviderId] = useState<string>("");
  const [policyNo, setPolicyNo] = useState("");
  const [preAuth, setPreAuth] = useState("");
  const [batchSelections, setBatchSelections] = useState<Record<string, string>>({});

  const provider = insuranceProviders.find((p) => p.id === providerId);
  const copay = provider ? insurancePrices.find((ip) => ip.providerId === providerId)?.copayPercent ?? 0 : 0;

  const lineDetails = useMemo(() => rx.lines.map((l) => {
    const product = products.find((p) => p.id === l.productId)!;
    const soh = product ? product.stockMain + product.stockUpanga : 0;
    const remaining = l.prescribedQty - l.dispensedQty;
    const insPrice = providerId ? insurancePrices.find((ip) => ip.providerId === providerId && ip.productId === l.productId) : null;
    const unitPrice = insPrice ? insPrice.insuredPrice : product.sellPrice;
    return { l, product, soh, remaining, unitPrice, batches: batches.filter((b) => b.productId === l.productId) };
  }), [rx, providerId]);

  const subtotal = lineDetails.reduce((a, d) => a + d.unitPrice * d.remaining, 0);
  const patientPays = isInsurance ? subtotal * (copay / 100) : subtotal;
  const insurerPays = isInsurance ? subtotal - patientPays : 0;

  const dispense = () => {
    if (isInsurance && (!providerId || !policyNo)) {
      toast.error("Insurance provider and policy number required");
      return;
    }
    const rxLines = rx.lines.map((l) => ({ productId: l.productId, prescribedQty: l.prescribedQty, dispensedQty: l.dispensedQty }));
    toast.success(`Loading ${rx.rxNo} into POS${isInsurance ? ` — ${provider?.shortCode}` : ""}`);
    navigate("/pos", {
      state: {
        rxId: rx.id, rxLines,
        insurance: isInsurance ? { providerId, providerName: provider?.name, policyNo, preAuth, copayPercent: copay } : null,
      },
    });
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Dispense {rx.rxNo}</SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 p-3 rounded-md">
            <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{rx.patient}</span></div>
            <div><span className="text-muted-foreground">Doctor:</span> <span className="font-medium">{rx.prescriber}</span></div>
            <div><span className="text-muted-foreground">Date:</span> <span className="font-medium num">{fmtDate(rx.date)}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={rx.status} tone={tone[rx.status]} /></div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Line Items</h4>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">SOH</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineDetails.map((d) => (
                    <TableRow key={d.l.productId}>
                      <TableCell className="font-medium text-xs">{d.product.name}</TableCell>
                      <TableCell className="text-right num">{d.remaining}</TableCell>
                      <TableCell className="text-right num text-xs">{d.soh}</TableCell>
                      <TableCell>
                        <Select value={batchSelections[d.l.productId] ?? ""} onValueChange={(v) => setBatchSelections((p) => ({ ...p, [d.l.productId]: v }))}>
                          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Pick batch" /></SelectTrigger>
                          <SelectContent>
                            {d.batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.batchNo} ({b.qtyRemaining} avail)</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right num text-xs">{fmtTZS(d.unitPrice)}</TableCell>
                      <TableCell className="text-right num">{fmtTZS(d.unitPrice * d.remaining)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Insurance Claim?</Label>
                <p className="text-xs text-muted-foreground">Toggle on to apply insurer pricing &amp; co-pay</p>
              </div>
              <Switch checked={isInsurance} onCheckedChange={setIsInsurance} />
            </div>

            {isInsurance && (
              <div className="space-y-3 pt-3 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Insurance Provider *</Label>
                    <Select value={providerId} onValueChange={setProviderId}>
                      <SelectTrigger><SelectValue placeholder="Select insurer" /></SelectTrigger>
                      <SelectContent>
                        {insuranceProviders.filter((p) => p.active).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Policy Number *</Label>
                    <Input value={policyNo} onChange={(e) => setPolicyNo(e.target.value)} placeholder="e.g. NHIF-2024-1234" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Pre-auth Code <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={preAuth} onChange={(e) => setPreAuth(e.target.value)} placeholder="e.g. PA-A-7821" />
                </div>
                {provider && (
                  <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                    <div><div className="text-xs text-muted-foreground">Co-pay %</div><div className="num font-medium">{copay}%</div></div>
                    <div><div className="text-xs text-muted-foreground">Patient pays</div><div className="num font-medium text-primary">{fmtTZS(patientPays)}</div></div>
                    <div><div className="text-xs text-muted-foreground">Insurer pays</div><div className="num font-medium">{fmtTZS(insurerPays)}</div></div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <div className="bg-primary/5 p-3 rounded-md flex items-center justify-between">
            <div className="text-sm font-medium">Total</div>
            <div className="text-lg font-semibold num">{fmtTZS(subtotal)}</div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={dispense}>Dispense &amp; Complete Sale</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function NewRxSheet({ onClose, onSave }: { onClose: () => void; onSave: (rx: Prescription) => void }) {
  const [rxNo, setRxNo] = useState(`RX-${String(Math.floor(Math.random() * 9000) + 1000)}`);
  const [doctor, setDoctor] = useState("");
  const [patientId, setPatientId] = useState<string>("");
  const [quickName, setQuickName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validity, setValidity] = useState(30);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<{ productId: string; qty: number }[]>([]);

  const addLine = () => setLines((l) => [...l, { productId: "", qty: 1 }]);
  const removeLine = (i: number) => setLines((l) => l.filter((_, idx) => idx !== i));

  const patient = patientId ? customers.find((c) => c.id === patientId)?.name ?? "" : quickName;
  const canSave = rxNo && doctor && patient && lines.length > 0 && lines.every((l) => l.productId && l.qty > 0);

  const save = () => {
    if (!canSave) return;
    onSave({
      id: `rx_${Date.now()}`,
      rxNo, prescriber: doctor, patient,
      date: new Date(date).toISOString(),
      status: "ACTIVE",
      lines: lines.map((l) => ({ productId: l.productId, prescribedQty: l.qty, dispensedQty: 0 })),
    });
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>New Prescription</SheetTitle></SheetHeader>

        <div className="space-y-3 mt-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Rx Number *</Label>
              <Input value={rxNo} onChange={(e) => setRxNo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Prescribing Doctor *</Label>
            <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="e.g. Dr. Mwakasege" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Patient *</Label>
            <Select value={patientId} onValueChange={(v) => { setPatientId(v); setQuickName(""); }}>
              <SelectTrigger><SelectValue placeholder="Select existing customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">— or —</div>
            <Input placeholder="Quick-add patient name" value={quickName} onChange={(e) => { setQuickName(e.target.value); setPatientId(""); }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Validity (days)</Label>
              <Input type="number" value={validity} onChange={(e) => setValidity(parseInt(e.target.value) || 30)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Rx Lines * ({lines.length})</Label>
              <Button size="sm" variant="outline" onClick={addLine}><Plus className="h-3.5 w-3.5 mr-1" /> Add Line</Button>
            </div>
            {lines.length === 0 && <div className="text-xs text-muted-foreground py-3 text-center">No lines yet — add at least one item.</div>}
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select value={l.productId} onValueChange={(v) => setLines((prev) => prev.map((x, idx) => idx === i ? { ...x, productId: v } : x))}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Product" /></SelectTrigger>
                  <SelectContent>
                    {products.filter((p) => p.rxRequired).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" className="w-20 text-center num" value={l.qty} onChange={(e) => setLines((prev) => prev.map((x, idx) => idx === i ? { ...x, qty: parseInt(e.target.value) || 1 } : x))} />
                <Button size="icon" variant="ghost" onClick={() => removeLine(i)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!canSave}>Save Prescription</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ViewRxSheet({ rx, onClose }: { rx: Prescription; onClose: () => void }) {
  const sale = sales.find((s) => s.customerName === rx.patient);
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>{rx.rxNo}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-5 text-sm">
          <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-md">
            <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{rx.patient}</span></div>
            <div><span className="text-muted-foreground">Doctor:</span> <span className="font-medium">{rx.prescriber}</span></div>
            <div><span className="text-muted-foreground">Date:</span> <span className="num">{fmtDate(rx.date)}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={rx.status} tone={tone[rx.status]} /></div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Items</h4>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Prescribed</TableHead>
                  <TableHead className="text-right">Dispensed</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rx.lines.map((l) => {
                    const p = products.find((x) => x.id === l.productId);
                    return (
                      <TableRow key={l.productId}>
                        <TableCell className="text-xs font-medium">{p?.name ?? "—"}</TableCell>
                        <TableCell className="text-right num">{l.prescribedQty}</TableCell>
                        <TableCell className="text-right num">{l.dispensedQty}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
          {sale && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Linked Sale</h4>
              <Card className="p-3 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Receipt:</span> <span className="font-medium num">{sale.receiptNo}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date:</span> <span className="num">{fmtDate(sale.date)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total:</span> <span className="font-medium num">{fmtTZS(sale.total)}</span></div>
              </Card>
            </div>
          )}
        </div>
        <SheetFooter className="mt-6">
          <Button onClick={onClose}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
