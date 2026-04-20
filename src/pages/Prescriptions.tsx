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
import { useState, Fragment } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const tone = { ACTIVE: "info", DISPENSED: "success", PARTIAL: "warning", EXPIRED: "danger" } as const;

export default function Prescriptions() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <AppLayout title="Prescriptions">
      <PageHeader title="Prescriptions" description={`${prescriptions.length} on file`} />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Rx No.</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Prescriber</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.map((rx) => {
              const isOpen = expanded === rx.id;
              return (
                <Fragment key={rx.id}>
                  <TableRow>
                    <TableCell>
                      <button onClick={() => setExpanded(isOpen ? null : rx.id)} className="text-muted-foreground hover:text-foreground">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </TableCell>
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
                    <TableCell className="text-right space-x-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : rx.id)}>View</Button>
                      {rx.status !== "DISPENSED" && rx.status !== "EXPIRED" && (
                        <Button size="sm" variant="outline" onClick={() => {
                          toast.success(`Loading ${rx.rxNo} into POS`);
                          navigate("/pos", { state: { rxId: rx.id, rxLines: rx.lines } });
                        }}>
                          Dispense
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={8} className="p-4">
                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                          <div><span className="text-muted-foreground">Prescriber:</span> <span className="font-medium">{rx.prescriber}</span></div>
                          <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{rx.patient}</span></div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>UoM</TableHead>
                              <TableHead className="text-right">Qty Prescribed</TableHead>
                              <TableHead className="text-right">Qty Dispensed</TableHead>
                              <TableHead className="text-right">Remaining</TableHead>
                              <TableHead>Dosage</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rx.lines.map((l) => {
                              const p = products.find((x) => x.id === l.productId);
                              return (
                                <TableRow key={l.productId}>
                                  <TableCell className="font-medium">{p?.name}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground">{p?.unit}</TableCell>
                                  <TableCell className="text-right num">{l.prescribedQty}</TableCell>
                                  <TableCell className="text-right num">{l.dispensedQty}</TableCell>
                                  <TableCell className="text-right num font-medium">{l.prescribedQty - l.dispensedQty}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground">As directed</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppLayout>
  );
}
