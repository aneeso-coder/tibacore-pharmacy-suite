import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { customers, sales, invoices } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtTZS, fmtDate } from "@/lib/format";
import { Plus, Printer } from "lucide-react";
import { toast } from "sonner";

export default function Customers() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const filtered = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
  const sel = customers.find((c) => c.id === selected);
  const history = sel ? sales.filter((s) => s.customerId === sel.id).slice(0, 20) : [];
  const customerInvoices = sel ? invoices.filter((i) => i.customerId === sel.id) : [];
  const outstanding = customerInvoices.reduce((a, i) => a + (i.amount - i.paid), 0);

  return (
    <AppLayout title="Customers">
      <PageHeader title="Customers" description={`${customers.length} registered`}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Add Customer</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 p-3">
          <Input placeholder="Search customers..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" />
          <div className="divide-y">
            {filtered.map((c) => (
              <button key={c.id} onClick={() => setSelected(c.id)}
                className={`w-full text-left px-2 py-2.5 rounded hover:bg-muted ${selected === c.id ? "bg-muted" : ""}`}>
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground num">{c.phone}</div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-2 p-5">
          {!sel ? (
            <div className="text-sm text-muted-foreground text-center py-12">Select a customer to view history</div>
          ) : (
            <>
              <h3 className="font-semibold">{sel.name}</h3>
              <div className="text-sm text-muted-foreground num">{sel.phone}</div>
              <div className="text-sm mt-1">
                <span className="text-muted-foreground">Outstanding Balance: </span>
                <span className={`num font-medium ${outstanding > 0 ? "text-destructive" : ""}`}>{fmtTZS(outstanding)}</span>
                {customerInvoices.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">({customerInvoices.length} invoice{customerInvoices.length>1?"s":""})</span>
                )}
              </div>
              <div className="mt-5 text-sm font-medium mb-2">Recent Purchases</div>
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">No purchases yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="num font-medium">{s.receiptNo}</TableCell>
                        <TableCell className="num text-xs">{fmtDate(s.date)}</TableCell>
                        <TableCell className="text-right num">{s.lines.length}</TableCell>
                        <TableCell className="text-right num">{fmtTZS(s.total)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => toast.success("Receipt reprinted (demo)")}>
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </Card>
      </div>

      <Sheet open={addOpen} onOpenChange={(o) => !o && setAddOpen(false)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Add Customer</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-5">
            <div><Label>Full Name *</Label><Input className="mt-1.5" /></div>
            <div><Label>Phone *</Label><Input className="mt-1.5" placeholder="+255..." /></div>
            <div><Label>Email</Label><Input className="mt-1.5" type="email" /></div>
            <div>
              <Label>ID Type</Label>
              <Select defaultValue="none">
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="tin">TIN</SelectItem>
                  <SelectItem value="dl">Driving Licence</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="nid">National ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>ID Number</Label><Input className="mt-1.5" /></div>
            <div><Label>Date of Birth</Label><Input className="mt-1.5" type="date" /></div>
            <div><Label>Allergies / Notes</Label><Textarea className="mt-1.5" rows={3} /></div>
          </div>
          <SheetFooter className="mt-5">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success("Customer added (demo)"); setAddOpen(false); }}>Add Customer</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
