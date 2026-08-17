import ReportPage from "@/components/ReportPage";
import { store } from "@/lib/store";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/currency";
import { useLiveData } from "@/hooks/use-live-data";

const PaidDueHistory = () => {
  const duePayments = useLiveData(() => store.getDuePayments());

  const data = useMemo(() => {
    return [...duePayments]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((p) => ({
        date: p.date,
        partyName: p.partyName,
        partyType: p.partyType === "customer" ? "Customer" : "Supplier",
        invoiceNo: p.invoiceNo || "-",
        amount: p.amount,
        paymentType: p.paymentType,
      }));
  }, [duePayments]);

  const totalCollected = data.reduce((s, d) => s + d.amount, 0);

  return (
    <ReportPage
      title="Paid Due History"
      data={data}
      columns={[
        { key: "date", label: "Date Paid" },
        { key: "partyName", label: "Party" },
        { key: "partyType", label: "Type" },
        { key: "invoiceNo", label: "Invoice" },
        {
          key: "amount",
          label: "Amount Paid",
          render: (d) => (
            <span className="text-green-600 font-semibold">
              {formatCurrency(d.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          ),
        },
      ]}
      summaryCards={[
        { label: "Total Collected", value: formatCurrency(totalCollected), color: "#27ae60" },
        { label: "Payments", value: String(data.length), color: "#2980b9" },
      ]}
      searchKeys={["partyName", "invoiceNo"]}
      dateKey="date"
    />
  );
};

export default PaidDueHistory;
