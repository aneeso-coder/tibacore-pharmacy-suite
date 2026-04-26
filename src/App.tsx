import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Protected } from "@/components/Protected";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import SalesHistory from "./pages/SalesHistory";
import Products from "./pages/Products";
import StockLevels from "./pages/StockLevels";
import BatchTracker from "./pages/BatchTracker";
import Adjustments from "./pages/Adjustments";
import Customers from "./pages/Customers";
import Prescriptions from "./pages/Prescriptions";
import PurchaseOrders from "./pages/PurchaseOrders";
import Suppliers from "./pages/Suppliers";
import GoodsReceived from "./pages/GoodsReceived";
import Reports from "./pages/Reports";
import Users from "./pages/admin/Users";
import AuditLog from "./pages/admin/AuditLog";
import TraSettings from "./pages/admin/TraSettings";
import SystemSettings from "./pages/admin/SystemSettings";
import Debtors from "./pages/Debtors";
import Creditors from "./pages/Creditors";
import Invoices from "./pages/Invoices";
import NotFound from "./pages/NotFound";
import ReceiptPreview from "./pages/ReceiptPreview";
import GrnWizardPreview from "./pages/GrnWizardPreview";

const queryClient = new QueryClient();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="bottom-right" />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Protected><Dashboard /></Protected>} />
              <Route path="/pos" element={<Protected perm="pos"><POS /></Protected>} />
              <Route path="/sales" element={<Protected><SalesHistory /></Protected>} />
              <Route path="/customers" element={<Protected perm="inventory"><Customers /></Protected>} />
              <Route path="/prescriptions" element={<Protected perm="inventory"><Prescriptions /></Protected>} />
              <Route path="/products" element={<Protected perm="inventory"><Products /></Protected>} />
              <Route path="/stock" element={<Protected perm="inventory"><StockLevels /></Protected>} />
              <Route path="/batches" element={<Protected perm="inventory"><BatchTracker /></Protected>} />
              <Route path="/adjustments" element={<Protected perm="inventory"><Adjustments /></Protected>} />
              <Route path="/purchase-orders" element={<Protected perm="purchasing"><PurchaseOrders /></Protected>} />
              <Route path="/suppliers" element={<Protected perm="purchasing"><Suppliers /></Protected>} />
              <Route path="/grn" element={<Protected perm="purchasing"><GoodsReceived /></Protected>} />
              <Route path="/reports" element={<Navigate to="/reports/sales" replace />} />
              <Route path="/reports/:kind" element={<Protected perm="reports"><Reports /></Protected>} />
              <Route path="/debtors" element={<Protected perm="debtors"><Debtors /></Protected>} />
              <Route path="/creditors" element={<Protected perm="creditors"><Creditors /></Protected>} />
              <Route path="/invoices" element={<Protected perm="invoices"><Invoices /></Protected>} />
              <Route path="/admin/users" element={<Protected perm="users"><Users /></Protected>} />
              <Route path="/admin/audit" element={<Protected perm="audit"><AuditLog /></Protected>} />
              <Route path="/admin/tra" element={<Protected perm="tra_settings"><TraSettings /></Protected>} />
              <Route path="/admin/system" element={<Protected perm="system_settings"><SystemSettings /></Protected>} />
              <Route path="/receipt-preview" element={<Protected><ReceiptPreview /></Protected>} />
              <Route path="/grn-wizard-preview" element={<Protected perm="purchasing"><GrnWizardPreview /></Protected>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
