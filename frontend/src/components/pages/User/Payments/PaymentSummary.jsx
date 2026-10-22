import React from "react";

const statusConfig = {
  "PENDING PAYMENT": {
    label: "PENDING PAYMENT",
    className: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  },
  "PARTIALLY PAID": {
    label: "PARTIALLY PAID",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  PAID: {
    label: "PAID",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  "FULLY PAID": {
    label: "PAID",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  OVERDUE: {
    label: "OVERDUE",
    className: "bg-red-100 text-red-700 border border-red-200",
  },
};

const SummaryCard = ({ label, value, subtext, highlight }) => (
  <div className="flex-1 min-w-0">
    <p className="text-xs text-gray-500 font-medium mb-2">{label}</p>
    <p
      className={`text-xl font-bold truncate ${
        highlight === "green"
          ? "text-teal-600"
          : highlight === "orange"
          ? "text-orange-500"
          : "text-gray-900"
      }`}
    >
      {value}
    </p>
    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
  </div>
);

const PaymentSummary = ({
  totalAmount = "LKR 50,000.00",
  baseAmount,
  additionalCharges,
  paidAmount = "LKR 25,000.00",
  remainingAmount = "LKR 25,000.00",
  paymentStatus = "PENDING PAYMENT",
  paidSubtext = "50% of total",
  remainingSubtext = "50% remaining",
  nextPaymentNote = "Next payment due",
}) => {
  const status = statusConfig[paymentStatus] || statusConfig["PENDING PAYMENT"];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
        Payment Summary
      </p>
      <div className="flex gap-6 divide-x divide-gray-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium mb-2">Total Amount</p>
            <p className="text-xl font-bold truncate text-teal-600">{totalAmount}</p>
            {baseAmount && additionalCharges > 0 ? (
              <div className="mt-1 flex flex-col gap-0.5">
                <p className="text-xs text-gray-400">Base: LKR {baseAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-400">Additional: LKR {additionalCharges.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1">For this booking</p>
            )}
          </div>
        <div className="pl-6 flex-1 min-w-0">
          <SummaryCard
            label="Paid Amount"
            value={paidAmount}
            subtext={paidSubtext}
            highlight="green"
          />
        </div>
        <div className="pl-6 flex-1 min-w-0">
          <SummaryCard
            label="Remaining Amount"
            value={remainingAmount}
            subtext={remainingSubtext}
            highlight="orange"
          />
        </div>
        <div className="pl-6 flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium mb-2">
            Payment Status
          </p>
          <span
            className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${status.className}`}
          >
            {status.label}
          </span>
          <p className="text-xs text-gray-400 mt-2">{nextPaymentNote}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;