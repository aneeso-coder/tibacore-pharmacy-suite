import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { prescriptions, products } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui-ext/Badges";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const tone = { ACTIVE: "info", DISPENSED: "success", PARTIAL: "warning", EXPIRED: "danger" } as const;

export default function Prescriptions() {
  const nav = useNavigate();
  return (
    <AppLayout title="Prescriptions">
      <PageHeader title="Prescriptions" description={`${prescriptions.length} on file`} />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rx No.</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Prescriber</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.map((rx) => (
              <TableRow key={rx.id}>
                <TableCell className="font-medium num">{rx.rxNo}</TableCell>
                <TableCell>{rx.patient}</TableCell>
                <TableCell className="text-xs">{rx.prescriber}</TableCell>
                <TableCell className="num text-xs">{fmtDate(rx.date)}</TableCell>
                <TableCell className="text-xs">
                  {rx.lines.map((l) => {
                    const p = products.find((x) => x.id === l.productId);
                    return (
                      <div key={l.productId} className="num">{p?.name?.split(" ").slice(0,3).join(" ")} ({l.dispensedQty}/{l.prescribedQty})</div>
                    );
                  })}
                </TableCell>
                <TableCell><StatusBadge status={rx.status} tone={tone[rx.status]} /></TableCell>
                <TableCell className="text-right">
                  {rx.status !== "DISPENSED" && rx.status !== "EXPIRED" && (
                    <Button size="sm" variant="outline" onClick={() => { toast.success(`Loading ${rx.rxNo} into POS`); nav("/pos"); }}>
                      Dispense
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AppLayout>
  );
}
