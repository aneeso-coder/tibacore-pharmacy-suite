import { useMemo, useState, ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { Card } from "@/components/ui/card";
import { sales, products, batches, suppliers, purchaseOrders } from "@/data/seed";
import { fmtTZS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useApp } from "@/context/AppContext";
import { TraBadge } from "@/components/ui-ext/Badges";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const tabs = [
  { key: "sales", label: "Monthly Sales" },
  { key: "top", label: "Top Selling" },
  { key: "margin", label: "Best Margin" },
  { key: "slow", label: "Slow Moving" },
  { key: "valuation", label: "Stock Valuation" },
  { key: "expiry", label: "Expiry Report" },
  { key: "spend", label: "Supplier Spend" },
  { key: "tra", label: "TRA Summary" },
];

export default function Reports() {
  const { kind = "sales" } = useParams();
  const nav = useNavigate();

  return (
    <AppLayout title="Reports">
      <PageHeader title="Reports" description="Operational, financial and compliance reports" />
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        <Card className="p-2 h-fit">
          <nav className="flex flex-col gap-0.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => nav(`/reports/${t.key}`)}
                className={cn(
                  "text-left text-sm px-3 py-2 rounded-md hover:bg-muted transition",
                  kind === t.key && "bg-accent text-accent-foreground font-medium"
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </Card>
        <div>
          <Card className="p-3 mb-4 flex flex-wrap items-center gap-2">
            <Input type="date" className="w-44" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" className="w-44" />
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.success("Excel exported (demo)")}>
                <Download className="h-4 w-4 mr-1.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.success("PDF exported (demo)")}>
                <FileText className="h-4 w-4 mr-1.5" /> PDF
              </Button>
            </div>
          </Card>
          <ReportBody kind={kind} />
        </div>
      </div>
    </AppLayout>
  );
}

function ReportBody({ kind }: { kind: string }) {
  const { showBuyPrices, branch } = useApp();
  const branchSales = sales.filter((s) => s.branchId === branch.id);

  if (kind === "sales") {
    const today = new Date(); today.setHours(0,0,0,0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const days: any[] = [];
    for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const day = new Date(d);
      const list = branchSales.filter((s) => { const sd = new Date(s.date); return sd >= day && sd < next; });
      const rev = list.reduce((a,s) => a + s.total, 0);
      days.push({ label: `${day.getDate()}`, revenue: Math.round(rev), tx: list.length });
    }
    const total = days.reduce((a,d) => a + d.revenue, 0);
    const tx = days.reduce((a,d) => a + d.tx, 0);
    return (
      <Card className="p-5">
        <div className="grid grid-cols-3 gap-4 mb-5">
          <Stat label="Total Revenue" value={fmtTZS(total)} />
          <Stat label="Transactions" value={tx.toLocaleString()} />
          <Stat label="Avg. Sale" value={fmtTZS(tx ? total / tx : 0)} />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => fmtTZS(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  }

  if (kind === "top") {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const tally: Record<string, { qty: number; rev: number; cost: number }> = {};
    branchSales.filter((s) => new Date(s.date) >= monthStart).forEach((s) => {
      s.lines.forEach((l) => {
        const p = products.find((x) => x.id === l.productId)!;
        tally[l.productId] = tally[l.productId] || { qty: 0, rev: 0, cost: 0 };
        tally[l.productId].qty += l.qty;
        tally[l.productId].rev += l.lineTotal;
        tally[l.productId].cost += l.qty * p.buyPrice;
      });
    });
    const rows = Object.entries(tally).map(([id, v]) => ({ id, ...v, p: products.find((x) => x.id === id)! }))
      .sort((a,b) => b.qty - a.qty).slice(0, 20);
    return <SimpleTable headers={["Product","Units","Revenue", showBuyPrices ? "Margin %" : ""].filter(Boolean)}
      rows={rows.map((r) => [
        r.p.name, r.qty, fmtTZS(r.rev),
        ...(showBuyPrices ? [`${(((r.rev - r.cost)/r.rev)*100).toFixed(1)}%`] : [])
      ])} />;
  }

  if (kind === "margin") {
    const rows = products.map((p) => ({
      name: p.name, sell: p.sellPrice, buy: p.buyPrice, margin: ((p.sellPrice - p.buyPrice)/p.sellPrice)*100,
    })).sort((a,b) => b.margin - a.margin);
    return <SimpleTable headers={["Product", "Sell", showBuyPrices ? "Buy" : "", "Margin %"].filter(Boolean)}
      rows={rows.map((r) => [r.name, fmtTZS(r.sell), ...(showBuyPrices ? [fmtTZS(r.buy)] : []), `${r.margin.toFixed(1)}%`])} />;
  }

  if (kind === "slow") {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const sold = new Set<string>();
    branchSales.filter((s) => new Date(s.date) >= cutoff).forEach((s) => s.lines.forEach((l) => sold.add(l.productId)));
    const rows = products.filter((p) => !sold.has(p.id)).map((p) => ({
      p, value: (p.stockMain + p.stockUpanga) * p.buyPrice,
    }));
    return <SimpleTable headers={["Product", "Stock", showBuyPrices ? "Value Tied Up" : "Stock Units"].filter(Boolean)}
      rows={rows.map((r) => [r.p.name, r.p.stockMain + r.p.stockUpanga, showBuyPrices ? fmtTZS(r.value) : `${r.p.stockMain + r.p.stockUpanga}`])} />;
  }

  if (kind === "valuation") {
    const total = products.reduce((a,p) => a + (p.stockMain + p.stockUpanga) * p.buyPrice, 0);
    return (
      <>
        <Card className="p-5 mb-4"><Stat label="Total Inventory Value" value={fmtTZS(total)} /></Card>
        <SimpleTable headers={["Product","Qty", showBuyPrices ? "Buy Price" : "", showBuyPrices ? "Value" : ""].filter(Boolean)}
          rows={products.map((p) => [p.name, p.stockMain + p.stockUpanga,
            ...(showBuyPrices ? [fmtTZS(p.buyPrice), fmtTZS((p.stockMain + p.stockUpanga) * p.buyPrice)] : [])])} />
      </>
    );
  }

  if (kind === "expiry") {
    const data = batches.map((b) => ({ ...b, days: Math.floor((+new Date(b.expiryDate) - Date.now())/86400000) }))
      .filter((b) => b.days <= 90).sort((a,b) => a.days - b.days);
    return <SimpleTable headers={["Product","Batch","Days","Qty Remaining", showBuyPrices ? "Value at Risk" : ""].filter(Boolean)}
      rows={data.map((b) => {
        const p = products.find((x) => x.id === b.productId)!;
        return [p.name, b.batchNo, `${b.days}d`, b.qtyRemaining, ...(showBuyPrices ? [fmtTZS(b.qtyRemaining * b.buyPrice)] : [])];
      })} />;
  }

  if (kind === "spend") {
    const rows = suppliers.map((s) => {
      const list = purchaseOrders.filter((p) => p.supplierId === s.id);
      const total = list.reduce((a,p) => a + p.total, 0);
      return { s, count: list.length, total };
    }).sort((a,b) => b.total - a.total);
    return (
      <>
        <Card className="p-5 mb-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.map((r) => ({ name: r.s.name.split(" ")[0], total: r.total }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmtTZS(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <SimpleTable headers={["Supplier","POs","Total Spend"]} rows={rows.map((r) => [r.s.name, r.count, fmtTZS(r.total)])} />
      </>
    );
  }

  if (kind === "tra") {
    const today = new Date(); today.setHours(0,0,0,0);
    const days: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const list = branchSales.filter((s) => { const sd = new Date(s.date); return sd >= d && sd < next; });
      const total = list.reduce((a,s) => a + s.total, 0);
      const failed = list.some((s) => s.traStatus === "FAILED");
      const pending = list.some((s) => s.traStatus === "PENDING");
      const status = failed ? "FAILED" : pending ? "PENDING" : "SUBMITTED";
      days.push({ d, total, count: list.length, status,
        a: list.reduce((a,s) => a + s.vatA, 0), c: 0, e: 0 });
    }
    return (
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Tx</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">VAT A 18%</TableHead>
              <TableHead className="text-right">VAT C 0%</TableHead>
              <TableHead className="text-right">VAT E Exempt</TableHead>
              <TableHead>Z Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((d, i) => (
              <TableRow key={i}>
                <TableCell className="num text-xs">{d.d.toLocaleDateString()}</TableCell>
                <TableCell className="text-right num">{d.count}</TableCell>
                <TableCell className="text-right num">{fmtTZS(d.total)}</TableCell>
                <TableCell className="text-right num">{fmtTZS(d.a)}</TableCell>
                <TableCell className="text-right num">{fmtTZS(0)}</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell><TraBadge status={d.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }

  return null;
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="text-xl font-semibold num mt-1">{value}</div>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>{headers.map((h, i) => <TableHead key={i} className={i > 0 ? "text-right" : ""}>{h}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((c, j) => (
                <TableCell key={j} className={cn(j > 0 && "text-right num", j === 0 && "font-medium")}>{c}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
