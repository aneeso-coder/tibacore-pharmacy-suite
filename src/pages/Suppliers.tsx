import { useMemo, useState, Fragment } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { suppliers as seed, purchaseOrders, products } from "@/data/seed";
import type { Supplier } from "@/data/types";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui-ext/Badges";
import { fmtTZS, fmtDate } from "@/lib/format";
import { Plus, Search, ChevronDown, ChevronRight, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const termsLabel: Record<Supplier["paymentTerms"], string> = {
  COD: "Cash on Delivery", "30_days": "30 Days Credit", "60_days": "60 Days Credit", on_order: "On Order",
};
const termsClass: Record<Supplier["paymentTerms"], string> = {
  COD: "bg-muted text-muted-foreground border-border",
  "30_days": "bg-info/15 text-info border-info/30",
  "60_days": "bg-warning/15 text-warning border-warning/30",
  on_order: "bg-muted text-muted-foreground border-border",
};
const poTone = { DRAFT: "default", SENT: "info", PARTIAL: "warning", RECEIVED: "success", CANCELLED: "danger" } as const;

export default function Suppliers() {
  const [list, setList] = useState<Supplier[]>(seed);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const filtered = useMemo(() => list.filter((s) => {
    if (statusFilter === "ACTIVE" && s.active === false) return false;
    if (statusFilter === "INACTIVE" && s.active !== false) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.contact.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [list, search, statusFilter]);

  const onSave = (s: Supplier, isNew: boolean) => {
    if (isNew) {
      setList((prev) => [...prev, { ...s, id: `s_${Date.now()}` }]);
      toast.success("Supplier added (demo)");
    } else {
      setList((prev) => prev.map((x) => x.id === s.id ? s : x));
      toast.success("Supplier updated (demo)");
    }
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <AppLayout title="Suppliers">
      <PageHeader title="Suppliers" description={`${list.length} suppliers`} actions={
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4 mr-1.5" /> Add Supplier</Button>
      } />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or contact..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => {
              const isOpen = expanded === s.id;
              const sPos = purchaseOrders.filter((p) => p.supplierId === s.id);
              const totalSpend = sPos.reduce((a, p) => a + p.total, 0);
              const sProducts = products.filter((p) => s.productIds.includes(p.id));
              return (
                <Fragment key={s.id}>
                  <TableRow>
                    <TableCell>
                      <button onClick={() => setExpanded(isOpen ? null : s.id)} className="text-muted-foreground hover:text-foreground">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-sm">{s.contact}</TableCell>
                    <TableCell className="num text-xs">{s.phone}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("font-medium", termsClass[s.paymentTerms])}>{termsLabel[s.paymentTerms]}</Badge></TableCell>
                    <TableCell className="text-right num">{fmtTZS(s.creditLimit)}</TableCell>
                    <TableCell className={cn("text-right num font-medium", s.outstandingBalance > 0 && "text-destructive")}>{fmtTZS(s.outstandingBalance)}</TableCell>
                    <TableCell className="text-right num">{s.productIds.length}</TableCell>
                    <TableCell><StatusBadge status={s.active === false ? "Inactive" : "Active"} tone={s.active === false ? "default" : "success"} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : s.id)}>View</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(s); setFormOpen(true); }}>Edit</Button>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={10} className="p-4">
                        <Tabs defaultValue="info">
                          <TabsList>
                            <TabsTrigger value="info">Info</TabsTrigger>
                            <TabsTrigger value="products">Products & Prices</TabsTrigger>
                            <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
                          </TabsList>
                          <TabsContent value="info" className="mt-3 grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="text-xs font-semibold uppercase text-muted-foreground">Contact</div>
                              <InfoRow label="Name" value={s.name} />
                              <InfoRow label="Contact Person" value={s.contact} />
                              <InfoRow label="Phone" value={s.phone} />
                              <InfoRow label="Email" value={s.email} />
                              <InfoRow label="TIN" value={s.tin || "—"} />
                              <InfoRow label="Address" value={s.address || "—"} />
                            </div>
                            <div className="space-y-2">
                              <div className="text-xs font-semibold uppercase text-muted-foreground">Financial</div>
                              <InfoRow label="Payment Terms" value={termsLabel[s.paymentTerms]} />
                              <InfoRow label="Credit Limit" value={fmtTZS(s.creditLimit)} />
                              <InfoRow label="Outstanding Balance" value={fmtTZS(s.outstandingBalance)} highlight={s.outstandingBalance > 0} />
                              <InfoRow label="Total POs Placed" value={String(sPos.length)} />
                              <InfoRow label="Total Spend" value={fmtTZS(totalSpend)} />
                            </div>
                          </TabsContent>
                          <TabsContent value="products" className="mt-3">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Product</TableHead>
                                  <TableHead>UoM</TableHead>
                                  <TableHead className="text-right">Buying Price</TableHead>
                                  <TableHead>Preferred</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sProducts.map((p, idx) => (
                                  <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{p.unit}</TableCell>
                                    <TableCell className="text-right num">{fmtTZS(p.buyPrice)}</TableCell>
                                    <TableCell><Star className={cn("h-4 w-4", idx === 0 ? "fill-warning text-warning" : "text-muted-foreground")} /></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TabsContent>
                          <TabsContent value="pos" className="mt-3">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>PO No.</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Expected</TableHead>
                                  <TableHead className="text-right">Items</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sPos.map((po) => (
                                  <TableRow key={po.id}>
                                    <TableCell className="font-medium num">{po.poNo}</TableCell>
                                    <TableCell className="num text-xs">{fmtDate(po.date)}</TableCell>
                                    <TableCell className="num text-xs">{fmtDate(po.expectedDate)}</TableCell>
                                    <TableCell className="text-right num">{po.lines.length}</TableCell>
                                    <TableCell className="text-right num">{fmtTZS(po.total)}</TableCell>
                                    <TableCell><StatusBadge status={po.status} tone={poTone[po.status]} /></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TabsContent>
                        </Tabs>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <SupplierForm open={formOpen} onOpenChange={setFormOpen} editing={editing} onSave={onSave} />
    </AppLayout>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium num", highlight && "text-destructive")}>{value}</span>
    </div>
  );
}

function SupplierForm({ open, onOpenChange, editing, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; editing: Supplier | null;
  onSave: (s: Supplier, isNew: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tin, setTin] = useState("");
  const [address, setAddress] = useState("");
  const [terms, setTerms] = useState<Supplier["paymentTerms"]>("COD");
  const [creditLimit, setCreditLimit] = useState("0");
  const [notes, setNotes] = useState("");

  // Sync when editing changes
  useMemo(() => {
    if (editing) {
      setName(editing.name); setContact(editing.contact); setPhone(editing.phone); setEmail(editing.email);
      setTin(editing.tin || ""); setAddress(editing.address || ""); setTerms(editing.paymentTerms);
      setCreditLimit(String(editing.creditLimit));
    } else {
      setName(""); setContact(""); setPhone(""); setEmail(""); setTin(""); setAddress("");
      setTerms("COD"); setCreditLimit("0"); setNotes("");
    }
  }, [editing, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact || !phone || !email) return toast.error("Please fill all required fields");
    const supplier: Supplier = {
      id: editing?.id || "",
      name, contact, phone, email,
      tin: tin || undefined,
      address: address || undefined,
      paymentTerms: terms,
      creditLimit: terms === "COD" ? 0 : Number(creditLimit) || 0,
      outstandingBalance: editing?.outstandingBalance || 0,
      productIds: editing?.productIds || [],
      active: editing?.active !== false,
    };
    onSave(supplier, !editing);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>{editing ? "Edit Supplier" : "Add Supplier"}</SheetTitle></SheetHeader>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Contact Person *</Label><Input value={contact} onChange={(e) => setContact(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5"><Label>Phone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5"><Label>TIN</Label><Input value={tin} onChange={(e) => setTin(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Payment Terms *</Label>
            <Select value={terms} onValueChange={(v) => setTerms(v as Supplier["paymentTerms"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="COD">Cash on Delivery</SelectItem>
                <SelectItem value="30_days">30 Days Credit</SelectItem>
                <SelectItem value="60_days">60 Days Credit</SelectItem>
                <SelectItem value="on_order">On Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Credit Limit (TZS)</Label>
            <Input type="number" value={terms === "COD" ? "0" : creditLimit} onChange={(e) => setCreditLimit(e.target.value)} disabled={terms === "COD"} />
          </div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editing ? "Save Changes" : "Add Supplier"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
