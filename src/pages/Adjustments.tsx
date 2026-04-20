import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader, EmptyState } from "@/components/ui-ext/Page";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Adjustments() {
  return (
    <AppLayout title="Stock Adjustments">
      <PageHeader title="Stock Adjustments" description="Manual corrections, write-offs, and transfers" />
      <EmptyState
        icon={<ClipboardList className="h-6 w-6" />}
        title="No adjustments yet"
        description="Record stock corrections, transfers between branches, or expired write-offs."
        action={<Button>New Adjustment</Button>}
      />
    </AppLayout>
  );
}
