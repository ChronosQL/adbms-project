import { useState, useEffect } from "react";
import { Users, Briefcase, Car, Baby, Info } from "lucide-react";
import { categoryService } from "../../../../../services/vehicleService";

const DEFAULT_CATEGORIES = [
  { id: "mini_car",   name: "Mini Car",   label: "Mini Car",   passenger_capacity: 2, maxAdults: 2,  luggage_capacity: 2, maxLuggage: 2, desc: "2 adults, 2 luggage" },
  { id: "normal_car", name: "Normal Car", label: "Normal Car", passenger_capacity: 3, maxAdults: 3,  luggage_capacity: 3, maxLuggage: 3, desc: "3 adults, 3 luggage" },
  { id: "sedan_car",  name: "Sedan Car",  label: "Sedan Car",  passenger_capacity: 3, maxAdults: 3,  luggage_capacity: 3, maxLuggage: 3, desc: "3 adults, 3 luggage" },
  { id: "mpv",        name: "MPV",        label: "MPV",        passenger_capacity: 4, maxAdults: 4,  luggage_capacity: 4, maxLuggage: 4, desc: "4 adults, 4 luggage" },
  { id: "suv",        name: "SUV",        label: "SUV",        passenger_capacity: 3, maxAdults: 3,  luggage_capacity: 3, maxLuggage: 3, desc: "3 adults, 3 luggage" },
  { id: "mini_van",   name: "Mini Van",   label: "Mini Van",   passenger_capacity: 4, maxAdults: 4,  luggage_capacity: 5, maxLuggage: 5, desc: "4 adults, 5 luggage" },
  { id: "van",        name: "Van",        label: "Van",        passenger_capacity: 6, maxAdults: 6,  luggage_capacity: 6, maxLuggage: 6, desc: "6 adults, 6 luggage" },
  { id: "large_van",  name: "Large Van",  label: "Large Van",  passenger_capacity: 12, maxAdults: 12, luggage_capacity: 10, maxLuggage: 10, desc: "12 adults, 10 luggage" },
];

const LUGGAGE_WEIGHTS = [
  { key: "luggage10kg",     label: "10 kg",      desc: "Small backpack / day bag",     icon: "🎒" },
  { key: "luggage25kg",     label: "25 kg",      desc: "Standard check-in suitcase",   icon: "🧳" },
  { key: "luggage35kg",     label: "35 kg",      desc: "Large check-in suitcase",      icon: "🧳" },
];

const inputClass =
  "w-full px-4 py-3 bg-white border border-[#EF8354]/15 rounded-xl text-[#2D3142] text-sm outline-none transition-all focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20";

const CounterInput = ({ value, onChange, min = 0 }) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      className="w-8 h-8 rounded-lg border border-[#EF8354]/15 flex items-center justify-center text-[#2D3142]/70 hover:bg-slate-100 transition-colors cursor-pointer font-bold text-lg select-none"
    >
      −
    </button>
    <span className="w-8 text-center text-sm font-bold text-[#2D3142]">{value}</span>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      className="w-8 h-8 rounded-lg border border-[#EF8354]/15 flex items-center justify-center text-[#2D3142]/70 hover:bg-slate-100 transition-colors cursor-pointer font-bold text-lg select-none"
    >
      +
    </button>
  </div>
);

const BookingPassengersStep = ({ data, onChange }) => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingCategories(true);
    categoryService.getAll()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.categories || [];
        if (list.length > 0) {
          const merged = list.map((cat) => {
            const def = DEFAULT_CATEGORIES.find(
              (d) => d.name?.toLowerCase() === cat.name?.toLowerCase() || d.id === cat.id
            );
            return {
              ...cat,
              id: cat.id || def?.id,
              name: cat.name || def?.name || "Vehicle Category",
              passenger_capacity: Number(cat.passenger_capacity) || def?.passenger_capacity || 4,
              luggage_capacity: Number(cat.luggage_capacity) || def?.luggage_capacity || 4,
              image_url: cat.image_url || (Array.isArray(cat.images) ? cat.images[0] : null) || null,
            };
          });
          setCategories(merged);
        }
      })
      .catch((err) => {
        console.warn("Failed to load vehicle categories from DB, using defaults:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingCategories(false);
      });

    return () => { isMounted = false; };
  }, []);

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

  const totalPassengers = (Number(data.noOfAdults) || 1) + (Number(data.noOfChildren) || 0);

  // Filter vehicle categories by passenger count: less passenger capacity vehicles are filtered out
  const availableCategories = categories.filter((cat) => {
    const cap = Number(cat.passenger_capacity) || Number(cat.maxAdults) || 99;
    return cap >= totalPassengers;
  });

  // If currently selected category is filtered out, select first available or keep in sync
  useEffect(() => {
    if (availableCategories.length > 0 && data.categoryId) {
      const isStillAvailable = availableCategories.some(
        (c) => c.id === data.categoryId || c.name === data.categoryId
      );
      if (!isStillAvailable) {
        onChange("categoryId", availableCategories[0].id || availableCategories[0].name);
      }
    }
  }, [totalPassengers, availableCategories.length]);

  const hasCustomWeight = Boolean(
    data.hasCustomWeight ||
    (data.luggageCustomCount || 0) > 0 ||
    data.luggageCustomWeight
  );

  const totalLuggage =
    (data.luggage10kg || 0) +
    (data.luggage25kg || 0) +
    (data.luggage35kg || 0) +
    (hasCustomWeight ? 1 : 0);

  return (
    <div className="space-y-6">

      {/* ── Passengers ── */}
      <div>
        <h3 className="text-lg font-bold text-[#2D3142] mb-1 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#EF8354]" /> {"Passengers"}
        </h3>
        <p className="text-sm text-[#4F5D75] mb-4">{"Tell us how many people will be travelling."}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Adults */}
          <div className="flex items-center justify-between bg-white border border-[#EF8354]/15 rounded-xl px-4 py-3 shadow-xs">
            <div>
              <p className="text-sm font-semibold text-[#2D3142]">{"Adults"}</p>
              <p className="text-xs text-[#4F5D75]">{"Age 18+"}</p>
            </div>
            <CounterInput
              value={data.noOfAdults || 1}
              onChange={(v) => onChange("noOfAdults", v)}
              min={1}
            />
          </div>

          {/* Children */}
          <div className="flex items-center justify-between bg-white border border-[#EF8354]/15 rounded-xl px-4 py-3 shadow-xs">
            <div>
              <p className="text-sm font-semibold text-[#2D3142]">{"Children"}</p>
              <p className="text-xs text-[#4F5D75]">{"Age 0–17"}</p>
            </div>
            <CounterInput
              value={data.noOfChildren || 0}
              onChange={(v) => {
                onChange("noOfChildren", v);
                if (v === 0) {
                  onChange("agesOfChildren", "");
                  onChange("babySeatNeeded", false);
                } else {
                  const cur = data.agesOfChildren ? data.agesOfChildren.split(",").map((a) => a.trim()) : [];
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
                  const ages = data.agesOfChildren ? data.agesOfChildren.split(",").map((a) => a.trim()) : [];
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-[#4F5D75] uppercase tracking-wider">{"Child"} {i + 1}</span>
                      <input
                        type="number"
                        min="0"
                        max="17"
                        value={ages[i] || ""}
                        placeholder={"Age"}
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
                  <input
                    type="checkbox"
                    checked={data.babySeatNeeded || false}
                    onChange={(e) => onChange("babySeatNeeded", e.target.checked)}
                    className="sr-only"
                  />
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
                  <p className="text-xs text-[#4F5D75]">{"Tick if you need a baby seat. We provide baby seats for children under 5 years old."}</p>
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
        <p className="text-sm text-[#4F5D75] mb-4">
          {"Enter the number of bags per weight category. This helps us assign the right vehicle."}
        </p>

        <div className="space-y-3">
          {LUGGAGE_WEIGHTS.map(({ key, label, desc, icon }) => (
            <div key={key} className="flex items-center justify-between bg-white border border-[#EF8354]/15 rounded-xl px-4 py-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[#2D3142]">{label}</p>
                  <p className="text-xs text-[#4F5D75]">{desc}</p>
                </div>
              </div>
              <CounterInput
                value={data[key] || 0}
                onChange={(v) => onChange(key, v)}
              />
            </div>
          ))}

          {/* Custom weight - Radio button controlled */}
          <div className={`bg-white border rounded-xl p-4 transition-all shadow-xs ${
            hasCustomWeight
              ? "border-[#EF8354] ring-2 ring-[#EF8354]/20"
              : "border-[#EF8354]/15 hover:border-[#EF8354]/30"
          }`}>
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EF8354]/10 flex items-center justify-center flex-shrink-0 text-xl">
                  ⚖️
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2D3142]">{"Custom Weight"}</p>
                  <p className="text-xs text-[#4F5D75]">{"Oversized or special luggage items"}</p>
                </div>
              </div>

              {/* Radio button selection without increment button */}
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="customLuggageToggle"
                  checked={hasCustomWeight}
                  onChange={() => {
                    const next = !hasCustomWeight;
                    onChange("hasCustomWeight", next);
                    onChange("luggageCustomCount", next ? 1 : 0);
                    if (!next) {
                      onChange("luggageCustomWeight", "");
                      onChange("luggageCustomDesc", "");
                    }
                  }}
                  onClick={(e) => {
                    if (hasCustomWeight) {
                      e.preventDefault();
                      onChange("hasCustomWeight", false);
                      onChange("luggageCustomCount", 0);
                      onChange("luggageCustomWeight", "");
                      onChange("luggageCustomDesc", "");
                    }
                  }}
                  className="w-5 h-5 accent-[#EF8354] cursor-pointer"
                />
              </div>
            </label>

            {hasCustomWeight && (
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D3142] mb-1">
                    {"Weight in kg *"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={data.luggageCustomWeight || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange("luggageCustomWeight", val);
                      onChange("luggageCustomCount", 1);
                    }}
                    placeholder="e.g. 18"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3142] mb-1">
                    {"Description of custom luggage *"}
                  </label>
                  <input
                    type="text"
                    value={data.luggageCustomDesc || ""}
                    onChange={(e) => onChange("luggageCustomDesc", e.target.value)}
                    placeholder="e.g. Surfboard, Bicycle, Golf bag"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Total summary */}
        {totalLuggage > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#2D3142] bg-[#EF8354]/10 border border-[#EF8354]/20 rounded-xl px-4 py-2.5">
            <Info className="w-4 h-4 text-[#EF8354] flex-shrink-0" />
            Total: <span className="font-bold text-[#2D3142]">{totalLuggage}</span> piece(s) of luggage
            {data.luggage10kg > 0 && ` · ${data.luggage10kg}×10kg`}
            {data.luggage25kg > 0 && ` · ${data.luggage25kg}×25kg`}
            {data.luggage35kg > 0 && ` · ${data.luggage35kg}×35kg`}
            {hasCustomWeight && ` · 1×custom (${data.luggageCustomWeight ? `${data.luggageCustomWeight}kg` : "custom"})`}
          </div>
        )}
      </div>

      {/* ── Vehicle Category ── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-[#2D3142] flex items-center gap-2">
            <Car className="w-5 h-5 text-[#EF8354]" /> {"Preferred Vehicle Category *"}
          </h3>
          <span className="text-xs font-semibold text-[#EF8354] bg-[#EF8354]/10 px-2.5 py-1 rounded-full">
            Fits {totalPassengers} passenger{totalPassengers > 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-sm text-[#4F5D75] mb-4">
          {"Select your preferred vehicle category. Categories with insufficient passenger capacity are automatically filtered out."}
        </p>

        {loadingCategories ? (
          <div className="flex items-center justify-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="animate-spin w-5 h-5 border-2 border-[#EF8354] border-t-transparent rounded-full inline-block mr-2" />
            <span className="text-sm text-[#4F5D75]">Loading vehicle categories...</span>
          </div>
        ) : availableCategories.length === 0 ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
            <p className="text-sm font-semibold text-amber-800">
              No vehicles available for {totalPassengers} passengers.
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Please adjust your passenger count or contact us for customized group bookings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {availableCategories.map((cat) => {
              const isSelected = data.categoryId === cat.id || data.categoryId === cat.name;
              const hasImage = Boolean(cat.image_url);

              return (
                <button
                  key={cat.id || cat.name}
                  type="button"
                  onClick={() => onChange("categoryId", cat.id || cat.name)}
                  className={`flex flex-col items-center p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer group ${
                    isSelected
                      ? "border-[#EF8354] bg-[#EF8354]/8 shadow-md shadow-[#EF8354]/15 ring-2 ring-[#EF8354]"
                      : "border-slate-200 hover:border-[#EF8354]/40 bg-white hover:bg-[#EF8354]/5"
                  }`}
                >
                  {hasImage ? (
                    <div className="w-full h-24 mb-2 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ) : (
                    <div className={`w-14 h-14 mb-2 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected ? "bg-[#EF8354] text-white" : "bg-[#EF8354]/10 text-[#EF8354]"
                    }`}>
                      <Car className="w-7 h-7" />
                    </div>
                  )}

                  <span className={`text-xs font-bold transition-colors ${
                    isSelected ? "text-[#EF8354]" : "text-[#2D3142]"
                  }`}>
                    {cat.name || cat.label}
                  </span>
                  <span className="text-[10px] text-[#4F5D75] mt-1 font-medium">
                    {cat.passenger_capacity || cat.maxAdults} adults · {cat.luggage_capacity || cat.maxLuggage} bags
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPassengersStep;
