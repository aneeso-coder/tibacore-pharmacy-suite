import type {
  Branch, User, Product, Supplier, Customer, Batch, Sale, Prescription, PurchaseOrder, AuditEntry, TaxCode,
} from "./types";

export const ORG = {
  name: "Neeso Pharmaceuticals Ltd",
  tagline: "Pharmacy. Simplified.",
};

export const branches: Branch[] = [
  {
    id: "br_main",
    name: "Main Branch",
    location: "Kariakoo, Dar es Salaam",
    tin: "123-456-789",
    address: "Mkunguni St, Kariakoo, Dar es Salaam",
  },
  {
    id: "br_upanga",
    name: "Upanga Branch",
    location: "Upanga, Dar es Salaam",
    tin: "123-456-790",
    address: "Upanga Rd, Upanga, Dar es Salaam",
  },
];

export const users: User[] = [
  { id: "u1", name: "Dr. Amina Hassan", email: "admin@tibacore.com", role: "super_admin", branchId: "ALL", active: true, lastLogin: "2025-04-19T08:30:00" },
  { id: "u2", name: "John Mwangi", email: "pharmacist@tibacore.com", role: "pharmacist", branchId: "br_main", active: true, lastLogin: "2025-04-19T07:45:00" },
  { id: "u3", name: "Grace Kimaro", email: "cashier@tibacore.com", role: "cashier", branchId: "br_main", active: true, lastLogin: "2025-04-19T08:00:00" },
  { id: "u4", name: "Peter Mollel", email: "viewer@tibacore.com", role: "viewer", branchId: "br_upanga", active: true, lastLogin: "2025-04-18T17:20:00" },
];

export const credentials: Record<string, string> = {
  "admin@tibacore.com": "admin123",
  "pharmacist@tibacore.com": "pharma123",
  "cashier@tibacore.com": "cash123",
  "viewer@tibacore.com": "view123",
};

const mk = (i: number, name: string, cat: string, unit: string, pack: string, sell: number, buy: number, tax: TaxCode, rx: boolean, reorder: number, controlled = false): Product => ({
  id: `p${i}`,
  barcode: `60100${String(i).padStart(4, "0")}`,
  name, category: cat, unit, packSize: pack, sellPrice: sell, buyPrice: buy, taxCode: tax, rxRequired: rx, controlled,
  reorderPoint: reorder,
  stockMain: Math.max(0, Math.floor(reorder * (1.5 + (i % 4)))),
  stockUpanga: Math.max(0, Math.floor(reorder * (0.6 + (i % 3) * 0.4))),
});

export const products: Product[] = [
  mk(1, "Panadol Extra 500mg tabs x24", "Analgesic", "pack", "x24", 2500, 1200, "A", false, 30),
  mk(2, "Amoxicillin 500mg caps x10", "Antibiotic", "pack", "x10", 8500, 3800, "C", true, 20),
  mk(3, "Metformin 500mg tabs x30", "Antidiabetic", "pack", "x30", 12000, 5500, "C", true, 15),
  mk(4, "Coartem 80/480mg tabs x6", "Antimalarial", "pack", "x6", 15000, 7200, "E", true, 12),
  mk(5, "Vitamin C 500mg tabs x20", "Vitamin", "pack", "x20", 4500, 1800, "A", false, 25),
  mk(6, "Omeprazole 20mg caps x14", "Antacid", "pack", "x14", 9500, 4200, "C", false, 18),
  mk(7, "ORS Sachets x5", "Rehydration", "pack", "x5", 1500, 600, "E", false, 40),
  mk(8, "Dettol Antiseptic 100ml", "Antiseptic", "bottle", "100ml", 5200, 2100, "A", false, 20),
  mk(9, "Metronidazole 400mg tabs x10", "Antibiotic", "pack", "x10", 7000, 2800, "C", true, 18),
  mk(10, "Ibuprofen 400mg tabs x10", "Analgesic", "pack", "x10", 3500, 1400, "A", false, 25),
  mk(11, "Cetirizine 10mg tabs x10", "Antihistamine", "pack", "x10", 4000, 1600, "A", false, 20),
  mk(12, "Folic Acid 5mg tabs x30", "Supplement", "pack", "x30", 3000, 1100, "E", false, 25),
  mk(13, "Albendazole 400mg tab x1", "Antiparasitic", "tab", "x1", 2000, 800, "C", false, 30),
  mk(14, "Betamethasone Cream 15g", "Topical", "tube", "15g", 6500, 2800, "A", false, 12),
  mk(15, "Normal Saline 0.9% 1L IV", "IV Fluid", "bag", "1L", 18000, 8500, "E", true, 8),
  mk(16, "Azithromycin 500mg tabs x3", "Antibiotic", "pack", "x3", 14000, 6000, "C", true, 15),
  mk(17, "Multivitamin tabs x30", "Vitamin", "pack", "x30", 8000, 3200, "A", false, 18),
  mk(18, "Latex Gloves Medium x100", "Consumable", "box", "x100", 22000, 9500, "A", false, 6),
  mk(19, "Hand Sanitizer 500ml", "Antiseptic", "bottle", "500ml", 7500, 3000, "A", false, 12),
  mk(20, "Morphine Sulfate 10mg", "Controlled", "amp", "x1", 25000, 11000, "E", true, 5, true),
];

export const suppliers: Supplier[] = [
  { id: "s1", name: "Shelys Pharmaceuticals Ltd", contact: "Mr. Karim", phone: "+255713000111", email: "sales@shelys.co.tz", productIds: ["p2","p3","p4","p9","p15","p16"] },
  { id: "s2", name: "Cosmos Limited", contact: "Ms. Neema", phone: "+255713000222", email: "orders@cosmos.co.tz", productIds: ["p1","p5","p6","p7","p8","p10","p11","p12","p13","p17","p19"] },
  { id: "s3", name: "Dawa Limited", contact: "Mr. Joseph", phone: "+255713000333", email: "info@dawa.co.tz", productIds: ["p14","p15","p18","p20"] },
];

export const customers: Customer[] = [
  { id: "c1", name: "Fatuma Salim", phone: "+255712345678" },
  { id: "c2", name: "Hassan Juma", phone: "+255765432100" },
  { id: "c3", name: "Mary Msigwa", phone: "+255754111222" },
  { id: "c4", name: "Ahmed Rashid", phone: "+255788999000" },
  { id: "c5", name: "Lucia Mwamba", phone: "+255719876543" },
];

const today = new Date();
const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

export const batches: Batch[] = products.flatMap((p, idx) => {
  const supplierId = suppliers.find((s) => s.productIds.includes(p.id))?.id ?? "s2";
  const batches: Batch[] = [];
  const b1Expiry = addDays(today, 20 + idx * 5); // some near expiry
  batches.push({
    id: `b_${p.id}_1`, productId: p.id, supplierId,
    batchNo: `BN${idx + 1}001`, receivedDate: addDays(today, -90).toISOString(),
    expiryDate: b1Expiry.toISOString(), qtyReceived: p.reorderPoint * 3, qtyRemaining: Math.floor(p.reorderPoint * 1.5),
    buyPrice: p.buyPrice,
  });
  batches.push({
    id: `b_${p.id}_2`, productId: p.id, supplierId,
    batchNo: `BN${idx + 1}002`, receivedDate: addDays(today, -30).toISOString(),
    expiryDate: addDays(today, 365 + idx * 10).toISOString(),
    qtyReceived: p.reorderPoint * 2, qtyRemaining: Math.floor(p.reorderPoint * 1.2),
    buyPrice: p.buyPrice,
  });
  return batches;
});

const computeLineTotals = (lines: { productId: string; qty: number; unitPrice: number; discountPct: number; taxCode: TaxCode; name: string }[]) => {
  let subtotal = 0, discountTotal = 0, vatA = 0, vatC = 0, vatE = 0;
  const out = lines.map((l) => {
    const gross = l.qty * l.unitPrice;
    const discount = gross * (l.discountPct / 100);
    const net = gross - discount;
    subtotal += gross;
    discountTotal += discount;
    if (l.taxCode === "A") vatA += (net * 18) / 118;
    return { ...l, lineTotal: net };
  });
  const total = subtotal - discountTotal;
  return { lines: out, subtotal, discountTotal, vatA, vatC, vatE, total };
};

// Generate 30 days of sales
const seedSales = (): Sale[] => {
  const sales: Sale[] = [];
  let counter = 1;
  for (let day = 30; day >= 0; day--) {
    const date = addDays(today, -day);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const txCount = isWeekend ? 6 + (day % 3) : 12 + (day % 5);
    for (let i = 0; i < txCount; i++) {
      const branchId = i % 3 === 0 ? "br_upanga" : "br_main";
      const cashierId = branchId === "br_main" ? "u3" : "u2";
      const customer = customers[(day + i) % (customers.length + 1)];
      const lineCount = 1 + ((day + i) % 4);
      const rawLines = Array.from({ length: lineCount }, (_, k) => {
        const p = products[(day * 3 + i + k) % products.length];
        return {
          productId: p.id, name: p.name, qty: 1 + ((i + k) % 3),
          unitPrice: p.sellPrice, discountPct: i % 7 === 0 ? 5 : 0, taxCode: p.taxCode,
        };
      });
      const t = computeLineTotals(rawLines);
      const payment = (["CASH", "MOBILE", "CARD"] as const)[(day + i) % 3];
      const ts = new Date(date);
      ts.setHours(9 + (i % 9), (i * 7) % 60, 0, 0);
      sales.push({
        id: `sale_${counter}`,
        receiptNo: `RC-${String(counter).padStart(5, "0")}`,
        date: ts.toISOString(),
        branchId, cashierId,
        customerId: customer ? customer.id : undefined,
        customerName: customer ? customer.name : "Walk-in",
        lines: t.lines as any,
        subtotal: t.subtotal, discountTotal: t.discountTotal,
        vatA: t.vatA, vatC: t.vatC, vatE: t.vatE,
        total: t.total, payment,
        traStatus: i % 17 === 0 ? "FAILED" : i % 11 === 0 ? "PENDING" : "SUBMITTED",
      });
      counter++;
    }
  }
  return sales;
};

export const sales: Sale[] = seedSales();

export const prescriptions: Prescription[] = [
  { id: "rx1", rxNo: "RX-0001", patient: "Fatuma Salim", prescriber: "Dr. Mwakasege", date: addDays(today, -2).toISOString(), status: "ACTIVE",
    lines: [{ productId: "p2", prescribedQty: 2, dispensedQty: 0 }, { productId: "p10", prescribedQty: 1, dispensedQty: 0 }] },
  { id: "rx2", rxNo: "RX-0002", patient: "Hassan Juma", prescriber: "Dr. Said", date: addDays(today, -5).toISOString(), status: "PARTIAL",
    lines: [{ productId: "p3", prescribedQty: 3, dispensedQty: 1 }] },
  { id: "rx3", rxNo: "RX-0003", patient: "Mary Msigwa", prescriber: "Dr. Mhina", date: addDays(today, -10).toISOString(), status: "DISPENSED",
    lines: [{ productId: "p16", prescribedQty: 1, dispensedQty: 1 }] },
  { id: "rx4", rxNo: "RX-0004", patient: "Ahmed Rashid", prescriber: "Dr. Mwakasege", date: addDays(today, -40).toISOString(), status: "EXPIRED",
    lines: [{ productId: "p4", prescribedQty: 2, dispensedQty: 0 }] },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: "po1", poNo: "PO-0001", branchId: "br_main", supplierId: "s1", date: addDays(today, -14).toISOString(),
    expectedDate: addDays(today, -7).toISOString(), status: "RECEIVED",
    lines: [{ productId: "p2", qty: 50, received: 50, buyPrice: 3800 }, { productId: "p3", qty: 30, received: 30, buyPrice: 5500 }],
    total: 50 * 3800 + 30 * 5500 },
  { id: "po2", poNo: "PO-0002", branchId: "br_main", supplierId: "s2", date: addDays(today, -5).toISOString(),
    expectedDate: addDays(today, 2).toISOString(), status: "PARTIAL",
    lines: [{ productId: "p1", qty: 100, received: 60, buyPrice: 1200 }, { productId: "p5", qty: 40, received: 40, buyPrice: 1800 }],
    total: 100 * 1200 + 40 * 1800 },
  { id: "po3", poNo: "PO-0003", branchId: "br_upanga", supplierId: "s3", date: addDays(today, -1).toISOString(),
    expectedDate: addDays(today, 5).toISOString(), status: "SENT",
    lines: [{ productId: "p15", qty: 20, received: 0, buyPrice: 8500 }, { productId: "p18", qty: 10, received: 0, buyPrice: 9500 }],
    total: 20 * 8500 + 10 * 9500 },
  { id: "po4", poNo: "PO-0004", branchId: "br_main", supplierId: "s2", date: addDays(today, 0).toISOString(),
    expectedDate: addDays(today, 7).toISOString(), status: "DRAFT",
    lines: [{ productId: "p7", qty: 80, received: 0, buyPrice: 600 }],
    total: 80 * 600 },
];

export const auditLog: AuditEntry[] = [
  { id: "a1", ts: addDays(today, 0).toISOString(), userId: "u1", action: "LOGIN", module: "Auth", description: "Signed in" },
  { id: "a2", ts: addDays(today, 0).toISOString(), userId: "u2", action: "CREATE", module: "Sales", description: "Created sale RC-00541" },
  { id: "a3", ts: addDays(today, -1).toISOString(), userId: "u1", action: "UPDATE", module: "Products", description: "Updated price for Panadol Extra" },
  { id: "a4", ts: addDays(today, -1).toISOString(), userId: "u3", action: "CREATE", module: "Sales", description: "Created sale RC-00538" },
  { id: "a5", ts: addDays(today, -2).toISOString(), userId: "u1", action: "CREATE", module: "Users", description: "Added user Peter Mollel" },
  { id: "a6", ts: addDays(today, -3).toISOString(), userId: "u2", action: "UPDATE", module: "Inventory", description: "Adjusted stock for Coartem" },
];
