import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { batches, products, suppliers } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fmtTZS, fmtDate } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";

export default function BatchTracker() {
  const { showBuyPrices } = useApp();
  const [filter, setFilter] = useState("ALL");

  const data = useMemo(() => {
    return batches.map((b) => {
      const days = Math.floor((+new Date(b.expiryDate) - Date.now()) / 86400000);
      return { ...b, days };
    }).filter((b) => {
      if (filter === "30") return b.days <= 30;
      if (filter === "90") return b.days <= 90;
      if (filter === "180") return b.days <= 180;
      return true;
    }).sort((a,b) => a.days - b.days);
  }, [filter]);

  return (
    <AppLayout title="Batch Tracker">
      <PageHeader title="Batch Tracker" description="All product batches and expiry windows" />
      <Card className="p-3 mb-4 flex gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All batches</SelectItem>
            <SelectItem value="30">Expiring within 30 days</SelectItem>
            <SelectItem value="90">Expiring within 90 days</SelectItem>
            <SelectItem value="180">Expiring within 180 days</SelectItem>
          </SelectContent>
        </Select>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Batch No.</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              {showBuyPrices && <TableHead className="text-right">Buy Price</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((b) => {
              const p = products.find((x) => x.id === b.productId);
              const s = suppliers.find((x) => x.id === b.supplierId);
              const tone = b.days <= 30 ? "bg-destructive/15 text-destructive border-destructive/30"
                : b.days <= 90 ? "bg-warning/15 text-warning border-warning/30"
                : "bg-success/15 text-success border-success/30";
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{p?.name}</TableCell>
                  <TableCell className="num">{b.batchNo}</TableCell>
                  <TableCell className="text-xs">{s?.name}</TableCell>
                  <TableCell className="text-xs num">{fmtDate(b.receivedDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={tone}>{fmtDate(b.expiryDate)} • {b.days}d</Badge>
                  </TableCell>
                  <TableCell className="text-right num">{b.qtyReceived}</TableCell>
                  <TableCell className="text-right num">{b.qtyRemaining}</TableCell>
                  {showBuyPrices && <TableCell className="text-right num text-muted-foreground">{fmtTZS(b.buyPrice)}</TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppLayout>
  );
}
