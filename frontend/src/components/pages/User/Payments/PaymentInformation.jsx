import React from "react";
import { Download } from "lucide-react";

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-400">{label}</span>
    <span className="text-xs font-semibold text-gray-700">{value}</span>
  </div>
);

const PaymentInformation = ({
  paymentMethod = "Bank Transfer",
  bankName = "Commercial Bank",
  accountNumber = "1234 5678 9012",
  accountName = "TechNova (Pvt) Ltd",
  onDownloadInvoice,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Payment Information
      </p>

      <div className="mb-4">
        <InfoRow label="Payment Method" value={paymentMethod} />
        <InfoRow label="Bank Name" value={bankName} />
        <InfoRow label="Account Number" value={accountNumber} />
        <InfoRow label="Account Name" value={accountName} />
      </div>

      <button
        onClick={onDownloadInvoice}
        className="inline-flex items-center gap-2 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-4 py-2 rounded-lg transition-colors w-full justify-center"
      >
        <Download size={13} />
        Download Invoice
      </button>
    </div>
  );
};

export default PaymentInformation;