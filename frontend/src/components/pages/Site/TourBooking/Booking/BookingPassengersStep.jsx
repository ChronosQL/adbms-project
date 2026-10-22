import { Users, Briefcase, Car, Baby, Info } from "lucide-react";
const VEHICLE_CATEGORIES = [
  { id: "mini_car",   label: "Mini Car",   desc: "2 adults, 2 luggage",  icon: "🚗", maxAdults: 2,  maxLuggage: 2 },
  { id: "normal_car", label: "Normal Car", desc: "3 adults, 3 luggage",  icon: "🚙", maxAdults: 3,  maxLuggage: 3 },
  { id: "sedan_car",  label: "Sedan Car",  desc: "3 adults, 3 luggage",  icon: "🚘", maxAdults: 3,  maxLuggage: 3 },
  { id: "mpv",        label: "MPV",        desc: "4 adults, 4 luggage",  icon: "🚐", maxAdults: 4,  maxLuggage: 4 },
  { id: "suv",        label: "SUV",        desc: "3 adults, 3 luggage",  icon: "🛻", maxAdults: 3,  maxLuggage: 3 },
  { id: "mini_van",   label: "Mini Van",   desc: "4 adults, 5 luggage",  icon: "🚌", maxAdults: 4,  maxLuggage: 5 },
  { id: "van",        label: "Van",        desc: "6 adults, 6 luggage", icon: "🚌", maxAdults: 6, maxLuggage: 6 },
  { id: "large_van",  label: "Large Van",  desc: "12 adults, 10 luggage", icon: "🚌", maxAdults: 12, maxLuggage: 10 },
];

// Weight categories
const LUGGAGE_WEIGHTS = [
  { key: "luggage10kg",     label: "10 kg",      desc: "Small backpack / day bag",     icon: "🎒" },
  { key: "luggage25kg",     label: "25 kg",      desc: "Standard check-in suitcase",   icon: "🧳" },
  { key: "luggage35kg",     label: "35 kg",      desc: "Large check-in suitcase",      icon: "🧳" },
];

const inputClass =
  "w-full px-4 py-3 bg-white border border-[#EF8354]/15 rounded-xl text-[#2D3142] text-sm outline-none transition-all focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20";

const CounterInput = ({ value, onChange, min = 0 }) => (
  <div className="flex items-center gap-2">
    <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
      className="w-8 h-8 rounded-lg border border-[#EF8354]/15 flex items-center justify-center text-[#2D3142]/70 hover:bg-[#BFC0C0] transition-colors cursor-pointer font-bold text-lg">
      −
    </button>
    <span className="w-8 text-center text-sm font-bold text-[#2D3142]">{value}</span>
    <button type="button" onClick={() => onChange(value + 1)}
      className="w-8 h-8 rounded-lg border border-[#EF8354]/15 flex items-center justify-center text-[#2D3142]/70 hover:bg-[#BFC0C0] transition-colors cursor-pointer font-bold text-lg">
      +
    </button>
  </div>
);

const BookingPassengersStep = ({ data, onChange }) => {
  const normalizeChildAge = (value) => {
    if (value === "" || value == null) return "";
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "";
    return String(Math.min(17, Math.max(0, Math.trunc(parsed))));
  };

  const handleChildAgeKeyDown = (event) => {
    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab"];
    if (allowedKeys.includes(event.key)) return;
    if (/^[0-9]$/.test(event.key)) return;
    event.preventDefault();
  };

  // Total luggage count for vehicle filter
  const totalLuggage =
    (data.luggage10kg  || 0) +
    (data.luggage25kg  || 0) +
    (data.luggage35kg  || 0) +
    (data.luggageCustomCount || 0);


  return (
    <div className="space-y-6">

      {/* ── Passengers ── */}
      <div>
        <h3 className="text-lg font-bold text-[#2D3142] mb-1 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#EF8354]" /> {"Passengers"}
        </h3>
        <p className="text-sm text-[#6B7280] mb-4">{"Tell us how many people will be travelling."}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Adults */}
          <div className="flex items-center justify-between bg-white border border-[#EF8354]/15 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#2D3142]">{"Adults"}</p>
              <p className="text-xs text-[#6B7280]/70">{"Age 18+"}</p>
            </div>
            <CounterInput
              value={data.noOfAdults || 1}
              onChange={(v) => onChange("noOfAdults", v)}
              min={1}
            />
          </div>

          {/* Children */}
          <div className="flex items-center justify-between bg-white border border-[#EF8354]/15 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#2D3142]">{"Children"}</p>
              <p className="text-xs text-[#6B7280]/70">{"Age 0–17"}</p>
            </div>
            <CounterInput
              value={data.noOfChildren || 0}
              onChange={(v) => {
                onChange("noOfChildren", v);
                if (v === 0) { onChange("agesOfChildren", ""); onChange("babySeatNeeded", false); }
                else {
                  const cur = data.agesOfChildren ? data.agesOfChildren.split(",").map(a => a.trim()) : [];
                  onChange("agesOfChildren", Array.from({ length: v }, (_, i) => cur[i] || "").join(","));
                }
              }}
            />
          </div>

          {/* Children ages */}
          {data.noOfChildren > 0 && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">{"Ages of Children *"}</label>
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: data.noOfChildren }, (_, i) => {
                  const ages = data.agesOfChildren ? data.agesOfChildren.split(",").map(a => a.trim()) : [];
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-[#6B7280]/70 uppercase tracking-wider">{"Child"} {i + 1}</span>
                      <input type="number" min="0" max="17" value={ages[i] || ""} placeholder={"Age"}
                        onKeyDown={handleChildAgeKeyDown}
                        onChange={(e) => {
                          const updated = Array.from({ length: data.noOfChildren }, (_, j) =>
                            j === i ? normalizeChildAge(e.target.value) : (ages[j] || "")
                          );
                          onChange("agesOfChildren", updated.join(","));
                        }}
                        className="w-16 text-center px-2 py-2.5 bg-white border border-[#EF8354]/15 rounded-xl text-[#2D3142] text-sm outline-none focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Baby Seat */}
          {data.noOfChildren > 0 && (
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div className="relative">
                  <input type="checkbox" checked={data.babySeatNeeded || false}
                    onChange={(e) => onChange("babySeatNeeded", e.target.checked)} className="sr-only" />
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    data.babySeatNeeded ? "bg-[#EF8354] border-[#EF8354]" : "border-[#EF8354]/25 bg-white group-hover:border-[#EF8354]"
                  }`}>
                    {data.babySeatNeeded && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2D3142] flex items-center gap-1">
                    <Baby className="w-4 h-4 text-[#EF8354]" /> {"Baby Seat Required"}
                  </p>
                  <p className="text-xs text-[#6B7280]/70">{"Tick if you needs a baby seat, Kindly note we provide baby seats for children under 5 years old."}</p>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ── Luggage by Weight ── */}
      <div>
        <h3 className="text-lg font-bold text-[#2D3142] mb-1 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#EF8354]" /> {"Luggage"}
        </h3>
        <p className="text-sm text-[#6B7280] mb-4">
          {"Enter the number of bags per weight category. This helps us assign the right vehicle."}
        </p>

        <div className="space-y-3">
          {LUGGAGE_WEIGHTS.map(({ key, label, desc, icon }) => (
            <div key={key} className="flex items-center justify-between bg-white border border-[#EF8354]/15 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[#2D3142]">{label}</p>
                  <p className="text-xs text-[#6B7280]/70">{desc}</p>
                </div>
              </div>
              <CounterInput
                value={data[key] || 0}
                onChange={(v) => onChange(key, v)}
              />
            </div>
          ))}

          {/* Custom weight */}
          <div className="bg-white border border-[#EF8354]/15 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚖️</span>
                <div>
                  <p className="text-sm font-semibold text-[#2D3142]">{"Custom Weight"}</p>
                  <p className="text-xs text-[#6B7280]/70">{"Oversized or special luggage"}</p>
                </div>
              </div>
              <CounterInput
                value={data.luggageCustomCount || 0}
                onChange={(v) => onChange("luggageCustomCount", v)}
              />
            </div>
            {(data.luggageCustomCount || 0) > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#2D3142]/70 mb-1">
                  {"Describe your custom luggage *"}
                </label>
                <input
                  type="text"
                  value={data.luggageCustomDesc || ""}
                  onChange={(e) => onChange("luggageCustomDesc", e.target.value)}
                  placeholder={"E.g. surfboard 8kg, bicycle 15kg, golf bag 20kg"}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </div>

        {/* Total summary */}
        {totalLuggage > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#6B7280] bg-[#BFC0C0] rounded-xl px-4 py-2.5">
            <Info className="w-4 h-4 text-[#EF8354] flex-shrink-0" />
            Total: <span className="font-bold text-[#2D3142]">{totalLuggage}</span> piece(s) of luggage
            {data.luggage10kg  > 0 && ` · ${data.luggage10kg}×10kg`}
            {data.luggage25kg  > 0 && ` · ${data.luggage25kg}×25kg`}
            {data.luggage35kg  > 0 && ` · ${data.luggage35kg}×35kg`}
            {data.luggageCustomCount > 0 && ` · ${data.luggageCustomCount}×custom`}
          </div>
        )}
      </div>

      {/* ── Vehicle Category ── */}
      <div>
        <h3 className="text-lg font-bold text-[#2D3142] mb-1 flex items-center gap-2">
          <Car className="w-5 h-5 text-[#EF8354]" /> {"Preferred Vehicle Category *"}
        </h3>
        <p className="text-sm text-[#6B7280] mb-4">
          {"Select your preferred vehicle category. Our team will assign the actual vehicle after confirmation."}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VEHICLE_CATEGORIES.map((cat) => (
              <button key={cat.id} type="button" onClick={() => onChange("categoryId", cat.id)}
                className={`flex flex-col items-center p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  data.categoryId === cat.id
                    ? "border-[#EF8354] bg-[#EF8354]/5 shadow-md shadow-[#EF8354]/10"
                    : "border-[#EF8354]/15 hover:border-[#EF8354]/25 bg-white"
                }`}>
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className={`text-xs font-bold ${data.categoryId === cat.id ? "text-[#EF8354]" : "text-[#2D3142]"}`}>
                  {cat.label}
                </span>
                <span className="text-[10px] text-[#6B7280]/70 mt-0.5">{cat.desc}</span>
              </button>
            ))}
          </div>
      </div>
    </div>
  );
};

export default BookingPassengersStep;
