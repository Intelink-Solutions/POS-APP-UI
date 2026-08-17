


import {
  ShoppingCart, Users, ShoppingBag, Package, ListChecks, BarChart3,
  FileText, TrendingUp, Wallet, Receipt, DollarSign, CreditCard,
  UserCheck, Truck, Tags, BookOpen, Ruler, Landmark, Bell, UserCircle, ShieldCheck,
  Briefcase, Clock, CalendarDays, CalendarOff, ClipboardList, History,
  GitBranch, Building2, ArrowLeftRight, KeyRound, PackageCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MenuCard from "@/components/MenuCard";
import BottomNav from "@/components/BottomNav";
import { store } from "@/lib/store";
import SyncStatusBadge from "@/components/SyncStatusBadge";
import logo from "@/assets/logo.png";
import { formatCurrency } from "@/lib/currency";
import { useStoreRefresh } from "@/hooks/use-live-data";
import { useSecurityPrefs } from "@/hooks/use-security-prefs";
import { maskSensitiveValue } from "@/lib/security";
import { filterMenuItems } from "@/lib/permissions";
import { useAppContext } from "@/hooks/use-app-context";
import BranchSwitcher from "@/components/BranchSwitcher";

const salesMenu = [
  { icon: ShoppingCart, label: "New Sale", path: "/add-sale", color: "#e74c3c" },
  { icon: Receipt, label: "Sales List", path: "/sales", color: "#27ae60" },
  { icon: TrendingUp, label: "Sale Returns", path: "/sale-returns", color: "#e67e22" },
];

const purchaseMenu = [
  { icon: ShoppingBag, label: "New Purchase", path: "/add-purchase", color: "#2980b9" },
  { icon: CreditCard, label: "Purchase List", path: "/purchases", color: "#8e44ad" },
  { icon: ListChecks, label: "Purchase Returns", path: "/purchase-returns", color: "#e67e22" },
];

const inventoryMenu = [
  { icon: Package, label: "Products", path: "/products", color: "#e74c3c" },
  { icon: Tags, label: "Categories", path: "/categories", color: "#27ae60" },
  { icon: BookOpen, label: "Brands", path: "/brands", color: "#2980b9" },
  { icon: Ruler, label: "Units", path: "/units", color: "#e67e22" },
  { icon: BarChart3, label: "Stock List", path: "/stock", color: "#8e44ad" },
  { icon: History, label: "History", path: "/inventory-history", color: "#6366f1" },
];

const peopleMenu = [
  { icon: UserCheck, label: "Customers", path: "/customers", color: "#27ae60" },
  { icon: Truck, label: "Suppliers", path: "/suppliers", color: "#e67e22" },
  { icon: DollarSign, label: "Due List", path: "/due-list", color: "#e74c3c" },
];

const financeMenu = [
  { icon: Landmark, label: "Finance", path: "/finance", color: "#2980b9" },
  { icon: Wallet, label: "Expenses", path: "/expenses", color: "#e74c3c" },
  { icon: DollarSign, label: "Income", path: "/income", color: "#27ae60" },
  { icon: FileText, label: "Reports", path: "/reports", color: "#8e44ad" },
];

const branchMenu = [
  { icon: GitBranch,      label: "Branches",        path: "/branches",            color: "#2980b9" },
  { icon: Building2,      label: "Warehouses",      path: "/warehouses",          color: "#27ae60" },
  { icon: ArrowLeftRight, label: "Transfers",       path: "/transfers",           color: "#e67e22" },
  { icon: KeyRound,       label: "Branch Roles",    path: "/branch-roles",        color: "#8e44ad" },
  { icon: History,        label: "All Branches",    path: "/all-branches-history", color: "#16a085" },
];

const hrmMenu = [
  { icon: Briefcase, label: "Departments", path: "/hrm/departments", color: "#2980b9" },
  { icon: UserCheck, label: "Designations", path: "/hrm/designations", color: "#27ae60" },
  { icon: Clock, label: "Shifts", path: "/hrm/shifts", color: "#e67e22" },
  { icon: Users, label: "Employees", path: "/hrm/employees", color: "#8e44ad" },
  { icon: CalendarDays, label: "Leave Types", path: "/hrm/leave-types", color: "#e74c3c" },
  { icon: CalendarOff, label: "Leaves", path: "/hrm/leaves", color: "#2980b9" },
  { icon: CalendarDays, label: "Holidays", path: "/hrm/holidays", color: "#27ae60" },
  { icon: ClipboardList, label: "Attendance", path: "/hrm/attendance", color: "#e67e22" },
  { icon: DollarSign, label: "Payroll", path: "/hrm/payroll", color: "#e74c3c" },
  { icon: BarChart3, label: "Attendance Report", path: "/hrm/attendance-report", color: "#8e44ad" },
  { icon: FileText, label: "Payroll Report", path: "/hrm/payroll-report", color: "#2980b9" },
  { icon: FileText, label: "Leave Report", path: "/hrm/leave-report", color: "#27ae60" },
  { icon: ShieldCheck, label: "User Roles", path: "/user-roles", color: "#2c3e50" },
];

const Index = () => {
  const navigate = useNavigate();
  useStoreRefresh();
  const security = useSecurityPrefs();
  const { role } = useAppContext();
  const effectiveBranchId = store.getEffectiveBranchId();
  const allSales = store.getSales();
  const allPurchases = store.getPurchases();
  const allExpenses = store.getExpenses();
  // Scope stats to the active/assigned branch
  const sales = effectiveBranchId ? allSales.filter((s) => !s.branchId || s.branchId === effectiveBranchId) : allSales;
  const purchases = effectiveBranchId ? allPurchases.filter((p) => !p.branchId || p.branchId === effectiveBranchId) : allPurchases;
  const expenses = effectiveBranchId ? allExpenses.filter((e) => !e.branchId || e.branchId === effectiveBranchId) : allExpenses;
  const unreadNotifications = store.getNotifications().filter((item) => !item.read).length;
  const totalSales = sales.reduce((s, sale) => s + sale.total, 0);
  const totalPurchases = purchases.reduce((s, p) => s + p.total, 0);
  const totalProfit = sales.reduce((s, sale) => s + sale.profit, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const activeBranch = effectiveBranchId ? store.getBranches().find((b) => b.id === effectiveBranchId) : null;

  // Pending transfers TO this branch
  const pendingIncoming = effectiveBranchId
    ? store.getTransfers().filter((t) => t.status === "pending" && t.toBranchId === effectiveBranchId)
    : [];

  const fSales = filterMenuItems(salesMenu, role);
  const fPurchase = filterMenuItems(purchaseMenu, role);
  const fInventory = filterMenuItems(inventoryMenu, role);
  const fPeople = filterMenuItems(peopleMenu, role);
  const fFinance = filterMenuItems(financeMenu, role);
  const fBranch = filterMenuItems(branchMenu, role);
  const fHrm = filterMenuItems(hrmMenu, role);

  const profile = store.getBusinessProfile();
  const syncOnline = profile.isOnline;

  return (
    <div className="min-h-screen bg-background pb-nav">
      {/* Top Nav — dark branded header */}
      <div
        className="sticky top-0 z-40 safe-top"
        style={{
          background: "linear-gradient(180deg, #111111 0%, #0d0d0d 100%)",
          boxShadow: "0 1px 0 rgba(242,197,0,0.15), 0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {/* Gold brand stripe */}
        <div
          className="h-[3px] w-full"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(49 100% 62%) 60%, transparent 100%)" }}
        />
        <div className="flex items-center gap-3 px-4 h-14">
          {/* Logo + business name */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <img src={logo} alt="KeyPOS" className="h-8 w-8 object-contain rounded-lg shrink-0" />
            <div className="min-w-0">
              <p className="text-white font-bold text-[14px] leading-tight tracking-tight truncate">
                {profile.companyName || "KeyPOS"}
              </p>
              <div className="flex items-center gap-1.5 mt-[2px]">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: syncOnline ? "#22c55e" : "#f59e0b",
                    boxShadow: syncOnline ? "0 0 4px rgba(34,197,94,0.6)" : "0 0 4px rgba(245,158,11,0.6)",
                  }}
                />
                <span className="text-[10px] font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {syncOnline ? "Live" : "Offline"}
                </span>
              </div>
            </div>
          </div>
          {/* Action icons */}
          <div className="flex items-center gap-1 shrink-0">
            <BranchSwitcher />
            <SyncStatusBadge />
            <button
              onClick={() => navigate("/notifications")}
              className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ color: "rgba(255,255,255,0.7)" }}
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
              )}
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ color: "rgba(255,255,255,0.7)" }}
              aria-label="Open profile"
            >
              <UserCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-primary px-5 pt-5 pb-8 rounded-b-3xl">
        <div className="bg-black dark:bg-background rounded-2xl p-4 border border-white/10 dark:border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-primary font-bold text-base">Today's Summary</h2>
            {activeBranch && (
              <span className="flex items-center gap-1 bg-primary/20 rounded-full px-2 py-0.5">
                <GitBranch size={9} className="text-primary" />
                <span className="text-[10px] font-semibold text-primary truncate max-w-[90px]">{activeBranch.name}</span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Sales", value: maskSensitiveValue(formatCurrency(totalSales), security.hideAmounts) },
              { label: "Purchased", value: maskSensitiveValue(formatCurrency(totalPurchases), security.hideAmounts) },
              { label: "Profit", value: maskSensitiveValue(formatCurrency(totalProfit), security.hideAmounts) },
              { label: "Expense", value: maskSensitiveValue(formatCurrency(totalExpense), security.hideAmounts) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-primary/70 text-xs font-medium">{item.label}</p>
                <p className="text-white font-bold text-lg">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incoming transfer alert — shown when branch has pending transfers to accept */}
      {pendingIncoming.length > 0 && (
        <div className="px-4 mt-4">
          <button
            onClick={() => navigate("/transfers")}
            className="w-full flex items-center gap-3 bg-green-600/10 border border-green-600/30 rounded-2xl px-4 py-3 text-left active:bg-green-600/20 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center shrink-0">
              <PackageCheck size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-green-700 dark:text-green-400">
                {pendingIncoming.length} transfer{pendingIncoming.length > 1 ? "s" : ""} awaiting acceptance
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-500/70 truncate">
                Tap to review and accept incoming stock
              </p>
            </div>
            <ArrowLeftRight size={16} className="text-green-600 shrink-0" />
          </button>
        </div>
      )}

      <div className="px-4 mt-5 space-y-5">
        {fSales.length > 0 && <Section title="Sales" items={fSales} />}
        {fPurchase.length > 0 && <Section title="Purchase" items={fPurchase} />}
        {fInventory.length > 0 && <Section title="Inventory" items={fInventory} />}
        {fPeople.length > 0 && <Section title="People" items={fPeople} />}
        {fFinance.length > 0 && <Section title="Finance & Reports" items={fFinance} />}
        {fBranch.length > 0 && <Section title="Branches & Warehouses" items={fBranch} />}
        {fHrm.length > 0 && <Section title="HRM" items={fHrm} />}
      </div>

      <BottomNav />
    </div>
  );
};

const Section = ({ title, items }: { title: string; items: { icon: LucideIcon; label: string; path: string; color: string }[] }) => (
  <div>
    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <MenuCard key={item.label} {...item} />
      ))}
    </div>
  </div>
);

export default Index;
