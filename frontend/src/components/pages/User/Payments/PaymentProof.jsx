import React, { useState, useRef } from "react";
import { CheckCircle, UploadCloud, Upload, Info } from "lucide-react";

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
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (onUpload) onUpload({ file: selectedFile, notes });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
        Payment Proof
      </p>

      {/* Uploaded Banner */}
      {uploadedMessage && (
        <UploadedBanner message={uploadedMessage} subtext={uploadedSubtext} />
      )}

      {/* Upload Area */}
      <p className="text-sm font-semibold text-gray-700 mb-3">
        {uploadLabel}{" "}
        <span className="font-normal text-gray-400">{uploadSublabel}</span>
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors mb-3 ${
          dragOver
            ? "border-teal-400 bg-teal-50"
            : selectedFile
            ? "border-green-400 bg-green-50"
            : "border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-teal-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
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
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 5MB</p>
          </>
        )}
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
        <Info size={13} />
        <span>Please upload a clear bank slip or payment screenshot.</span>
      </div>

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
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedFile}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          selectedFile
            ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Upload size={15} />
        Upload Payment Proof
      </button>
    </div>
  );
};

export default PaymentProof;