import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { apiCollectDue } from "@/lib/api";
import { syncLiveBusinessData } from "@/lib/live-sync";
import { store } from "@/lib/store";
import { emitStoreUpdate, showSaved } from "@/hooks/use-live-data";

export interface PayDueParty {
  id: string;
  name: string;
  due: number;
  source: "customer" | "supplier";
}

interface PayDueDialogProps {
  party: PayDueParty | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid?: (amount: number) => void;
}

function recordDuePaymentHistory(party: PayDueParty, amount: number, paymentMethod: string, invoiceNo?: string): void {
  const entry = {
    id: store.nextId(),
    partyId: party.id,
    partyName: party.name,
    partyType: party.source,
    invoiceNo,
    amount,
    date: new Date().toISOString().slice(0, 10),
    paymentType: paymentMethod,
  };
  store.saveDuePayments([...store.getDuePayments(), entry]);
}

function updateLocalDue(party: PayDueParty, amount: number, invoiceNo?: string): void {
  if (party.source === "customer") {
    store.saveCustomers(
      store.getCustomers().map((c) => (c.id === party.id ? { ...c, due: Math.max(0, c.due - amount) } : c))
    );
    if (invoiceNo) {
      store.saveSales(
        store.getSales().map((s) => (s.invoiceNo === invoiceNo ? { ...s, due: Math.max(0, s.due - amount) } : s))
      );
    }
  } else {
    store.saveSuppliers(
      store.getSuppliers().map((s) => (s.id === party.id ? { ...s, due: Math.max(0, s.due - amount) } : s))
    );
    if (invoiceNo) {
      store.savePurchases(
        store.getPurchases().map((p) => (p.invoiceNo === invoiceNo ? { ...p, due: Math.max(0, p.due - amount) } : p))
      );
    }
  }
  emitStoreUpdate();
}

/** Shared "record a payment against a party's outstanding due" dialog — used
 * anywhere a customer/supplier due balance needs to be settled (Due List,
 * Customers list, Sales list) so the validation/API/optimistic-update logic
 * only lives in one place. */
const PayDueDialog = ({ party, open, onOpenChange, onPaid }: PayDueDialogProps) => {
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // The backend attributes every due payment to a specific sale/purchase invoice —
  // it rejects a payment with no invoice selected unless the party's due exceeds
  // what its invoices already account for (e.g. an opening balance).
  const invoiceOptions = useMemo(() => {
    if (!party) return [];
    if (party.source === "customer") {
      return store.getSales().filter((s) => s.customerId === party.id && s.due > 0);
    }
    return store.getPurchases().filter((p) => p.supplierId === party.id && p.due > 0);
  }, [party]);

  const selectedInvoice = invoiceOptions.find((inv) => inv.invoiceNo === invoiceNo);
  const maxPayable = selectedInvoice ? selectedInvoice.due : party?.due ?? 0;

  // Reset the amount/invoice/method fields whenever a different party is opened.
  useEffect(() => {
    if (open) {
      setPaymentAmount("");
      setInvoiceNo("");
      setPaymentMethod("cash");
    }
  }, [open, party?.id]);

  const handleRecordPayment = async () => {
    if (!party || !paymentAmount) {
      toast({ title: "Please enter payment amount", variant: "destructive" });
      return;
    }

    if (invoiceOptions.length > 0 && !invoiceNo) {
      toast({ title: "Please select an invoice", variant: "destructive" });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > maxPayable) {
      toast({
        title: "Invalid amount",
        description: `Please enter amount between 0 and ${formatCurrency(maxPayable)}`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await apiCollectDue({
        party_id: party.id,
        paymentDate: new Date().toISOString().slice(0, 10),
        payDueAmount: amount,
        payments: [{ type: paymentMethod, amount }],
        invoiceNumber: invoiceNo || undefined,
      });

      updateLocalDue(party, amount, invoiceNo || undefined);
      recordDuePaymentHistory(party, amount, paymentMethod, invoiceNo || undefined);
      await syncLiveBusinessData().catch(() => null);
      onOpenChange(false);
      showSaved(`Payment of ${formatCurrency(amount)} recorded successfully`);
      onPaid?.(amount);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment recording failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        {party && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Party:</span>
                <span className="font-semibold">{party.name}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">Total Due:</span>
                <span className="font-semibold text-red-600">{formatCurrency(party.due)}</span>
              </div>
            </div>

            {invoiceOptions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Select Invoice</Label>
                <Select value={invoiceNo} onValueChange={setInvoiceNo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an Invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceOptions.map((inv) => (
                      <SelectItem key={inv.invoiceNo} value={inv.invoiceNo}>
                        {inv.invoiceNo} — {formatCurrency(inv.due)} due
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="momo">MoMo</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payDueAmount" className="text-sm font-semibold">
                Payment Amount
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">₵</span>
                <Input
                  id="payDueAmount"
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min={0}
                  max={maxPayable}
                  step="0.01"
                  disabled={invoiceOptions.length > 0 && !invoiceNo}
                  autoFocus
                />
              </div>
            </div>

            {paymentAmount && (
              <div className="bg-primary/5 rounded-lg p-3 text-sm space-y-1">
                <p className="text-muted-foreground">After Payment:</p>
                <p className="font-semibold">
                  New Due: {formatCurrency(Math.max(0, maxPayable - parseFloat(paymentAmount)))}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={!paymentAmount || isSaving || (invoiceOptions.length > 0 && !invoiceNo)}
                className="flex-1"
              >
                {isSaving ? "Saving..." : "Record Payment"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PayDueDialog;
