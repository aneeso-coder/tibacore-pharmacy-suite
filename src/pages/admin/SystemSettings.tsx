import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ORG } from "@/data/seed";
import { toast } from "sonner";

export default function SystemSettings() {
  return (
    <AppLayout title="System Settings">
      <PageHeader title="System Settings" description="Organization, defaults, and integrations" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-medium mb-4">Organization</h3>
          <div className="space-y-3">
            <Field label="Organization name" defaultValue={ORG.name} />
            <Field label="Tagline" defaultValue={ORG.tagline} />
            <Field label="Default currency" defaultValue="TZS" />
            <Field label="Date format" defaultValue="DD/MM/YYYY" />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-medium mb-4">Preferences</h3>
          <Toggle label="Auto-submit receipts to TRA" defaultChecked />
          <Toggle label="Require customer for Rx sales" defaultChecked />
          <Toggle label="Allow zero-price line items" />
          <Toggle label="Email daily Z report summary" defaultChecked />
        </Card>
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={() => toast.success("Settings saved")}>Save Changes</Button>
      </div>
    </AppLayout>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} />
    </div>
  );
}
function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
