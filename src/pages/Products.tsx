import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { products } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fmtTZS } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export default function Products() {
  const { showBuyPrices } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [add, setAdd] = useState(false);

  const cats = Array.from(new Set(products.map((p) => p.category)));
  const filtered = useMemo(() => {
    let list = products;
    if (q.trim()) {
      const ql = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(ql) || p.barcode.includes(q));
    }
    if (cat !== "ALL") list = list.filter((p) => p.category === cat);
    return list;
  }, [q, cat]);

  return (
    <AppLayout title="Products">
      <PageHeader
        title="Products"
        description="Manage your pharmacy catalog"
        actions={
          <>
            <Button variant="outline" onClick={() => toast.info("CSV template downloaded (demo)")}>
              <Upload className="h-4 w-4 mr-1.5" /> Batch Import
            </Button>
            <Button onClick={() => setAdd(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Product
            </Button>
          </>
        }
      />
      <Card className="p-3 mb-4 flex flex-wrap gap-2">
        <Input placeholder="Search by name or barcode..." className="max-w-xs" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barcode</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Pack</TableHead>
              <TableHead className="text-right">Sell</TableHead>
              {showBuyPrices && <TableHead className="text-right">Buy</TableHead>}
              <TableHead className="text-right">Main</TableHead>
              <TableHead className="text-right">Upanga</TableHead>
              <TableHead className="text-right">Reorder</TableHead>
              <TableHead>Tax</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const low = p.stockMain <= p.reorderPoint || p.stockUpanga <= p.reorderPoint;
              return (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell className="num text-xs text-muted-foreground">{p.barcode}</TableCell>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    {p.rxRequired && <Badge variant="outline" className="mt-0.5 text-[10px] border-info/40 text-info">Rx</Badge>}
                    {p.controlled && <Badge variant="outline" className="ml-1 mt-0.5 text-[10px] border-destructive/40 text-destructive">Controlled</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">{p.category}</TableCell>
                  <TableCell className="text-xs">{p.packSize}</TableCell>
                  <TableCell className="text-right num">{fmtTZS(p.sellPrice)}</TableCell>
                  {showBuyPrices && <TableCell className="text-right num text-muted-foreground">{fmtTZS(p.buyPrice)}</TableCell>}
                  <TableCell className="text-right num">{p.stockMain}</TableCell>
                  <TableCell className="text-right num">{p.stockUpanga}</TableCell>
                  <TableCell className="text-right num text-muted-foreground">{p.reorderPoint}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{p.taxCode}</Badge></TableCell>
                  <TableCell>
                    {low ? <Badge variant="outline" className="text-warning border-warning/30">Low</Badge> :
                      <Badge variant="outline" className="text-success border-success/30">OK</Badge>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={add} onOpenChange={setAdd}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader><SheetTitle>Add Product</SheetTitle></SheetHeader>
          <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); toast.success("Product saved (demo)"); setAdd(false); }}>
            {[
              { label: "Barcode", placeholder: "601001234" },
              { label: "Name", placeholder: "Product name" },
              { label: "Category", placeholder: "e.g. Analgesic" },
              { label: "Pack size", placeholder: "x10" },
              { label: "Selling price (TZS)", placeholder: "0", type: "number" },
              { label: "Buying price (TZS)", placeholder: "0", type: "number" },
              { label: "Reorder point", placeholder: "0", type: "number" },
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input type={f.type ?? "text"} placeholder={f.placeholder} required />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Tax code</Label>
              <Select defaultValue="A">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A — Standard 18%</SelectItem>
                  <SelectItem value="C">C — Zero rated</SelectItem>
                  <SelectItem value="E">E — Exempt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAdd(false)}>Cancel</Button>
              <Button type="submit" className="flex-1">Save</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
