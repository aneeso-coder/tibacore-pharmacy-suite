import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { products, suppliers } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fmtTZS } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Lightbulb } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { useBranchFilter } from "@/components/ui-ext/BranchFilter";

const CATEGORY_OPTIONS = [
  "Analgesics","Antibiotics","Antidiabetics","Antimalarials","Antifungals","Antiparasitics",
  "Vitamins & Supplements","IV Fluids & Solutions","Topical / Dermatology",
  "Diagnostics & Consumables","Surgical Supplies","Other",
];

const UOM_OPTIONS = [
  "Tablet","Capsule","Suspension","Liquid","Cream","Injection","Sachet","Syrup","Drops",
  "Suppository","Patch","Powder","Box","Pack","Unit","Tin","Bottle","Vial","Ampoule","Strip","Tube",
];

const TAX_OPTIONS: { value: string; label: string }[] = [
  { value: "A", label: "A — Standard 18% VAT" },
  { value: "C", label: "C — Zero Rated" },
  { value: "E", label: "E — Exempt" },
  { value: "B", label: "B — Special Rate" },
  { value: "D", label: "D — Special Relief" },
];

export default function Products() {
  const { showBuyPrices, user } = useApp();
  const isAdmin = user?.branchId === "ALL";
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [add, setAdd] = useState(false);
  const [branchSel, setBranchSel] = useState<string>("ALL");
  const branchFilter = useBranchFilter(branchSel, setBranchSel);

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

  const sohFor = (p: typeof products[number]) => {
    if (!isAdmin) return p[(user?.branchId === "br_main" ? "stockMain" : "stockUpanga") as "stockMain"];
    if (branchSel === "br_main") return p.stockMain;
    if (branchSel === "br_upanga") return p.stockUpanga;
    return null; // ALL
  };

  return (
    <AppLayout title="Products">
      <PageHeader
        title="Products"
        description="Catalog of items you sell. Stock levels are tracked separately."
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
      <Card className="p-3 mb-4 flex flex-wrap gap-2 items-center">
        <Input placeholder="Search by name or barcode..." className="max-w-xs" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {branchFilter.control}
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
              {showBuyPrices && <TableHead className="text-right">Buy (Ref.)</TableHead>}
              <TableHead className="text-right">SOH {isAdmin && branchSel === "ALL" ? "(per branch)" : "(this branch)"}</TableHead>
              <TableHead className="text-right">Reorder</TableHead>
              <TableHead>Tax</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const soh = sohFor(p);
              const total = p.stockMain + p.stockUpanga;
              const low = soh !== null ? soh <= p.reorderPoint : (p.stockMain <= p.reorderPoint || p.stockUpanga <= p.reorderPoint);
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
                  <TableCell className="text-right num">
                    {soh !== null ? (
                      soh
                    ) : (
                      <span className="flex flex-col items-end leading-tight text-xs">
                        <span>Main: <span className="font-medium">{p.stockMain}</span></span>
                        <span>Upanga: <span className="font-medium">{p.stockUpanga}</span></span>
                      </span>
                    )}
                  </TableCell>
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

      <AddProductSheet open={add} onOpenChange={setAdd} />
    </AppLayout>
  );
}

function AddProductSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [generic, setGeneric] = useState("");
  const [category, setCategory] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [barcode, setBarcode] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [taxCode, setTaxCode] = useState("A");
  const [supplierId, setSupplierId] = useState<string>("none");
  const [rxRequired, setRxRequired] = useState(false);
  const [controlled, setControlled] = useState(false);
  const [reorderPoint, setReorderPoint] = useState("10");
  const [notes, setNotes] = useState("");

  // duplicate-name suggestion
  const suggestion = useMemo(() => {
    if (name.trim().length < 3) return null;
    const ql = name.trim().toLowerCase();
    // simple substring "similarity": if existing name contains the typed token (>70% length match)
    return products.find((p) => {
      const pl = p.name.toLowerCase();
      if (pl === ql) return true;
      if (pl.includes(ql) && ql.length / pl.length > 0.5) return true;
      if (ql.includes(pl) && pl.length / ql.length > 0.7) return true;
      return false;
    }) ?? null;
  }, [name]);

  const reset = () => {
    setName(""); setGeneric(""); setCategory(""); setUnit(""); setBarcode("");
    setSellPrice(""); setBuyPrice(""); setTaxCode("A"); setSupplierId("none");
    setRxRequired(false); setControlled(false); setReorderPoint("10"); setNotes("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category || !unit || !sellPrice) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success(`Product "${name}" added (demo)`);
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>Add Product</SheetTitle></SheetHeader>
        <form className="mt-4 space-y-6" onSubmit={submit}>
          {/* Basic Info */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Info</h4>
            <div className="space-y-1.5">
              <Label>Product Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Panadol Extra 500mg tabs x24" required />
              {suggestion && suggestion.name.toLowerCase() !== name.trim().toLowerCase() && (
                <button type="button" onClick={() => setName(suggestion.name)}
                  className="w-full text-left mt-1 px-3 py-2 rounded-md border border-warning/40 bg-warning/5 text-xs flex items-start gap-2 hover:bg-warning/10 transition">
                  <Lightbulb className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                  <span>Did you mean: <span className="font-semibold">{suggestion.name}</span>? Click to load instead.</span>
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Generic / Scientific Name</Label>
              <Input value={generic} onChange={(e) => setGeneric(e.target.value)} placeholder="e.g. Paracetamol" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit of Measure *</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger><SelectValue placeholder="Select UoM" /></SelectTrigger>
                  <SelectContent>
                    {UOM_OPTIONS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Barcode</Label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="601001234" />
              <p className="text-xs text-muted-foreground">Optional — leave blank if no scanner</p>
            </div>
          </section>

          {/* Pricing & Tax */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pricing & Tax</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Selling Price (TZS) *</Label>
                <Input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="0" required />
              </div>
              <div className="space-y-1.5">
                <Label>Reference Buying Price (TZS)</Label>
                <Input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="0" />
                <p className="text-xs text-muted-foreground">Reference only. Actual cost is recorded on each GRN.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tax Code *</Label>
              <Select value={taxCode} onValueChange={setTaxCode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TAX_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Supplier & Classification */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier & Classification</h4>
            <div className="space-y-1.5">
              <Label>Primary Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Actual stock entries happen via Purchase Orders / GRN.</p>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="cursor-pointer">Rx Required</Label>
                <p className="text-xs text-muted-foreground">Requires prescription to dispense</p>
              </div>
              <Switch checked={rxRequired} onCheckedChange={setRxRequired} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="cursor-pointer">Controlled Substance</Label>
                <p className="text-xs text-muted-foreground">Track via separate controlled register</p>
              </div>
              <Switch checked={controlled} onCheckedChange={setControlled} />
            </div>
            <div className="space-y-1.5">
              <Label>Reorder Point</Label>
              <Input type="number" value={reorderPoint} onChange={(e) => setReorderPoint(e.target.value)} placeholder="10" />
            </div>
          </section>

          {/* Description */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h4>
            <div className="space-y-1.5">
              <Label>Notes / Description</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Storage instructions, indications, etc." />
            </div>
          </section>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add Product</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
