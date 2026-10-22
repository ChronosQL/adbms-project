import { useState, useRef, useEffect } from "react";
import { MapPin, Search, X, ChevronDown } from "lucide-react";
import { SRI_LANKA_LOCATIONS } from "./sriLankaLocations.js";
 
const CATEGORY_ICONS = {
  "Airport":       "✈️",
  "Port":          "🚢",
  "City":          "🏙️",
  "Tourist Spot":  "🏛️",
  "Train Station": "🚂",
  "Colombo":       "📍",
  "Hotel Area":    "🏨",
};
 
const LocationSearch = ({ value, onChange, placeholder, pinColor = "text-[#EF8354]" }) => {
  const [query, setQuery]       = useState(value || "");
  const [open, setOpen]         = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref                     = useRef(null);
 
  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
 
  // Sync if parent value changes
  useEffect(() => { setQuery(value || ""); }, [value]);
 
  const handleSearch = (val) => {
    setQuery(val);
    onChange(val);
    if (val.trim().length < 1) {
      setFiltered([]);
      setOpen(false);
      return;
    }
    const q = val.toLowerCase();
    const results = SRI_LANKA_LOCATIONS.filter(loc =>
      loc.label.toLowerCase().includes(q)
    ).slice(0, 10);
    setFiltered(results);
    setOpen(results.length > 0);
  };
 
  const handleSelect = (loc) => {
    setQuery(loc.label);
    onChange(loc.label);
    setOpen(false);
    setFiltered([]);
  };
 
  const handleClear = () => {
    setQuery("");
    onChange("");
    setFiltered([]);
    setOpen(false);
  };
 
  // Group results by category
  const grouped = filtered.reduce((acc, loc) => {
    if (!acc[loc.category]) acc[loc.category] = [];
    acc[loc.category].push(loc);
    return acc;
  }, {});
 
  return (
    <div ref={ref} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${pinColor} flex-shrink-0`} />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => { if (filtered.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm outline-none transition-all focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20"
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        )}
      </div>
 
      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
          {Object.entries(grouped).map(([category, locations]) => (
            <div key={category}>
              {/* Category Header */}
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 sticky top-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {CATEGORY_ICONS[category]} {category}
                </span>
              </div>
              {/* Locations */}
              {locations.map((loc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-[#EF8354]/5 hover:text-[#EF8354] transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  {loc.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
 
export default LocationSearch;
 
