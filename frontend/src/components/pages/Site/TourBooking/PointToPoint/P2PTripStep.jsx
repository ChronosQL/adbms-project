import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Calendar, Clock, Search, X } from "lucide-react";
import { SRI_LANKA_LOCATIONS } from "./sriLankaLocations.js";

const inputClass =
  "w-full px-4 py-3 bg-white border border-[#EF8354]/15 rounded-xl text-[#2D3142] text-sm outline-none transition-all focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20";

// ─── Keyboard-accessible Location Input ───────────────────────────────────────
// - No category grouping: flat list so users can navigate with arrow keys
// - Keyboard: ArrowDown/Up moves highlight, Enter selects, Escape closes
// - Free-type is allowed: if user types a custom location and presses Enter
//   with nothing highlighted, the typed value is accepted as-is
const LocationInput = ({ value, onChange, placeholder, pinColor, id }) => {
  const [query,     setQuery]     = useState(value || "");
  const [open,      setOpen]      = useState(false);
  const [results,   setResults]   = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);

  const containerRef = useRef(null);
  const listRef      = useRef(null);
  const inputRef     = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync if parent value changes (e.g. clear)
  useEffect(() => { setQuery(value || ""); }, [value]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current || activeIdx < 0) return;
    const item = listRef.current.children[activeIdx];
    if (item) item.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const search = useCallback((val) => {
    setQuery(val);
    onChange(val);
    if (!val.trim()) { setResults([]); setOpen(false); setActiveIdx(-1); return; }
    const q   = val.toLowerCase();
    const res = SRI_LANKA_LOCATIONS.filter(loc =>
      loc.toLowerCase().includes(q)
    ).slice(0, 15);
    setResults(res);
    setOpen(res.length > 0);
    setActiveIdx(-1);
  }, [onChange]);

  const select = useCallback((loc) => {
    setQuery(loc);
    onChange(loc);
    setOpen(false);
    setResults([]);
    setActiveIdx(-1);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = (e) => {
    if (!open && e.key !== "ArrowDown") return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open && results.length > 0) { setOpen(true); return; }
        setActiveIdx(i => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIdx >= 0 && results[activeIdx]) {
          select(results[activeIdx]);
        } else if (query.trim()) {
          // Accept free-typed value as-is
          onChange(query.trim());
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIdx(-1);
        break;
      case "Tab":
        // Accept highlighted item on Tab if one is active
        if (activeIdx >= 0 && results[activeIdx]) {
          select(results[activeIdx]);
        }
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const clear = () => {
    setQuery("");
    onChange("");
    setResults([]);
    setOpen(false);
    setActiveIdx(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${pinColor}`} />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-activedescendant={activeIdx >= 0 ? `${id}-opt-${activeIdx}` : undefined}
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${inputClass} pl-9 pr-9`}
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]/70 hover:text-[#2D3142]/70"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
        )}
      </div>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          id={`${id}-listbox`}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EF8354]/15 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto py-1"
        >
          {results.map((loc, i) => (
            <li
              key={loc}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={e => { e.preventDefault(); select(loc); }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                i === activeIdx
                  ? "bg-[#EF8354]/8 text-[#EF8354]"
                  : "text-[#2D3142] hover:bg-[#BFC0C0]"
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${i === activeIdx ? "text-[#EF8354]" : "text-slate-300"}`} />
              <span>{loc}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── Main Trip Step ────────────────────────────────────────────────────────────
const P2PTripStep = ({ data, onChange }) => {
  
  const today = new Date().toISOString().split("T")[0];

  const handleDate = (val) => {
    onChange("startDate",    val);
    onChange("endDate",      val);
    onChange("totalDays",    1);
    onChange("daysRequired", 1);
  };

  return (
    <div className="space-y-6">

      {/* ── Locations ── */}
      <div>
        <h3 className="text-lg font-bold text-[#2D3142] mb-1 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#EF8354]" /> {"Trip Locations"}
        </h3>
        <p className="text-sm text-[#6B7280] mb-4">
          {"Type to search — use ↑ ↓ to navigate, Enter to select, Esc to close. You can also type a custom location name."}
        </p>

        <div className="space-y-4">
          {/* Pickup */}
          <div>
            <label htmlFor="pickup-location" className="block text-sm font-semibold text-[#2D3142] mb-1">
              {"Pickup Location *"}
            </label>
            <LocationInput
              id="pickup-location"
              value={data.startLocation}
              onChange={val => onChange("startLocation", val)}
              placeholder={"Search airport, city, hotel area…"}
              pinColor="text-[#EF8354]"
            />
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-3 px-3">
            <div className="flex-1 h-px bg-slate-200" />
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#EF8354]/10 flex items-center justify-center">
                <span className="text-[#EF8354] text-lg">↓</span>
              </div>
              <span className="text-xs text-[#6B7280]/70">{"One way"}</span>
            </div>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Drop-off */}
          <div>
            <label htmlFor="dropoff-location" className="block text-sm font-semibold text-[#2D3142] mb-1">
              {"Drop-off Location *"}
            </label>
            <LocationInput
              id="dropoff-location"
              value={data.endLocation}
              onChange={val => onChange("endLocation", val)}
              placeholder={"Search tourist spot, city, beach…"}
              pinColor="text-red-400"
            />
          </div>
        </div>
      </div>

      {/* ── Date & Time ── */}
      <div>
        <h3 className="text-lg font-bold text-[#2D3142] mb-1 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#EF8354]" /> {"Travel Date & Time"}
        </h3>
        <p className="text-sm text-[#6B7280] mb-4">
          {"Point-to-point is a one-day hire. Select your travel date and preferred pickup time."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="travel-date" className="block text-sm font-semibold text-[#2D3142] mb-1">
              {"Travel Date *"}
            </label>
            <input
              id="travel-date"
              type="date"
              min={today}
              value={data.startDate}
              onChange={e => handleDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="pickup-time" className="block text-sm font-semibold text-[#2D3142] mb-1 flex items-center gap-1">
              <Clock className="w-4 h-4" /> {"Preferred Pickup Time *"}
            </label>
            <input
              id="pickup-time"
              type="time"
              value={data.pickupTime}
              onChange={e => onChange("pickupTime", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {data.startDate && data.pickupTime && (
          <div className="mt-4 bg-[#EF8354]/8 border border-[#EF8354]/25 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EF8354]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-[#EF8354]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2D3142]">{"One-Day Transfer"}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {data.startDate} {data.pickupTime && `at ${data.pickupTime}`}
                {data.startLocation && data.endLocation &&
                  ` · ${data.startLocation} → ${data.endLocation}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default P2PTripStep;
