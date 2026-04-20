import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { customers, sales } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { fmtTZS, fmtDate } from "@/lib/format";

export default function Customers() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
  const sel = customers.find((c) => c.id === selected);
  const history = sel ? sales.filter((s) => s.customerId === sel.id).slice(0, 20) : [];

  return (
    <AppLayout title="Customers">
      <PageHeader title="Customers" description={`${customers.length} registered`} />
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="num font-medium">{s.receiptNo}</TableCell>
                        <TableCell className="num text-xs">{fmtDate(s.date)}</TableCell>
                        <TableCell className="text-right num">{s.lines.length}</TableCell>
                        <TableCell className="text-right num">{fmtTZS(s.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
