import React from "react";
import { Eye } from "lucide-react";

const statusStyles = {
  "PENDING VERIFICATION": "text-yellow-600 bg-yellow-50 border border-yellow-200",
  VERIFIED: "text-green-600 bg-green-50 border border-green-200",
  REJECTED: "text-red-600 bg-red-50 border border-red-200",
};

const PaymentHistory = ({ transactions = [], onViewSlip }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
        Payment History
      </p>

      {transactions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No payment history available.
        </p>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              {["Tour ID", "Date", "Type", "Amount", "Method", "Status", "Actions"].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left text-xs font-semibold text-gray-400 pb-3 pr-4 last:text-right last:pr-0"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 pr-4 text-sm text-gray-500 font-mono">
                  {tx.tourId}
                </td>
                <td className="py-3 pr-4 text-sm text-gray-700 whitespace-nowrap">
                  {tx.date}
                </td>
                <td className="py-3 pr-4 text-sm font-medium text-gray-800">
                  {tx.type}
                </td>
                <td className="py-3 pr-4 text-sm text-gray-700">{tx.amount}</td>
                <td className="py-3 pr-4 text-sm text-gray-700">{tx.method}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      statusStyles[tx.status] || ""
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => onViewSlip?.(tx)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    <Eye size={13} />
                    View Slip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Footer help text */}
      <p className="text-xs text-gray-400 text-center mt-6">
        Need help with your payment?{" "}
        <a href="#" className="text-teal-600 font-semibold hover:underline">
          Contact our support team.
        </a>
      </p>
    </div>
  );
};

export default PaymentHistory;