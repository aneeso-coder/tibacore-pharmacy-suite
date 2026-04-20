import { useMemo, useState, ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { Card } from "@/components/ui/card";
import { sales, products, batches, suppliers, purchaseOrders, invoices, customers, prescriptions, insuranceProviders, insurancePrices, expenses } from "@/data/seed";
import { fmtTZS, fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Download, FileText, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { useApp } from "@/context/AppContext";
import { TraBadge, StatusBadge } from "@/components/ui-ext/Badges";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Tab = { key: string; label: string; perm?: "see_prices" | "tra_settings" };
type Section = { label: string; tabs: Tab[] };

const SECTIONS: Section[] = [
  { label: "Sales", tabs: [
    { key: "sales", label: "Sales Overview" },
    { key: "daily", label: "Sales by Day" },
    { key: "weekly", label: "Sales by Week" },
    { key: "top", label: "Top Products" },
  ]},
  { label: "Inventory", tabs: [
    { key: "slow", label: "Slow Movers" },
    { key: "stock-item", label: "Stock per Item" },
    { key: "expiry", label: "Expiry Report" },
  ]},
  { label: "Financial", tabs: [
    { key: "margin", label: "Margin Analysis", perm: "see_prices" },
    { key: "valuation", label: "Stock Valuation", perm: "see_prices" },
    { key: "stock-total", label: "Total Stock Value", perm: "see_prices" },
    { key: "spend", label: "Supplier Spend", perm: "see_prices" },
    { key: "pl", label: "P&L Report", perm: "see_prices" },
    { key: "financial-summary", label: "Financial Summary", perm: "see_prices" },
  ]},
  { label: "Insurance", tabs: [
    { key: "insurance-claims", label: "Insurance Claims", perm: "see_prices" },
  ]},
  { label: "Compliance", tabs: [
    { key: "tra", label: "TRA Summary", perm: "tra_settings" },
    { key: "debtors", label: "Debtor Aging", perm: "tra_settings" },
  ]},
  { label: "Custom", tabs: [
    { key: "custom", label: "Custom Builder" },
  ]},
];

const PERIOD_LABELS: Record<string, string> = {
  today: "Today", yesterday: "Yesterday", this_week: "This Week", last_week: "Last Week",
  this_month: "This Month", last_month: "Last Month", this_quarter: "This Quarter",
  this_year: "This Year", last_year: "Last Year", mtm: "MTM", yty: "YTY", custom: "Custom Range",
};

type PeriodKey =
  | "today" | "yesterday" | "this_week" | "last_week"
  | "this_month" | "last_month" | "this_quarter"
  | "this_year" | "last_year" | "mtm" | "yty" | "custom";

function computeRange(period: PeriodKey): { from: Date; to: Date } {
  const now = new Date();
  const start = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const end = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
  switch (period) {
    case "today": return { from: start(now), to: end(now) };
    case "yesterday": { const y = new Date(now); y.setDate(y.getDate()-1); return { from: start(y), to: end(y) }; }
    case "this_week": {
      const d = new Date(now); const dow = (d.getDay()+6)%7; d.setDate(d.getDate()-dow);
      const e = new Date(d); e.setDate(d.getDate()+6);
      return { from: start(d), to: end(e) };
    }
    case "last_week": {
      const d = new Date(now); const dow = (d.getDay()+6)%7; d.setDate(d.getDate()-dow-7);
      const e = new Date(d); e.setDate(d.getDate()+6);
      return { from: start(d), to: end(e) };
    }
    case "this_month": {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      const t = new Date(now.getFullYear(), now.getMonth()+1, 0);
      return { from: start(f), to: end(t) };
    }
    case "last_month": {
      const f = new Date(now.getFullYear(), now.getMonth()-1, 1);
      const t = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: start(f), to: end(t) };
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth()/3);
      const f = new Date(now.getFullYear(), q*3, 1);
      const t = new Date(now.getFullYear(), q*3+3, 0);
      return { from: start(f), to: end(t) };
    }
    case "this_year": return { from: start(new Date(now.getFullYear(),0,1)), to: end(new Date(now.getFullYear(),11,31)) };
    case "last_year": return { from: start(new Date(now.getFullYear()-1,0,1)), to: end(new Date(now.getFullYear()-1,11,31)) };
    case "mtm": {
      const f = new Date(now.getFullYear(), now.getMonth()-1, 1);
      const t = new Date(now.getFullYear(), now.getMonth()+1, 0);
      return { from: start(f), to: end(t) };
    }
    case "yty": return { from: start(new Date(now.getFullYear()-1,0,1)), to: end(new Date(now.getFullYear(),11,31)) };
    default: return { from: start(now), to: end(now) };
  }
}

export default function Reports() {
  const { kind = "sales" } = useParams();
  const nav = useNavigate();
  const { can, showBuyPrices } = useApp();
  const [period, setPeriod] = useState<PeriodKey>("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const range = useMemo(() => {
    if (period === "custom" && dateFrom && dateTo) {
      const f = new Date(dateFrom); f.setHours(0,0,0,0);
      const t = new Date(dateTo); t.setHours(23,59,59,999);
      return { from: f, to: t };
    }
    return computeRange(period);
  }, [period, dateFrom, dateTo]);

  // Role-aware section/tab filtering — hide entirely, never disable
  const visibleSections = useMemo(() => {
    return SECTIONS.map((sec) => ({
      ...sec,
      tabs: sec.tabs.filter((t) => {
        if (t.perm === "see_prices" && !showBuyPrices) return false;
        if (t.perm === "tra_settings" && !can("tra_settings")) return false;
        return true;
      }),
    })).filter((sec) => sec.tabs.length > 0);
  }, [can, showBuyPrices]);

  // Find active tab label for the period-aware page title
  const activeTab = useMemo(() => {
    for (const sec of visibleSections) {
      const t = sec.tabs.find((x) => x.key === kind);
      if (t) return t;
    }
    return visibleSections[0]?.tabs[0];
  }, [visibleSections, kind]);

  const periodSuffix = PERIOD_LABELS[period] ?? "";
  const titleWithPeriod = activeTab ? `${activeTab.label} — ${periodSuffix}` : "Reports";

  return (
    <AppLayout title="Reports">
      <PageHeader title={titleWithPeriod} description={`${fmtDate(range.from)} — ${fmtDate(range.to)}`} />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <Card className="p-2 h-fit max-h-[calc(100vh-180px)] overflow-y-auto">
          <nav className="flex flex-col gap-2">
            {visibleSections.map((sec) => (
              <div key={sec.label}>
                <div className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {sec.label}
                </div>
                <div className="flex flex-col gap-0.5">
                  {sec.tabs.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => nav(`/reports/${t.key}`)}
                      className={cn(
                        "text-left text-sm px-3 py-1.5 rounded-md hover:bg-muted transition",
                        kind === t.key && "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </Card>
        <div>
          <Card className="p-3 mb-4 sticky top-14 z-20 bg-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period:</span>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this_week">This Week (Mon–Sun)</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              {period === "custom" ? (
                <>
                  <Input type="date" className="w-44" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="date" className="w-44" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </>
              ) : (
                <span className="text-xs text-muted-foreground num">{fmtDate(range.from)} — {fmtDate(range.to)}</span>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.success("Excel exported (demo)")}>
                  <Download className="h-4 w-4 mr-1.5" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.success("PDF exported (demo)")}>
                  <FileText className="h-4 w-4 mr-1.5" /> PDF
                </Button>
              </div>
            </div>
          </Card>
          <ReportBody kind={kind} range={range} />
        </div>
      </div>
    </AppLayout>
  );
}

function ReportBody({ kind, range }: { kind: string; range: { from: Date; to: Date } }) {
  const { showBuyPrices, branch, user } = useApp();
  const inRange = (iso: string) => { const d = new Date(iso); return d >= range.from && d <= range.to; };
  const branchSales = useMemo(
    () => sales.filter((s) => s.branchId === branch.id && inRange(s.date)),
    [branch.id, range]
  );

  if (kind === "sales") {
    const buckets: Record<string, { revenue: number; tx: number; vat: number; disc: number }> = {};
    branchSales.forEach((s) => {
      const k = new Date(s.date).toISOString().slice(0,10);
      buckets[k] = buckets[k] || { revenue: 0, tx: 0, vat: 0, disc: 0 };
      buckets[k].revenue += s.total;
      buckets[k].tx += 1;
      buckets[k].vat += s.vatA;
      buckets[k].disc += s.discountTotal;
    });
    const days = Object.entries(buckets).sort(([a],[b]) => a.localeCompare(b))
      .map(([k, v]) => ({ label: new Date(k).getDate().toString(), date: k, ...v }));
    const total = days.reduce((a,d) => a + d.revenue, 0);
    const tx = days.reduce((a,d) => a + d.tx, 0);
    const vat = days.reduce((a,d) => a + d.vat, 0);
    return (
      <>
        <Card className="p-5 mb-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <Stat label="Total Revenue" value={fmtTZS(total)} />
            <Stat label="Transactions" value={tx.toLocaleString()} />
            <Stat label="Avg. Sale" value={fmtTZS(tx ? total / tx : 0)} />
            <Stat label="VAT (18%)" value={fmtTZS(vat)} />
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
        <SimpleTable
          headers={["Date","Transactions","Revenue","VAT","Discounts"]}
          rows={days.map((d) => [fmtDate(d.date), d.tx, fmtTZS(d.revenue), fmtTZS(d.vat), fmtTZS(d.disc)])}
        />
      </>
    );
  }

  if (kind === "daily") return <DailySalesReport />;
  if (kind === "weekly") return <WeeklySalesReport />;

  if (kind === "top") {
    const tally: Record<string, { qty: number; rev: number; cost: number }> = {};
    branchSales.forEach((s) => {
      s.lines.forEach((l) => {
        const p = products.find((x) => x.id === l.productId)!;
        tally[l.productId] = tally[l.productId] || { qty: 0, rev: 0, cost: 0 };
        tally[l.productId].qty += l.qty;
        tally[l.productId].rev += l.lineTotal;
        tally[l.productId].cost += l.qty * p.buyPrice;
      });
    });
    const rows = Object.entries(tally).map(([id, v]) => ({ id, ...v, p: products.find((x) => x.id === id)! }))
      .sort((a,b) => b.qty - a.qty).slice(0, 30);
    const headers = ["Rank","Item","UoM","Qty","Revenue", ...(showBuyPrices ? ["Buy Cost","Gross Profit","Margin %"] : [])];
    return <SimpleTable headers={headers}
      rows={rows.map((r, i) => [
        i+1, r.p.name, r.p.unit, r.qty, fmtTZS(r.rev),
        ...(showBuyPrices ? [fmtTZS(r.cost), fmtTZS(r.rev - r.cost), `${(((r.rev - r.cost)/r.rev)*100).toFixed(1)}%`] : [])
      ])} />;
  }

  if (kind === "margin") {
    if (!showBuyPrices) return <Card className="p-8 text-center text-sm text-muted-foreground">You don't have permission to view buying prices.</Card>;
    const rows = products.map((p) => ({
      p, profit: p.sellPrice - p.buyPrice, margin: ((p.sellPrice - p.buyPrice)/p.sellPrice)*100,
    })).sort((a,b) => b.margin - a.margin);
    return <SimpleTable headers={["Item","UoM","Buy Price","Sell Price","Profit/Unit","Margin %"]}
      rows={rows.map((r) => [r.p.name, r.p.unit, fmtTZS(r.p.buyPrice), fmtTZS(r.p.sellPrice), fmtTZS(r.profit), `${r.margin.toFixed(1)}%`])} />;
  }

  if (kind === "slow") {
    const sold: Record<string, string> = {};
    branchSales.forEach((s) => s.lines.forEach((l) => {
      if (!sold[l.productId] || sold[l.productId] < s.date) sold[l.productId] = s.date;
    }));
    const allSoldEver: Record<string, string> = {};
    sales.forEach((s) => s.lines.forEach((l) => {
      if (!allSoldEver[l.productId] || allSoldEver[l.productId] < s.date) allSoldEver[l.productId] = s.date;
    }));
    const rows = products.filter((p) => !sold[p.id]).map((p) => {
      const soh = branch.id === "br_main" ? p.stockMain : p.stockUpanga;
      return { p, soh, value: soh * p.buyPrice, last: allSoldEver[p.id] };
    });
    const totalTied = rows.reduce((a,r) => a + r.value, 0);
    return (
      <>
        <Card className="p-5 mb-4"><Stat label="Capital Tied Up in Slow Stock" value={fmtTZS(totalTied)} /></Card>
        <SimpleTable headers={["Item","UoM","Category","SOH","Stock Value","Last Sale"]}
          rows={rows.map((r) => [r.p.name, r.p.unit, r.p.category, r.soh, fmtTZS(r.value), r.last ? fmtDate(r.last) : "Never"])} />
      </>
    );
  }

  if (kind === "stock-total") {
    if (!showBuyPrices) return <Card className="p-8 text-center text-sm text-muted-foreground">You don't have permission to view buying prices.</Card>;
    return <StockTotalReport />;
  }

  if (kind === "stock-item") return <StockPerItemReport isAdmin={user?.role === "super_admin"} />;

  if (kind === "valuation") {
    const rows = products.map((p) => {
      const soh = p.stockMain + p.stockUpanga;
      return { p, soh, costVal: soh * p.buyPrice, sellVal: soh * p.sellPrice, profit: p.sellPrice - p.buyPrice };
    }).sort((a,b) => b.costVal - a.costVal);
    const totalCost = rows.reduce((a,r) => a + r.costVal, 0);
    const totalSell = rows.reduce((a,r) => a + r.sellVal, 0);
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          <Card className="p-4"><Stat label="Stock Value (Cost)" value={fmtTZS(totalCost)} /></Card>
          <Card className="p-4"><Stat label="Stock Value (Selling)" value={fmtTZS(totalSell)} /></Card>
          <Card className="p-4"><Stat label="Potential Gross Profit" value={fmtTZS(totalSell - totalCost)} /></Card>
        </div>
        <SimpleTable
          headers={["Item","UoM","SOH","Cost","Sell","Profit/Unit","Total Cost","Total Sell"]}
          rows={rows.map((r) => [r.p.name, r.p.unit, r.soh, fmtTZS(r.p.buyPrice), fmtTZS(r.p.sellPrice), fmtTZS(r.profit), fmtTZS(r.costVal), fmtTZS(r.sellVal)])}
        />
      </>
    );
  }

  if (kind === "expiry") return <ExpiryReport />;

  if (kind === "spend") {
    const rows = suppliers.map((s) => {
      const list = purchaseOrders.filter((p) => p.supplierId === s.id && inRange(p.date));
      const total = list.reduce((a,p) => a + p.total, 0);
      const received = list.reduce((a,p) => a + p.lines.reduce((b,l) => b + l.received * l.buyPrice, 0), 0);
      return { s, count: list.length, total, received };
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
        <SimpleTable
          headers={["Supplier","POs","Ordered","Received","Terms","Outstanding"]}
          rows={rows.map((r) => [r.s.name, r.count, fmtTZS(r.total), fmtTZS(r.received), r.s.paymentTerms, fmtTZS(r.s.outstandingBalance)])}
        />
      </>
    );
  }

  if (kind === "debtors") return <DebtorAgingReport />;

  if (kind === "tra") {
    const buckets: Record<string, { count: number; total: number; a: number; c: number; e: number; status: string }> = {};
    branchSales.forEach((s) => {
      const k = new Date(s.date).toISOString().slice(0,10);
      buckets[k] = buckets[k] || { count: 0, total: 0, a: 0, c: 0, e: 0, status: "SUBMITTED" };
      buckets[k].count++;
      buckets[k].total += s.total;
      buckets[k].a += s.vatA;
      buckets[k].c += s.vatC;
      buckets[k].e += s.vatE;
      if (s.traStatus === "FAILED") buckets[k].status = "FAILED";
      else if (s.traStatus === "PENDING" && buckets[k].status !== "FAILED") buckets[k].status = "PENDING";
    });
    const days = Object.entries(buckets).sort(([a],[b]) => b.localeCompare(a));
    return (
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Receipts</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">VAT A 18%</TableHead>
              <TableHead className="text-right">VAT C 0%</TableHead>
              <TableHead className="text-right">VAT E Exempt</TableHead>
              <TableHead>Z Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map(([k, v]) => (
              <TableRow key={k}>
                <TableCell className="num text-xs">{fmtDate(k)}</TableCell>
                <TableCell className="text-right num">{v.count}</TableCell>
                <TableCell className="text-right num">{fmtTZS(v.total)}</TableCell>
                <TableCell className="text-right num">{fmtTZS(v.a)}</TableCell>
                <TableCell className="text-right num">{fmtTZS(v.c)}</TableCell>
                <TableCell className="text-right num">{fmtTZS(v.e)}</TableCell>
                <TableCell><TraBadge status={v.status as any} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }

  if (kind === "custom") return <CustomReportBuilder range={range} />;

  return null;
}

function DailySalesReport() {
  const { branch } = useApp();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(date); dayEnd.setHours(23,59,59,999);
  const list = sales.filter((s) => s.branchId === branch.id && new Date(s.date) >= dayStart && new Date(s.date) <= dayEnd);
  const itemMap: Record<string, { qty: number; total: number; disc: number }> = {};
  list.forEach((s) => s.lines.forEach((l) => {
    itemMap[l.productId] = itemMap[l.productId] || { qty: 0, total: 0, disc: 0 };
    itemMap[l.productId].qty += l.qty;
    itemMap[l.productId].total += l.lineTotal;
    itemMap[l.productId].disc += l.qty * l.unitPrice * (l.discountPct / 100);
  }));
  const rows = Object.entries(itemMap).map(([id, v]) => {
    const p = products.find((x) => x.id === id)!;
    return { p, ...v };
  });
  const byCat: Record<string, typeof rows> = {};
  rows.forEach((r) => { (byCat[r.p.category] = byCat[r.p.category] || []).push(r); });
  const totalSales = list.reduce((a,s) => a + s.total, 0);
  const totalItems = rows.reduce((a,r) => a + r.qty, 0);

  return (
    <>
      <Card className="p-3 mb-4 flex items-center gap-3">
        <Label className="text-sm">Date:</Label>
        <Input type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
      </Card>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-4"><Stat label="Total Sales" value={fmtTZS(totalSales)} /></Card>
        <Card className="p-4"><Stat label="Transactions" value={list.length} /></Card>
        <Card className="p-4"><Stat label="Items Sold" value={totalItems} /></Card>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>UoM</TableHead>
              <TableHead className="text-right">Sell Price</TableHead>
              <TableHead className="text-right">Qty Sold</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(byCat).map(([cat, items]) => {
              const sub = items.reduce((a,r) => a + r.total, 0);
              return (
                <>
                  <TableRow key={cat} className="bg-muted/30">
                    <TableCell colSpan={5} className="text-xs font-semibold uppercase tracking-wider">{cat}</TableCell>
                    <TableCell className="text-right num font-semibold">{fmtTZS(sub)}</TableCell>
                  </TableRow>
                  {items.map((r) => (
                    <TableRow key={r.p.id}>
                      <TableCell className="font-medium">{r.p.name}</TableCell>
                      <TableCell className="text-xs">{r.p.unit}</TableCell>
                      <TableCell className="text-right num">{fmtTZS(r.p.sellPrice)}</TableCell>
                      <TableCell className="text-right num">{r.qty}</TableCell>
                      <TableCell className="text-right num">{fmtTZS(r.disc)}</TableCell>
                      <TableCell className="text-right num">{fmtTZS(r.total)}</TableCell>
                    </TableRow>
                  ))}
                </>
              );
            })}
            <TableRow className="bg-primary/5 border-t-2">
              <TableCell colSpan={5} className="font-semibold">Grand Total</TableCell>
              <TableCell className="text-right num font-bold">{fmtTZS(totalSales)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function WeeklySalesReport() {
  const { branch } = useApp();
  const [offset, setOffset] = useState(0);
  const today = new Date(); const dow = (today.getDay()+6)%7;
  const monday = new Date(today); monday.setDate(today.getDate() - dow + offset*7); monday.setHours(0,0,0,0);
  const sunday = new Date(monday); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);

  const days = Array.from({length:7}).map((_,i) => {
    const d = new Date(monday); d.setDate(monday.getDate()+i);
    const next = new Date(d); next.setDate(d.getDate()+1);
    const list = sales.filter((s) => s.branchId === branch.id && new Date(s.date) >= d && new Date(s.date) < next);
    const tally: Record<string, number> = {};
    list.forEach((s) => s.lines.forEach((l) => { tally[l.productId] = (tally[l.productId]||0) + l.qty; }));
    const top = Object.entries(tally).sort(([,a],[,b]) => b - a)[0];
    const topName = top ? products.find((p) => p.id === top[0])?.name ?? "—" : "—";
    return { day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], date: d, tx: list.length, revenue: list.reduce((a,s) => a + s.total, 0), top: topName };
  });
  const totalRev = days.reduce((a,d) => a + d.revenue, 0);
  const busiest = [...days].sort((a,b) => b.revenue - a.revenue)[0];

  return (
    <>
      <Card className="p-3 mb-4 flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={() => setOffset(o => o-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="text-sm font-medium num">{fmtDate(monday)} — {fmtDate(sunday)}</div>
        <Button size="sm" variant="outline" onClick={() => setOffset(o => o+1)} disabled={offset >= 0}><ChevronRight className="h-4 w-4" /></Button>
      </Card>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4"><Stat label="Week Revenue" value={fmtTZS(totalRev)} /></Card>
        <Card className="p-4"><Stat label="Busiest Day" value={`${busiest.day} (${fmtTZS(busiest.revenue)})`} /></Card>
      </div>
      <Card className="p-5 mb-4">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => fmtTZS(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <SimpleTable headers={["Day","Transactions","Revenue","Top Product"]}
        rows={days.map((d) => [d.day, d.tx, fmtTZS(d.revenue), d.top])} />
    </>
  );
}

function StockTotalReport() {
  const { branch } = useApp();
  const [cat, setCat] = useState("ALL");
  const cats = Array.from(new Set(products.map((p) => p.category)));
  const list = products.filter((p) => cat === "ALL" || p.category === cat);
  const rows = list.map((p) => {
    const soh = branch.id === "br_main" ? p.stockMain : p.stockUpanga;
    return { p, soh, val: soh * p.buyPrice };
  }).sort((a,b) => b.val - a.val);
  const total = rows.reduce((a,r) => a + r.val, 0);
  return (
    <>
      <Card className="p-5 mb-4"><Stat label="Total Inventory Value" value={fmtTZS(total)} /></Card>
      <Card className="p-3 mb-4 flex items-center gap-3">
        <Label className="text-sm">Category:</Label>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>UoM</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">SOH</TableHead>
              <TableHead className="text-right">Buy Price</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.p.id}>
                <TableCell className="font-medium">{r.p.name}</TableCell>
                <TableCell className="text-xs">{r.p.unit}</TableCell>
                <TableCell className="text-xs">{r.p.category}</TableCell>
                <TableCell className="text-right num">{r.soh}</TableCell>
                <TableCell className="text-right num">{fmtTZS(r.p.buyPrice)}</TableCell>
                <TableCell className="text-right num">{fmtTZS(r.val)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-primary/5 border-t-2">
              <TableCell colSpan={5} className="font-semibold">Grand Total</TableCell>
              <TableCell className="text-right num font-bold">{fmtTZS(total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function StockPerItemReport({ isAdmin }: { isAdmin: boolean }) {
  const { branch } = useApp();
  const [cat, setCat] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const cats = Array.from(new Set(products.map((p) => p.category)));
  const filtered = products.filter((p) => {
    if (cat !== "ALL" && p.category !== cat) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    const total = p.stockMain + p.stockUpanga;
    if (status === "OUT" && total > 0) return false;
    if (status === "LOW" && (total === 0 || total > p.reorderPoint)) return false;
    if (status === "IN" && total <= p.reorderPoint) return false;
    return true;
  });
  return (
    <>
      <Card className="p-3 mb-4 flex flex-wrap items-center gap-3">
        <Input placeholder="Search items..." className="w-56" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="IN">In Stock</SelectItem>
            <SelectItem value="LOW">Low Stock</SelectItem>
            <SelectItem value="OUT">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>UoM</TableHead>
              <TableHead>Category</TableHead>
              {isAdmin && <TableHead className="text-right">SOH Main</TableHead>}
              {isAdmin && <TableHead className="text-right">SOH Upanga</TableHead>}
              {!isAdmin && <TableHead className="text-right">SOH ({branch.name})</TableHead>}
              <TableHead className="text-right">Total SOH</TableHead>
              <TableHead className="text-right">Reorder Pt.</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const total = p.stockMain + p.stockUpanga;
              const tone = total === 0 ? "danger" : total <= p.reorderPoint ? "warning" : "success";
              const label = total === 0 ? "Out of Stock" : total <= p.reorderPoint ? "Low Stock" : "In Stock";
              const branchSoh = branch.id === "br_main" ? p.stockMain : p.stockUpanga;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-xs">{p.unit}</TableCell>
                  <TableCell className="text-xs">{p.category}</TableCell>
                  {isAdmin && <TableCell className="text-right num">{p.stockMain}</TableCell>}
                  {isAdmin && <TableCell className="text-right num">{p.stockUpanga}</TableCell>}
                  {!isAdmin && <TableCell className="text-right num">{branchSoh}</TableCell>}
                  <TableCell className="text-right num">{total}</TableCell>
                  <TableCell className="text-right num">{p.reorderPoint}</TableCell>
                  <TableCell><StatusBadge status={label} tone={tone as any} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function ExpiryReport() {
  const { showBuyPrices } = useApp();
  const [tab, setTab] = useState<"expired"|"30"|"60"|"90">("30");
  const data = batches.map((b) => ({ ...b, days: Math.floor((+new Date(b.expiryDate) - Date.now())/86400000) }));
  const filtered = data.filter((b) => {
    if (tab === "expired") return b.days < 0;
    if (tab === "30") return b.days >= 0 && b.days <= 30;
    if (tab === "60") return b.days >= 0 && b.days <= 60;
    return b.days >= 0 && b.days <= 90;
  }).sort((a,b) => a.days - b.days);
  const valueAtRisk = filtered.reduce((a,b) => a + b.qtyRemaining * b.buyPrice, 0);

  const tabBtn = (k: typeof tab, label: string) => (
    <button key={k} onClick={() => setTab(k)}
      className={cn("px-3 py-1.5 text-sm rounded-md transition", tab === k ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
      {label}
    </button>
  );

  return (
    <>
      <Card className="p-3 mb-4 flex flex-wrap items-center gap-2">
        {tabBtn("expired","Expired")}
        {tabBtn("30","≤30 days")}
        {tabBtn("60","≤60 days")}
        {tabBtn("90","≤90 days")}
        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} batches • {showBuyPrices && `Value at risk: ${fmtTZS(valueAtRisk)}`}
        </div>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>UoM</TableHead>
              <TableHead>Batch No.</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Days</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              {showBuyPrices && <TableHead className="text-right">Value at Risk</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => {
              const p = products.find((x) => x.id === b.productId)!;
              const sup = suppliers.find((s) => s.id === b.supplierId);
              const tone = b.days < 0 || b.days <= 30 ? "bg-destructive/5" : b.days <= 90 ? "bg-warning/5" : "";
              return (
                <TableRow key={b.id} className={tone}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-xs">{p.unit}</TableCell>
                  <TableCell className="num text-xs">{b.batchNo}</TableCell>
                  <TableCell className="text-xs">{sup?.name ?? "—"}</TableCell>
                  <TableCell className="num text-xs">{fmtDate(b.receivedDate)}</TableCell>
                  <TableCell className="num text-xs">{fmtDate(b.expiryDate)}</TableCell>
                  <TableCell className={cn("text-right num", b.days < 0 ? "text-destructive font-medium" : b.days <= 30 ? "text-destructive" : b.days <= 90 ? "text-warning" : "")}>{b.days < 0 ? `${Math.abs(b.days)}d ago` : `${b.days}d`}</TableCell>
                  <TableCell className="text-right num">{b.qtyRemaining}</TableCell>
                  {showBuyPrices && <TableCell className="text-right num">{fmtTZS(b.qtyRemaining * b.buyPrice)}</TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function DebtorAgingReport() {
  const rows = customers.map((c) => {
    const list = invoices.filter((i) => i.customerId === c.id);
    const totalInv = list.reduce((a,i) => a + i.amount, 0);
    const totalPaid = list.reduce((a,i) => a + i.paid, 0);
    const outstanding = totalInv - totalPaid;
    const today = Date.now();
    const aging = { b1: 0, b2: 0, b3: 0 };
    list.forEach((i) => {
      const bal = i.amount - i.paid;
      if (bal <= 0) return;
      const days = Math.floor((today - +new Date(i.dueDate)) / 86400000);
      if (days <= 30) aging.b1 += bal;
      else if (days <= 60) aging.b2 += bal;
      else aging.b3 += bal;
    });
    return { c, totalInv, totalPaid, outstanding, ...aging };
  }).filter((r) => r.totalInv > 0);
  const grandOut = rows.reduce((a,r) => a + r.outstanding, 0);
  const overdueCustomers = rows.filter((r) => r.b3 > 0).length;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4"><Stat label="Total Outstanding" value={fmtTZS(grandOut)} /></Card>
        <Card className="p-4"><Stat label="Customers Overdue 60+" value={overdueCustomers} /></Card>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Invoiced</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">0–30d</TableHead>
              <TableHead className="text-right">31–60d</TableHead>
              <TableHead className="text-right">60+ d</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.c.id}>
                <TableCell className="font-medium">{r.c.name}</TableCell>
                <TableCell className="text-right num">{fmtTZS(r.totalInv)}</TableCell>
                <TableCell className="text-right num">{fmtTZS(r.totalPaid)}</TableCell>
                <TableCell className="text-right num font-medium">{fmtTZS(r.outstanding)}</TableCell>
                <TableCell className="text-right num">{fmtTZS(r.b1)}</TableCell>
                <TableCell className="text-right num text-warning">{fmtTZS(r.b2)}</TableCell>
                <TableCell className="text-right num text-destructive">{fmtTZS(r.b3)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-primary/5 border-t-2">
              <TableCell className="font-semibold">Grand Total</TableCell>
              <TableCell className="text-right num font-bold">{fmtTZS(rows.reduce((a,r) => a + r.totalInv, 0))}</TableCell>
              <TableCell className="text-right num font-bold">{fmtTZS(rows.reduce((a,r) => a + r.totalPaid, 0))}</TableCell>
              <TableCell className="text-right num font-bold">{fmtTZS(grandOut)}</TableCell>
              <TableCell className="text-right num font-bold">{fmtTZS(rows.reduce((a,r) => a + r.b1, 0))}</TableCell>
              <TableCell className="text-right num font-bold">{fmtTZS(rows.reduce((a,r) => a + r.b2, 0))}</TableCell>
              <TableCell className="text-right num font-bold">{fmtTZS(rows.reduce((a,r) => a + r.b3, 0))}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

const SALES_FIELDS = ["Date","Item","UoM","Category","Sell Price","Qty","Discount","Total","Customer","Cashier","Branch","Payment","TRA Status"];
const STOCK_FIELDS = ["Item","UoM","Category","SOH","Buy Price","Sell Price","Profit/Unit","Reorder Pt.","Status"];
const PURCHASE_FIELDS = ["Supplier","Item","UoM","Qty Ordered","Qty Received","Unit Cost","Total","Date","PO Number","Status"];

function CustomReportBuilder({ range }: { range: { from: Date; to: Date } }) {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<"sales"|"stock"|"purchase"|null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [catFilter, setCatFilter] = useState("ALL");
  const cats = Array.from(new Set(products.map((p) => p.category)));

  const reset = () => { setStep(1); setSource(null); setFields([]); };

  const availableFields = source === "sales" ? SALES_FIELDS : source === "stock" ? STOCK_FIELDS : source === "purchase" ? PURCHASE_FIELDS : [];

  const previewRows = useMemo<(string|number)[][]>(() => {
    if (source === "sales") {
      const list = sales.filter((s) =>
        new Date(s.date) >= range.from && new Date(s.date) <= range.to &&
        (branchFilter === "ALL" || s.branchId === branchFilter)
      );
      const rows: (string|number)[][] = [];
      list.forEach((s) => s.lines.forEach((l) => {
        const p = products.find((x) => x.id === l.productId)!;
        if (catFilter !== "ALL" && p.category !== catFilter) return;
        const map: Record<string, string|number> = {
          "Date": fmtDate(s.date), "Item": p.name, "UoM": p.unit, "Category": p.category,
          "Sell Price": fmtTZS(l.unitPrice), "Qty": l.qty, "Discount": `${l.discountPct}%`,
          "Total": fmtTZS(l.lineTotal), "Customer": s.customerName, "Cashier": s.cashierId,
          "Branch": s.branchId, "Payment": s.payment, "TRA Status": s.traStatus,
        };
        rows.push(fields.map((f) => map[f] ?? ""));
      }));
      return rows;
    }
    if (source === "stock") {
      return products.filter((p) => catFilter === "ALL" || p.category === catFilter).map((p) => {
        const total = p.stockMain + p.stockUpanga;
        const status = total === 0 ? "Out of Stock" : total <= p.reorderPoint ? "Low Stock" : "In Stock";
        const map: Record<string, string|number> = {
          "Item": p.name, "UoM": p.unit, "Category": p.category, "SOH": total,
          "Buy Price": fmtTZS(p.buyPrice), "Sell Price": fmtTZS(p.sellPrice),
          "Profit/Unit": fmtTZS(p.sellPrice - p.buyPrice), "Reorder Pt.": p.reorderPoint, "Status": status,
        };
        return fields.map((f) => map[f] ?? "");
      });
    }
    if (source === "purchase") {
      const rows: (string|number)[][] = [];
      purchaseOrders.filter((po) => new Date(po.date) >= range.from && new Date(po.date) <= range.to)
        .forEach((po) => po.lines.forEach((l) => {
          const p = products.find((x) => x.id === l.productId)!;
          if (catFilter !== "ALL" && p.category !== catFilter) return;
          const sup = suppliers.find((s) => s.id === po.supplierId);
          const map: Record<string, string|number> = {
            "Supplier": sup?.name ?? "—", "Item": p.name, "UoM": p.unit,
            "Qty Ordered": l.qty, "Qty Received": l.received, "Unit Cost": fmtTZS(l.buyPrice),
            "Total": fmtTZS(l.qty * l.buyPrice), "Date": fmtDate(po.date),
            "PO Number": po.poNo, "Status": po.status,
          };
          rows.push(fields.map((f) => map[f] ?? ""));
        }));
      return rows;
    }
    return [];
  }, [source, fields, branchFilter, catFilter, range]);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        {[1,2,3,4].map((n) => (
          <div key={n} className={cn("flex items-center gap-2", n < 4 && "flex-1")}>
            <div className={cn("h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center",
              step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{n}</div>
            {n < 4 && <div className={cn("h-px flex-1", step > n ? "bg-primary" : "bg-border")} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3 className="font-medium mb-3">Select data source</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(["sales","stock","purchase"] as const).map((s) => (
              <button key={s} onClick={() => { setSource(s); setStep(2); }}
                className={cn("p-6 rounded-lg border-2 text-left transition hover:border-primary",
                  source === s ? "border-primary bg-primary/5" : "border-border")}>
                <div className="font-medium capitalize">{s} Data</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s === "sales" && "Transactions, line items, revenue"}
                  {s === "stock" && "Inventory levels, valuation"}
                  {s === "purchase" && "POs, supplier orders, costs"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="font-medium mb-3">Select fields</h3>
          <div className="grid grid-cols-2 gap-2">
            {availableFields.map((f) => (
              <label key={f} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                <Checkbox checked={fields.includes(f)} onCheckedChange={(c) => {
                  setFields((prev) => c ? [...prev, f] : prev.filter((x) => x !== f));
                }} />
                <span className="text-sm">{f}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between mt-5">
            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-1.5" /> Back</Button>
            <Button disabled={fields.length === 0} onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="font-medium mb-3">Apply filters</h3>
          <div className="space-y-3 max-w-md">
            <div>
              <Label className="text-xs">Date Range</Label>
              <div className="text-sm num text-muted-foreground">{fmtDate(range.from)} — {fmtDate(range.to)} (from period selector)</div>
            </div>
            <div>
              <Label className="text-xs">Branch</Label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Branches</SelectItem>
                  <SelectItem value="br_main">Main Branch</SelectItem>
                  <SelectItem value="br_upanga">Upanga Branch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-between mt-5">
            <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4 mr-1.5" /> Back</Button>
            <Button onClick={() => setStep(4)}>Preview Report</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Preview — Showing {previewRows.length} rows</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toast.success("Excel exported (demo)")}>Excel</Button>
              <Button size="sm" variant="outline" onClick={() => toast.success("PDF exported (demo)")}>PDF</Button>
              <Button size="sm" variant="ghost" onClick={reset}><ArrowLeft className="h-4 w-4 mr-1.5" /> Start Over</Button>
            </div>
          </div>
          <div className="border rounded-md overflow-auto max-h-[480px]">
            <Table>
              <TableHeader>
                <TableRow>{fields.map((f) => <TableHead key={f}>{f}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.slice(0, 200).map((r, i) => (
                  <TableRow key={i}>{r.map((c, j) => <TableCell key={j} className="text-xs">{c}</TableCell>)}</TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Card>
  );
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
