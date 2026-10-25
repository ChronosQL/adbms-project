import React, { useState, useRef } from "react";
import { Banknote, Building2, CheckCircle, UploadCloud, Upload, Info, AlertTriangle } from "lucide-react";

const UploadedBanner = ({ message, subtext }) => (
  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
    <div>
      <p className="text-sm font-semibold text-green-700">{message}</p>
      <p className="text-xs text-green-600">{subtext}</p>
    </div>
  </div>
);

const PaymentProof = ({
  uploadedMessage = "Deposit payment uploaded",
  uploadedSubtext = "Your payment proof is under verification by admin.",
  uploadLabel = "Upload Payment Slip",
  uploadSublabel = "(For Final Payment)",
  onUpload,
  amount = "",
  maxAmount = 0,
  paymentMethod = "",
  onPaymentMethodChange = () => {},
  onAmountChange = () => {},
  submitting = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [warning, setWarning] = useState("");
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setWarning("");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setWarning("");
    }
  };

  const handleSubmit = () => {
    const numAmount = Number(amount);
    if (!paymentMethod) {
      setWarning("Please select a payment method (Cash or Bank Transfer).");
      return;
    }
    if (paymentMethod === "BANK_TRANSFER" && !selectedFile) {
      setWarning("Please upload a bank slip or transfer confirmation receipt.");
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setWarning("Please enter a valid payment amount greater than zero.");
      return;
    }
    if (numAmount > maxAmount) {
      setWarning(
        `Warning: The entered amount (LKR ${numAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}) exceeds the remaining payable balance of LKR ${Number(maxAmount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}. Please enter an amount equal to or less than the remaining balance.`
      );
      return;
    }
    setWarning("");
    if (onUpload) onUpload({ file: selectedFile, notes });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
        Make a Payment
      </p>

      {/* Uploaded Banner */}
      {uploadedMessage && (
        <UploadedBanner message={uploadedMessage} subtext={uploadedSubtext} />
      )}

      <p className="text-sm font-semibold text-gray-700 mb-3">Choose a method for this payment</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          aria-pressed={paymentMethod === "CASH"}
          onClick={() => onPaymentMethodChange("CASH")}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF8354] ${paymentMethod === "CASH" ? "border-[#EF8354] bg-[#EF8354]/5" : "border-gray-200 hover:border-[#EF8354]/60"}`}
        >
          <Banknote size={18} className={paymentMethod === "CASH" ? "text-[#EF8354]" : "text-gray-500"} />
          <span className="text-sm font-semibold text-gray-800">Cash</span>
        </button>
        <button
          type="button"
          aria-pressed={paymentMethod === "BANK_TRANSFER"}
          onClick={() => onPaymentMethodChange("BANK_TRANSFER")}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF8354] ${paymentMethod === "BANK_TRANSFER" ? "border-[#EF8354] bg-[#EF8354]/5" : "border-gray-200 hover:border-[#EF8354]/60"}`}
        >
          <Building2 size={18} className={paymentMethod === "BANK_TRANSFER" ? "text-[#EF8354]" : "text-gray-500"} />
          <span className="text-sm font-semibold text-gray-800">Bank Transfer</span>
        </button>
      </div>

      <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="payment-amount">Amount to pay (LKR)</label>
      <input
        id="payment-amount"
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={(e) => {
          onAmountChange(e.target.value);
          if (warning && Number(e.target.value) <= maxAmount) {
            setWarning("");
          }
        }}
        className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF8354] mb-2 ${
          Number(amount) > maxAmount ? "border-amber-400 bg-amber-50/30" : "border-gray-200"
        }`}
      />
      <p className="text-xs text-gray-500 mb-3">Available to submit now: LKR {Number(maxAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>

      {Number(amount) > maxAmount && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-4 -mt-1">
          <AlertTriangle size={14} className="shrink-0 text-amber-600" />
          <span>Amount exceeds remaining balance of LKR {Number(maxAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
        </div>
      )}

      {paymentMethod === "BANK_TRANSFER" ? <>
      <p className="text-sm font-semibold text-gray-700 mb-3">{uploadLabel} <span className="font-normal text-gray-400">{uploadSublabel}</span></p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors mb-3 ${
          dragOver
            ? "border-[#EF8354] bg-orange-50"
            : selectedFile
            ? "border-green-400 bg-green-50"
            : "border-gray-200 bg-gray-50 hover:border-[#EF8354] hover:bg-orange-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <UploadCloud size={32} className="text-gray-400 mb-3" />
        {selectedFile ? (
          <p className="text-sm font-medium text-green-600">
            {selectedFile.name}
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Click to upload</span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP, PDF up to 5MB</p>
          </>
        )}
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
        <Info size={13} />
        <span>Please upload a clear bank slip or transfer confirmation.</span>
      </div>
      </> : paymentMethod === "CASH" ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5 text-xs text-amber-800">
          <Info size={15} className="mt-0.5 shrink-0" />
          <span>Submit the cash amount you paid. It will appear as pending until an administrator verifies it.</span>
        </div>
      ) : null}

      {/* Notes */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Notes{" "}
          <span className="font-normal text-gray-400">(Optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about your payment..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#EF8354]/40 transition"
        />
      </div>

      {/* Warning Alert */}
      {warning && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 mb-4 text-xs font-semibold text-amber-900 shadow-xs">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-800">Payment Warning</p>
            <p className="mt-0.5 text-amber-700">{warning}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
          paymentMethod && (paymentMethod === "CASH" || selectedFile)
            ? "bg-[#EF8354] text-white hover:bg-[#df7243] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#EF8354]"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        } ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <Upload size={15} />
        Submit {paymentMethod === "CASH" ? "Cash Payment Claim" : "Bank Transfer"}
      </button>
    </div>
  );
};

export default PaymentProof;
