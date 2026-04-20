import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { suppliers, purchaseOrders } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtTZS } from "@/lib/format";

export default function Suppliers() {
  return (
    <AppLayout title="Suppliers">
      <PageHeader title="Suppliers" description={`${suppliers.length} suppliers`} />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="text-right">POs Placed</TableHead>
              <TableHead className="text-right">Total Spend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => {
              const sPos = purchaseOrders.filter((p) => p.supplierId === s.id);
              const total = sPos.reduce((a, p) => a + p.total, 0);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.contact}</TableCell>
                  <TableCell className="num text-xs">{s.phone}</TableCell>
                  <TableCell className="text-xs">{s.email}</TableCell>
                  <TableCell className="text-right num">{s.productIds.length}</TableCell>
                  <TableCell className="text-right num">{sPos.length}</TableCell>
                  <TableCell className="text-right num font-medium">{fmtTZS(total)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppLayout>
  );
}
