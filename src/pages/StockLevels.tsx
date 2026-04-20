import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { products } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fmtTZS } from "@/lib/format";

export default function StockLevels() {
  return (
    <AppLayout title="Stock Levels">
      <PageHeader title="Stock Levels" description="Combined inventory across both branches" />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Pack</TableHead>
              <TableHead className="text-right">Main Branch</TableHead>
              <TableHead className="text-right">Upanga Branch</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Reorder Pt.</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const total = p.stockMain + p.stockUpanga;
              const low = total <= p.reorderPoint * 1.5;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-xs">{p.packSize}</TableCell>
                  <TableCell className="text-right num">{p.stockMain}</TableCell>
                  <TableCell className="text-right num">{p.stockUpanga}</TableCell>
                  <TableCell className="text-right num font-medium">{total}</TableCell>
                  <TableCell className="text-right num text-muted-foreground">{p.reorderPoint}</TableCell>
                  <TableCell>
                    {low ? <Badge variant="outline" className="text-warning border-warning/30">Low</Badge>
                      : <Badge variant="outline" className="text-success border-success/30">Healthy</Badge>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppLayout>
  );
}
