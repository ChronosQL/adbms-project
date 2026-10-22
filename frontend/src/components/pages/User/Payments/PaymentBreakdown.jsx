import React from "react";
import { CheckCircle, Clock, Eye } from "lucide-react";

const StatusBadge = ({ status }) => {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
        <CheckCircle size={11} />
        PAID
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
        <Clock size={11} />
        PENDING
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
      OVERDUE
    </span>
  );
};

const InstallmentRow = ({ installment, onViewDetails, onPayNow }) => {
  const isPaid = installment.status === "PAID";
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Number */}
      <td className="py-4 pr-4">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold ${
            isPaid ? "bg-teal-500" : "bg-yellow-400"
          }`}
        >
          {installment.number}
        </span>
      </td>

      {/* Type */}
      <td className="py-4 pr-6">
        <p className="text-sm font-semibold text-gray-800">{installment.type}</p>
        <p className="text-xs text-gray-400">{installment.typeLabel}</p>
      </td>

      {/* Amount */}
      <td className="py-4 pr-6">
        <p className="text-sm font-medium text-gray-800">{installment.amount}</p>
      </td>

      {/* Due Date */}
      <td className="py-4 pr-6">
        <p className="text-sm text-gray-800">{installment.dueDate}</p>
        <p className="text-xs text-gray-400">{installment.dueDateNote}</p>
      </td>

      {/* Status */}
      <td className="py-4 pr-6">
        <StatusBadge status={installment.status} />
        <p className="text-xs text-gray-400 mt-1">{installment.statusNote}</p>
      </td>

      {/* Action */}
      <td className="py-4 text-right">
        {isPaid ? (
          <button
            onClick={() => onViewDetails?.(installment)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Eye size={12} />
            View Details
          </button>
        ) : (
          <button
            onClick={() => onPayNow?.(installment)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-teal-500 hover:bg-teal-600 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            Pay Now
          </button>
        )}
      </td>
    </tr>
  );
};

const PaymentBreakdown = ({
  installments = [],
  onViewDetails,
  onPayNow,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
        Payment Breakdown
      </p>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-4">
              Installment
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-6">
              Type
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-6">
              Amount
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-6">
              Due Date
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-6">
              Status
            </th>
            <th className="text-right text-xs font-semibold text-gray-400 pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {installments.map((item) => (
            <InstallmentRow
              key={item.id}
              installment={item}
              onViewDetails={onViewDetails}
              onPayNow={onPayNow}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentBreakdown;