import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { purchaseOrders, suppliers, products } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui-ext/Badges";
import { fmtTZS, fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const tone = { DRAFT: "default", SENT: "info", PARTIAL: "warning", RECEIVED: "success", CANCELLED: "danger" } as const;

export default function PurchaseOrders() {
  const [open, setOpen] = useState(false);
  return (
    <AppLayout title="Purchase Orders">
      <PageHeader title="Purchase Orders" description={`${purchaseOrders.length} orders`} actions={
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New PO</Button>
      } />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
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
            {purchaseOrders.map((po) => {
              const sup = suppliers.find((s) => s.id === po.supplierId);
              return (
                <TableRow key={po.id}>
                  <TableCell className="font-medium num">{po.poNo}</TableCell>
                  <TableCell>{sup?.name}</TableCell>
                  <TableCell className="num text-xs">{fmtDate(po.date)}</TableCell>
                  <TableCell className="num text-xs">{fmtDate(po.expectedDate)}</TableCell>
                  <TableCell className="text-right num">{po.lines.length}</TableCell>
                  <TableCell className="text-right num">{fmtTZS(po.total)}</TableCell>
                  <TableCell><StatusBadge status={po.status} tone={tone[po.status]} /></TableCell>
                  <TableCell className="text-right">
                    {(po.status === "SENT" || po.status === "PARTIAL") && (
                      <Button size="sm" variant="outline" onClick={() => toast.success("GRN created (demo)")}>
                        Receive
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader><SheetTitle>New Purchase Order</SheetTitle></SheetHeader>
          <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); toast.success("PO created (demo)"); setOpen(false); }}>
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Select defaultValue="br_main"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="br_main">Main Branch</SelectItem>
                <SelectItem value="br_upanga">Upanga Branch</SelectItem>
              </SelectContent></Select>
            </div>
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Select defaultValue="s1"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent></Select>
            </div>
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select defaultValue="p1"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {products.slice(0, 10).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" defaultValue={10} /></div>
              <div className="space-y-1.5"><Label>Expected Date</Label><Input type="date" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1">Create PO</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
