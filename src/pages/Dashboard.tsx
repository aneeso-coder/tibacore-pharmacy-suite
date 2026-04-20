import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui-ext/StatCard";
import { Card } from "@/components/ui/card";
import { sales, products } from "@/data/seed";
import { fmtTZS, fmtNum, fmtDate } from "@/lib/format";
import { useApp } from "@/context/AppContext";
import { Banknote, TrendingUp, Package, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TraBadge } from "@/components/ui-ext/Badges";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { branch } = useApp();
  const nav = useNavigate();
  const branchSales = useMemo(() => sales.filter((s) => s.branchId === branch.id), [branch.id]);

  const today = new Date(); today.setHours(0,0,0,0);
  const todayRev = branchSales.filter((s) => new Date(s.date) >= today).reduce((a, s) => a + s.total, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthRev = branchSales.filter((s) => new Date(s.date) >= monthStart).reduce((a, s) => a + s.total, 0);

  const stockKey = branch.id === "br_main" ? "stockMain" : "stockUpanga";
  const lowStock = products.filter((p) => (p as any)[stockKey] <= p.reorderPoint);

  // 30-day series
  const series = useMemo(() => {
    const days: { date: string; revenue: number; label: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const total = branchSales.filter((s) => {
        const sd = new Date(s.date);
        return sd >= d && sd < next;
      }).reduce((a, s) => a + s.total, 0);
      days.push({ date: d.toISOString(), label: `${d.getDate()}/${d.getMonth()+1}`, revenue: Math.round(total) });
    }
    return days;
  }, [branchSales]);

  // Top 5 products this month
  const top5 = useMemo(() => {
    const tally: Record<string, number> = {};
    branchSales.filter((s) => new Date(s.date) >= monthStart).forEach((s) => {
      s.lines.forEach((l) => { tally[l.productId] = (tally[l.productId] || 0) + l.qty; });
    });
    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([pid, qty]) => ({ name: products.find((p) => p.id === pid)?.name.split(" ").slice(0,3).join(" ") ?? pid, qty }));
  }, [branchSales]);

  const recent = [...branchSales].sort((a,b) => +new Date(b.date) - +new Date(a.date)).slice(0, 10);

  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Revenue" value={fmtTZS(todayRev)} icon={<Banknote className="h-4 w-4" />} hint={`${branch.name}`} />
        <StatCard label="This Month" value={fmtTZS(monthRev)} icon={<TrendingUp className="h-4 w-4" />} tone="success" />
        <StatCard label="Active Products" value={fmtNum(products.length)} icon={<Package className="h-4 w-4" />} />
        <StatCard label="Low Stock Alerts" value={lowStock.length} icon={<AlertTriangle className="h-4 w-4" />} tone={lowStock.length ? "warning" : "default"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-medium">Revenue — Last 30 Days</div>
              <div className="text-xs text-muted-foreground">Daily total in TZS</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  formatter={(v: any) => fmtTZS(Number(v))}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-medium mb-1">Top 5 Products</div>
          <div className="text-xs text-muted-foreground mb-3">By units sold this month</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-medium">Recent Sales</div>
            <Button size="sm" variant="ghost" onClick={() => nav("/sales")}>View all</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>TRA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((s) => (
                <TableRow key={s.id} className="cursor-pointer">
                  <TableCell className="font-medium num">{s.receiptNo}</TableCell>
                  <TableCell className="truncate max-w-[140px]">{s.customerName}</TableCell>
                  <TableCell className="text-right num">{s.lines.length}</TableCell>
                  <TableCell className="text-right num">{fmtTZS(s.total)}</TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{s.payment}</span></TableCell>
                  <TableCell><TraBadge status={s.traStatus} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="font-medium">Low Stock</div>
              <div className="text-xs text-muted-foreground">{branch.name}</div>
            </div>
          </div>
          <div className="divide-y max-h-[420px] overflow-y-auto">
            {lowStock.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">All products above reorder point.</div>
            ) : lowStock.map((p) => {
              const qty = (p as any)[stockKey];
              return (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground num">{qty} on hand • reorder at {p.reorderPoint}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => nav("/purchase-orders")}>Reorder</Button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
