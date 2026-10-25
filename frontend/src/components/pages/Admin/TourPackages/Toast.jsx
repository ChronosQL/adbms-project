import React from "react";

export default function Toast({ message, visible }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
      }`}
      style={{ background: "#2D3142", color: "#fff", border: "1px solid #EF8354" }}
    >
      <div className="w-5 h-5 rounded-full bg-[#EF8354] flex items-center justify-center text-white text-xs font-bold">
        ✓
      </div>
      <span>{message}</span>
    </div>
  );
}
