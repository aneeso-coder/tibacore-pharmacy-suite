import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORG, branches as seedBranches } from "@/data/seed";
import { toast } from "sonner";
import { Upload, Plus, Pencil } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SystemSettings() {
  const [branchSheet, setBranchSheet] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [branches, setBranches] = useState(seedBranches);

  return (
    <AppLayout title="System Settings">
      <PageHeader title="System Settings" description="Organization, defaults, branches and backup" />
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-medium mb-4">Pharmacy Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pharmacy Name" defaultValue={ORG.name} />
                <Field label="Tagline" defaultValue={ORG.tagline} />
                <Field label="TIN" defaultValue="123-456-789" />
                <Field label="VRN" defaultValue="VRN-2024-001" />
                <Field label="Address Line 1" defaultValue="Mkunguni St" />
                <Field label="Address Line 2" defaultValue="Kariakoo" />
                <Field label="City" defaultValue="Dar es Salaam" />
                <Field label="Phone" defaultValue="+255 22 000 0000" />
                <div className="col-span-2"><Field label="Email" defaultValue="info@neeso.co.tz" /></div>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-medium mb-4">Branding</h3>
              <Label className="text-sm">Logo</Label>
              <button onClick={() => toast.info("Logo upload available in production")}
                className="mt-1.5 w-full border-2 border-dashed border-border rounded-md p-8 flex flex-col items-center gap-2 hover:bg-muted/50 transition">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload logo (PNG, JPG)</span>
              </button>
              <div className="mt-5">
                <Label className="text-sm">Receipt Footer Text</Label>
                <Textarea className="mt-1.5" rows={4}
                  defaultValue="Thank you for choosing Neeso Pharmaceuticals. Your health is our priority." />
              </div>
            </Card>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => toast.success("Settings saved")}>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <Card className="p-5 space-y-1">
            <SettingRow label="Default Currency"
              desc="Currency used for all price displays across the system"
              control={<MiniSelect defaultValue="TZS" options={[["TZS","TZS"],["KES","KES"],["UGX","UGX"],["USD","USD"]]} />} />
            <SettingRow label="VAT Display on POS"
              desc="How VAT is shown in the cart total section"
              control={<MiniSelect defaultValue="auto" options={[["auto","Auto (single line when same)"],["full","Always full breakdown"]]} wide />} />
            <SettingRow label="Require Customer for Rx Sales"
              desc="When ON, cashier must attach a customer record before completing a sale containing prescription items"
              control={<Switch defaultChecked />} />
            <SettingRow label="Allow Credit Sales"
              desc="When ON, a Credit/Invoice payment option appears in POS for sales on account"
              control={<Switch defaultChecked />} />
            <SettingRow label="Allow Walk-in Anonymous Sales"
              desc="When OFF, all sales require a customer to be identified"
              control={<Switch defaultChecked />} />
            <SettingRow label="Receipt Print Mode"
              desc="Controls when receipts are printed automatically"
              control={<MiniSelect defaultValue="ask" options={[["ask","Always ask"],["auto","Auto-print"],["manual","Manual only"]]} wide />} />
            <SettingRow label="Require Void Authorisation"
              desc="Voids require approval from a Pharmacist or Admin"
              control={<Switch defaultChecked />} />
            <SettingRow label="Who Can Approve Voids"
              desc="Roles permitted to authorise a void"
              control={<MiniSelect defaultValue="admin_pharm" options={[["admin","Admin only"],["admin_pharm","Admin or Pharmacist"]]} wide />} />
            <SettingRow label="Low Stock Alert Threshold"
              desc="Notify when stock falls to this multiple of reorder point"
              control={<MiniSelect defaultValue="1" options={[["1","At reorder point"],["1.5","1.5× reorder point"],["2","2× reorder point"]]} wide />} />
          </Card>
          <div className="flex justify-end mt-4">
            <Button onClick={() => toast.success("Settings saved")}>Save Operations Settings</Button>
          </div>
        </TabsContent>

        <TabsContent value="branches">
          <Card className="overflow-hidden">
            <div className="p-3 flex justify-end border-b">
              <Button size="sm" onClick={() => setBranchSheet({ open: true })}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Branch
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>TIN</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-xs">{b.location}</TableCell>
                    <TableCell className="num text-xs">{b.tin}</TableCell>
                    <TableCell className="num text-xs">+255 22 000 0000</TableCell>
                    <TableCell className="text-center"><Switch defaultChecked /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setBranchSheet({ open: true, edit: b })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card className="p-5 mb-4">
            <h3 className="font-medium mb-3">Backup Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Last backup</span><span className="text-warning font-medium">Never (not configured)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Includes</span><span>Products, Sales, Inventory, Users, Settings</span></div>
            </div>
            <Button className="mt-4" onClick={() => toast.success("Backup started — you will be notified when complete (demo)")}>
              Run Manual Backup Now
            </Button>
          </Card>
          <Card className="p-5">
            <h3 className="font-medium mb-3">Backup Settings</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <Label className="text-sm">Backup Schedule</Label>
                <Select defaultValue="manual">
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="daily">Daily at midnight</SelectItem>
                    <SelectItem value="weekly">Weekly (Sunday)</SelectItem>
                    <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-2 block">Storage Destination</Label>
                <RadioGroup defaultValue="local">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="local" id="dest-local" />
                    <Label htmlFor="dest-local" className="text-sm font-normal">Local download</Label>
                  </div>
                  <div className="flex items-center gap-2 opacity-60">
                    <RadioGroupItem value="cloud" id="dest-cloud" disabled />
                    <Label htmlFor="dest-cloud" className="text-sm font-normal">Cloud storage <span className="text-xs text-muted-foreground">(Coming in production)</span></Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <Button onClick={() => toast.success("Backup settings saved")}>Save Backup Settings</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={branchSheet.open} onOpenChange={(o) => !o && setBranchSheet({ open: false })}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader><SheetTitle>{branchSheet.edit ? "Edit Branch" : "Add Branch"}</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-5">
            <Field label="Name *" defaultValue={branchSheet.edit?.name ?? ""} />
            <Field label="Location *" defaultValue={branchSheet.edit?.location ?? ""} />
            <Field label="Address" defaultValue={branchSheet.edit?.address ?? ""} />
            <Field label="TIN" defaultValue={branchSheet.edit?.tin ?? ""} />
            <Field label="Phone" defaultValue="" />
          </div>
          <SheetFooter className="mt-5">
            <Button variant="outline" onClick={() => setBranchSheet({ open: false })}>Cancel</Button>
            <Button onClick={() => { toast.success(branchSheet.edit ? "Branch updated (demo)" : "Branch added (demo)"); setBranchSheet({ open: false }); }}>
              {branchSheet.edit ? "Save Changes" : "Add Branch"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input defaultValue={defaultValue} />
    </div>
  );
}

function SettingRow({ label, desc, control }: { label: string; desc: string; control: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function MiniSelect({ defaultValue, options, wide }: { defaultValue: string; options: [string,string][]; wide?: boolean }) {
  return (
    <Select defaultValue={defaultValue}>
      <SelectTrigger className={wide ? "w-72" : "w-48"}><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
