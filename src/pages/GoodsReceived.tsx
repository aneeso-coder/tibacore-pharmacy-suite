import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader, EmptyState } from "@/components/ui-ext/Page";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GoodsReceived() {
  return (
    <AppLayout title="Goods Received">
      <PageHeader title="Goods Received" description="GRNs created from purchase orders" />
      <EmptyState
        icon={<PackageCheck className="h-6 w-6" />}
        title="No GRNs yet"
        description="Create a Goods Received Note from a Sent or Partial PO to register stock and batches."
        action={<Button>Open Purchase Orders</Button>}
      />
    </AppLayout>
  );
}
