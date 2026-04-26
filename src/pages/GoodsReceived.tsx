import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { purchaseOrders, suppliers, products, branches } from "@/data/seed";
import { useApp } from "@/context/AppContext";
import { fmtTZS, fmtDate } from "@/lib/format";
import { Plus, PackageCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface GrnLine { productId: string; qtyOrdered: number; qtyReceived: number; batchNo: string; expiry: string; unitCost: number; }
interface Grn {
  id: string; grnNo: string; date: string; supplierName: string; branchId: string;
  poRef: string; receivedBy: string; lines: GrnLine[]; total: number;
}

const initialGrns: Grn[] = [
  {
    id: "grn1", grnNo: "GRN-00101", date: new Date(Date.now() - 7 * 86400000).toISOString(),
    supplierName: "Shelys Pharmaceuticals Ltd", branchId: "br_main", poRef: "PO-0001", receivedBy: "John Mwangi",
    lines: [
      { productId: "p2", qtyOrdered: 50, qtyReceived: 50, batchNo: "AMX2401", expiry: "2026-09-30", unitCost: 3800 },
      { productId: "p3", qtyOrdered: 30, qtyReceived: 30, batchNo: "MET2401", expiry: "2026-12-31", unitCost: 5500 },
    ],
    total: 50 * 3800 + 30 * 5500,
  },
  {
    id: "grn2", grnNo: "GRN-00102", date: new Date(Date.now() - 3 * 86400000).toISOString(),
    supplierName: "Cosmos Limited", branchId: "br_main", poRef: "PO-0002", receivedBy: "John Mwangi",
    lines: [
      { productId: "p1", qtyOrdered: 100, qtyReceived: 60, batchNo: "PAN2402", expiry: "2027-03-31", unitCost: 1200 },
    ],
    total: 60 * 1200,
  },
  {
    id: "grn3", grnNo: "GRN-00103", date: new Date(Date.now() - 1 * 86400000).toISOString(),
    supplierName: "Cosmos Limited", branchId: "br_upanga", poRef: "PO-0002", receivedBy: "Grace Kimaro",
    lines: [
      { productId: "p5", qtyOrdered: 40, qtyReceived: 40, batchNo: "VTC2401", expiry: "2026-08-31", unitCost: 1800 },
    ],
    total: 40 * 1800,
  },
];

export default function GoodsReceived() {
  const location = useLocation();
  const navigate = useNavigate();
  const [grns, setGrns] = useState<Grn[]>(initialGrns);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPoId, setPickerPoId] = useState<string>("");
  const [viewGrn, setViewGrn] = useState<Grn | null>(null);

  const eligible = useMemo(
    () => purchaseOrders.filter((p) => p.status === "SENT" || p.status === "PARTIAL"),
    [],
  );

  // If a PO is passed from the PO page (Receive shortcut), skip the picker
  // and go straight into the wizard.
  useEffect(() => {
    const state: any = location.state;
    if (state?.poId) {
      window.history.replaceState({}, "");
      navigate(`/grn-wizard-preview?poId=${state.poId}`);
    }
  }, [location.state, navigate]);

  const openPicker = () => {
    setPickerPoId(eligible[0]?.id || "");
    setPickerOpen(true);
  };

  const continueToWizard = () => {
    if (!pickerPoId) {
      return;
    }
    setPickerOpen(false);
    navigate(`/grn-wizard-preview?poId=${pickerPoId}`);
  };

  const pickedPo = purchaseOrders.find((p) => p.id === pickerPoId);
  const pickedSup = suppliers.find((s) => s.id === pickedPo?.supplierId);
  const pickedBranch = branches.find((b) => b.id === pickedPo?.branchId);

  return (
    <AppLayout title="Goods Received">
      <PageHeader title="Goods Received Notes" description={`${grns.length} GRNs on file`} actions={
        <Button onClick={() => { setAutoPo(null); setSheetOpen(true); }}><Plus className="h-4 w-4 mr-1.5" /> New GRN</Button>
      } />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GRN No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>PO Ref</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead>Received By</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grns.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium num">{g.grnNo}</TableCell>
                <TableCell className="num text-xs">{fmtDate(g.date)}</TableCell>
                <TableCell>{g.supplierName}</TableCell>
                <TableCell className="num text-xs">{g.poRef}</TableCell>
                <TableCell className="text-right num">{g.lines.length}</TableCell>
                <TableCell className="text-right num">{fmtTZS(g.total)}</TableCell>
                <TableCell className="text-sm">{g.receivedBy}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setViewGrn(g)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <NewGrnSheet open={sheetOpen} onOpenChange={setSheetOpen} autoPoId={autoPo} onConfirm={onConfirm} />

      <Dialog open={!!viewGrn} onOpenChange={(o) => !o && setViewGrn(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{viewGrn?.grnNo} — {viewGrn?.supplierName}</DialogTitle></DialogHeader>
          {viewGrn && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><div className="text-xs text-muted-foreground">Date</div><div className="font-medium num">{fmtDate(viewGrn.date)}</div></div>
                <div><div className="text-xs text-muted-foreground">PO Ref</div><div className="font-medium num">{viewGrn.poRef}</div></div>
                <div><div className="text-xs text-muted-foreground">Received By</div><div className="font-medium">{viewGrn.receivedBy}</div></div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Batch</TableHead><TableHead>Expiry</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {viewGrn.lines.map((l) => {
                    const p = products.find((x) => x.id === l.productId);
                    return (
                      <TableRow key={l.productId}>
                        <TableCell className="text-sm font-medium">{p?.name}</TableCell>
                        <TableCell className="num text-xs">{l.batchNo}</TableCell>
                        <TableCell className="num text-xs">{fmtDate(l.expiry)}</TableCell>
                        <TableCell className="text-right num">{l.qtyReceived}</TableCell>
                        <TableCell className="text-right num">{fmtTZS(l.unitCost)}</TableCell>
                        <TableCell className="text-right num">{fmtTZS(l.qtyReceived * l.unitCost)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="text-right font-semibold">Total: <span className="num text-primary">{fmtTZS(viewGrn.total)}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function NewGrnSheet({ open, onOpenChange, autoPoId, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void; autoPoId: string | null; onConfirm: (g: Grn) => void;
}) {
  const { user } = useApp();
  const eligible = purchaseOrders.filter((p) => p.status === "SENT" || p.status === "PARTIAL");
  const [poId, setPoId] = useState<string>("");
  const [grnNo, setGrnNo] = useState(`GRN-${Date.now().toString().slice(-5)}`);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<GrnLine[]>([]);

  useEffect(() => {
    if (!open) return;
    setGrnNo(`GRN-${Date.now().toString().slice(-5)}`);
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    if (autoPoId) {
      setPoId(autoPoId);
      loadPo(autoPoId);
    } else {
      setPoId(""); setLines([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoPoId]);

  const loadPo = (id: string) => {
    const po = purchaseOrders.find((p) => p.id === id);
    if (!po) return setLines([]);
    setLines(po.lines.map((l) => ({
      productId: l.productId,
      qtyOrdered: l.qty,
      qtyReceived: l.qty - l.received,
      batchNo: "",
      expiry: "",
      unitCost: l.buyPrice,
    })));
  };

  const onPoChange = (id: string) => { setPoId(id); loadPo(id); };
  const updateLine = (pid: string, patch: Partial<GrnLine>) => setLines((prev) => prev.map((l) => l.productId === pid ? { ...l, ...patch } : l));

  const po = purchaseOrders.find((p) => p.id === poId);
  const sup = suppliers.find((s) => s.id === po?.supplierId);
  const branch = branches.find((b) => b.id === po?.branchId);
  const stockKey = po?.branchId === "br_main" ? "stockMain" : "stockUpanga";

  const grandTotal = useMemo(() => lines.reduce((a, l) => a + l.qtyReceived * l.unitCost, 0), [lines]);
  const anyReceived = lines.some((l) => l.qtyReceived > 0);

  const confirm = () => {
    if (!po) return toast.error("Select a Purchase Order");
    if (lines.some((l) => l.qtyReceived > 0 && (!l.batchNo.trim() || !l.expiry))) {
      return toast.error("Batch number and expiry required for all received items");
    }
    if (!anyReceived) return toast.error("Enter at least one received quantity");
    onConfirm({
      id: `grn_${Date.now()}`, grnNo, date: new Date(date).toISOString(),
      supplierName: sup?.name || "—", branchId: po.branchId, poRef: po.poNo,
      receivedBy: user?.name || "—",
      lines: lines.filter((l) => l.qtyReceived > 0),
      total: grandTotal,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader><SheetTitle>New Goods Received Note</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Select Purchase Order *</Label>
            <Select value={poId} onValueChange={onPoChange}>
              <SelectTrigger><SelectValue placeholder="Choose a PO..." /></SelectTrigger>
              <SelectContent>
                {eligible.map((p) => {
                  const s = suppliers.find((x) => x.id === p.supplierId);
                  return <SelectItem key={p.id} value={p.id}>{p.poNo} — {s?.name} — {fmtTZS(p.total)}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>

          {po && (
            <>
              <div className="grid grid-cols-3 gap-3 p-3 rounded-md bg-muted/30 text-sm">
                <div><div className="text-xs text-muted-foreground">Supplier</div><div className="font-medium">{sup?.name}</div></div>
                <div><div className="text-xs text-muted-foreground">Branch</div><div className="font-medium">{branch?.name}</div></div>
                <div><div className="text-xs text-muted-foreground">Received By</div><div className="font-medium">{user?.name}</div></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>GRN Number</Label><Input value={grnNo} readOnly className="num bg-muted/30" /></div>
                <div className="space-y-1.5"><Label>Received Date *</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              </div>

              <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>

              <div className="space-y-2 border-t pt-4">
                <div className="text-sm font-medium">Receiving Items</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>UoM</TableHead>
                      <TableHead className="text-right">Ordered</TableHead>
                      <TableHead className="w-20">Received</TableHead>
                      <TableHead className="w-32">Batch No.</TableHead>
                      <TableHead className="w-36">Expiry Date</TableHead>
                      <TableHead className="w-28">Unit Cost</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((l) => {
                      const p = products.find((x) => x.id === l.productId);
                      return (
                        <TableRow key={l.productId}>
                          <TableCell>
                            <div className="text-sm font-medium">{p?.name}</div>
                            <div className="text-[11px] text-muted-foreground">Supplier: {sup?.name}</div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p?.unit}</TableCell>
                          <TableCell className="text-right num">{l.qtyOrdered}</TableCell>
                          <TableCell><Input type="number" min={0} value={l.qtyReceived} className="h-8 num" onChange={(e) => updateLine(l.productId, { qtyReceived: Math.max(0, Number(e.target.value) || 0) })} /></TableCell>
                          <TableCell><Input value={l.batchNo} placeholder="BN..." className="h-8 num" onChange={(e) => updateLine(l.productId, { batchNo: e.target.value })} /></TableCell>
                          <TableCell><Input type="date" value={l.expiry} className="h-8 num" onChange={(e) => updateLine(l.productId, { expiry: e.target.value })} /></TableCell>
                          <TableCell><Input type="number" value={l.unitCost} className="h-8 num" onChange={(e) => updateLine(l.productId, { unitCost: Math.max(0, Number(e.target.value) || 0) })} /></TableCell>
                          <TableCell className="text-right num">{fmtTZS(l.qtyReceived * l.unitCost)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {anyReceived && (
                <Card className="p-4">
                  <div className="text-sm font-medium mb-2 flex items-center gap-1.5"><PackageCheck className="h-4 w-4 text-primary" /> GRN Summary — Stock Impact</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>UoM</TableHead>
                        <TableHead className="text-right">SOH Before</TableHead>
                        <TableHead className="text-right">Qty Received</TableHead>
                        <TableHead className="text-right">New SOH</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.filter((l) => l.qtyReceived > 0).map((l) => {
                        const p = products.find((x) => x.id === l.productId);
                        const before = (p as any)?.[stockKey] || 0;
                        return (
                          <TableRow key={l.productId}>
                            <TableCell className="text-sm">{p?.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p?.unit}</TableCell>
                            <TableCell className="text-right num">{before}</TableCell>
                            <TableCell className="text-right num text-success">+{l.qtyReceived}</TableCell>
                            <TableCell className="text-right num font-medium">{before + l.qtyReceived}</TableCell>
                            <TableCell className="text-right num">{fmtTZS(l.qtyReceived * l.unitCost)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="text-right pt-2 mt-2 border-t font-semibold">Grand Total: <span className="num text-primary">{fmtTZS(grandTotal)}</span></div>
                </Card>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="button" className="flex-1" onClick={confirm}>Confirm GRN</Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
