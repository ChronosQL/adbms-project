import React from "react";
import { Bell, AlertCircle } from "lucide-react";

const ReminderCard = ({ type = "warning", children }) => {
  const styles = {
    warning: {
      wrapper: "bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3",
      icon: <AlertCircle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />,
      text: "text-sm font-medium text-orange-700",
    },
    info: {
      wrapper: "bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3",
      icon: <Bell size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />,
      text: "text-sm text-blue-700",
    },
  };
  const s = styles[type];
  return (
    <div className={s.wrapper}>
      {s.icon}
      <p className={s.text}>{children}</p>
    </div>
  );
};

const PaymentReminders = ({ reminders = [] }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Payment Reminders
      </p>
      <div className="flex flex-col gap-3">
        {reminders.map((r, i) => (
          <ReminderCard key={i} type={r.type}>
            {r.message}
          </ReminderCard>
        ))}
      </div>
    </div>
  );
};

export default PaymentReminders;