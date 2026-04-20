export type Role = "super_admin" | "pharmacist" | "cashier" | "viewer";
export type TaxCode = "A" | "C" | "E"; // 18% / 0% / Exempt
export type PaymentMethod = "CASH" | "MOBILE" | "CARD";
export type TraStatus = "PENDING" | "SUBMITTED" | "FAILED";

export interface Branch {
  id: string;
  name: string;
  location: string;
  tin: string;
  address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | "ALL";
  active: boolean;
  lastLogin?: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  packSize: string;
  sellPrice: number;
  buyPrice: number;
  taxCode: TaxCode;
  rxRequired: boolean;
  controlled?: boolean;
  reorderPoint: number;
  stockMain: number;
  stockUpanga: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  productIds: string[];
  tin?: string;
  address?: string;
  paymentTerms: "COD" | "30_days" | "60_days" | "on_order";
  creditLimit: number;
  outstandingBalance: number;
  active?: boolean;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId?: string;
  customerName: string;
  date: string;
  dueDate: string;
  amount: number;
  paid: number;
  status: "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE";
  lines: SaleLine[];
  notes?: string;
}

export interface SupplierPayable {
  id: string;
  supplierId: string;
  supplierName: string;
  reference: string;
  date: string;
  dueDate: string;
  amount: number;
  paid: number;
  status: "OUTSTANDING" | "OVERDUE" | "PAID";
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface Batch {
  id: string;
  productId: string;
  supplierId: string;
  batchNo: string;
  receivedDate: string;
  expiryDate: string;
  qtyReceived: number;
  qtyRemaining: number;
  buyPrice: number;
}

export interface SaleLine {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  taxCode: TaxCode;
  lineTotal: number;
}

export interface Sale {
  id: string;
  receiptNo: string;
  date: string;
  branchId: string;
  cashierId: string;
  customerId?: string;
  customerName: string;
  lines: SaleLine[];
  subtotal: number;
  discountTotal: number;
  vatA: number;
  vatC: number;
  vatE: number;
  total: number;
  payment: PaymentMethod;
  traStatus: TraStatus;
}

export interface Prescription {
  id: string;
  rxNo: string;
  patient: string;
  prescriber: string;
  date: string;
  status: "ACTIVE" | "DISPENSED" | "PARTIAL" | "EXPIRED";
  lines: { productId: string; prescribedQty: number; dispensedQty: number }[];
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  branchId: string;
  supplierId: string;
  date: string;
  expectedDate: string;
  status: "DRAFT" | "SENT" | "PARTIAL" | "RECEIVED" | "CANCELLED";
  lines: { productId: string; qty: number; received: number; buyPrice: number }[];
  total: number;
}

export interface AuditEntry {
  id: string;
  ts: string;
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN";
  module: string;
  description: string;
}
