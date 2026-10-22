import { useState, useContext } from "react";
import {
  Phone, FileText, ChevronDown, AlertCircle,
  UserPlus, CheckCircle2, Plus, X,
} from "lucide-react";
import { AuthContext } from "../../../../../context/AuthContext";

// ── Country codes with min/max rules ─────────────────────────────────────────
const COUNTRIES = [
  { code: "+94",  flag: "🇱🇰", name: "Sri Lanka",    minLen: 9,  maxLen: 9  },
  { code: "+1",   flag: "🇺🇸", name: "USA/Canada",   minLen: 10, maxLen: 10 },
  { code: "+44",  flag: "🇬🇧", name: "UK",           minLen: 10, maxLen: 10 },
  { code: "+61",  flag: "🇦🇺", name: "Australia",    minLen: 9,  maxLen: 9  },
  { code: "+49",  flag: "🇩🇪", name: "Germany",      minLen: 10, maxLen: 11 },
  { code: "+33",  flag: "🇫🇷", name: "France",       minLen: 9,  maxLen: 9  },
  { code: "+39",  flag: "🇮🇹", name: "Italy",        minLen: 9,  maxLen: 10 },
  { code: "+7",   flag: "🇷🇺", name: "Russia",       minLen: 10, maxLen: 10 },
  { code: "+81",  flag: "🇯🇵", name: "Japan",        minLen: 10, maxLen: 10 },
  { code: "+86",  flag: "🇨🇳", name: "China",        minLen: 11, maxLen: 11 },
  { code: "+91",  flag: "🇮🇳", name: "India",        minLen: 10, maxLen: 10 },
  { code: "+65",  flag: "🇸🇬", name: "Singapore",    minLen: 8,  maxLen: 8  },
  { code: "+60",  flag: "🇲🇾", name: "Malaysia",     minLen: 9,  maxLen: 10 },
  { code: "+971", flag: "🇦🇪", name: "UAE",          minLen: 9,  maxLen: 9  },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia", minLen: 9,  maxLen: 9  },
  { code: "+82",  flag: "🇰🇷", name: "South Korea",  minLen: 9,  maxLen: 10 },
  { code: "+34",  flag: "🇪🇸", name: "Spain",        minLen: 9,  maxLen: 9  },
  { code: "+31",  flag: "🇳🇱", name: "Netherlands",  minLen: 9,  maxLen: 9  },
  { code: "+46",  flag: "🇸🇪", name: "Sweden",       minLen: 9,  maxLen: 9  },
  { code: "+47",  flag: "🇳🇴", name: "Norway",       minLen: 8,  maxLen: 8  },
  { code: "+41",  flag: "🇨🇭", name: "Switzerland",  minLen: 9,  maxLen: 9  },
  { code: "+64",  flag: "🇳🇿", name: "New Zealand",  minLen: 8,  maxLen: 10 },
  { code: "+55",  flag: "🇧🇷", name: "Brazil",       minLen: 10, maxLen: 11 },
  { code: "+62",  flag: "🇮🇩", name: "Indonesia",    minLen: 9,  maxLen: 12 },
  { code: "+66",  flag: "🇹🇭", name: "Thailand",     minLen: 9,  maxLen: 9  },
  { code: "+84",  flag: "🇻🇳", name: "Vietnam",      minLen: 9,  maxLen: 10 },
  { code: "+92",  flag: "🇵🇰", name: "Pakistan",     minLen: 10, maxLen: 10 },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh",   minLen: 10, maxLen: 10 },
  { code: "+27",  flag: "🇿🇦", name: "South Africa", minLen: 9,  maxLen: 9  },
  { code: "+20",  flag: "🇪🇬", name: "Egypt",        minLen: 10, maxLen: 10 },
  { code: "+48",  flag: "🇵🇱", name: "Poland",       minLen: 9,  maxLen: 9  },
];

// ── Platforms ─────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "mobile",    label: "Mobile",    numeric: true  },
  { id: "whatsapp",  label: "WhatsApp",  numeric: true  },
  { id: "telegram",  label: "Telegram",  numeric: false },
  { id: "wechat",    label: "WeChat",    numeric: false },
  { id: "line",      label: "LINE",      numeric: false },
  { id: "kakao",     label: "KakaoTalk", numeric: false },
  { id: "viber",     label: "Viber",     numeric: true  },
  { id: "signal",    label: "Signal",    numeric: true  },
  { id: "messenger", label: "Messenger", numeric: false },
  { id: "imessage",  label: "iMessage",  numeric: false },
  { id: "other",     label: "Other",     numeric: false },
];

const EMERGENCY_RELATIONSHIPS = [
  "Spouse", "Parent", "Sibling", "Child", "Friend",
  "Colleague", "Hotel Concierge", "Tour Guide", "Other",
];

const inputClass = "w-full px-4 py-3 bg-white border border-[#EF8354]/15 rounded-xl text-[#2D3142] text-sm outline-none transition-all focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20";

// ── Phone validation with country code min/max ────────────────────────────────
const validatePhone = (digits, countryCode) => {
  if (!digits) return "Phone number is required.";
  if (!/^\d+$/.test(digits)) return "Only digits allowed — no spaces or dashes.";
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) return digits.length < 7 ? "Too short." : digits.length > 15 ? "Too long." : "";
  if (digits.length < country.minLen) return `Too short for ${country.name} — need ${country.minLen} digits (entered ${digits.length}).`;
  if (digits.length > country.maxLen) return `Too long for ${country.name} — max ${country.maxLen} digits.`;
  return "";
};

// ── Reusable phone input with country dropdown ────────────────────────────────
const PhoneInput = ({ value, onChange, label, required, theme = "orange" }) => {
  const [touched, setTouched] = useState(false);

  const parseCode = () => {
    if (!value) return "+94";
    const match = COUNTRIES.find(c => value.startsWith(c.code + " "));
    return match ? match.code : "+94";
  };

  const parseNumber = () => {
    if (!value) return "";
    const code = parseCode();
    return value.startsWith(code + " ") ? value.slice(code.length + 1) : value;
  };

  const code    = parseCode();
  const number  = parseNumber();
  const country = COUNTRIES.find(c => c.code === code) || COUNTRIES[0];
  const digits  = number.replace(/\s/g, "");
  const error   = touched ? validatePhone(digits, code) : "";
  const isValid = !validatePhone(digits, code) && digits.length > 0;

  const handleCodeChange = (newCode) => onChange(`${newCode} ${parseNumber()}`);
  const handleNumChange  = (val) => onChange(`${code} ${val.replace(/[^\d\s]/g, "")}`);

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-[#2D3142] mb-1">
          {label}{required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div className="flex gap-2">
        {/* Country code dropdown */}
        <div className="relative">
          <select
            value={code}
            onChange={e => handleCodeChange(e.target.value)}
            className="appearance-none pl-3 pr-7 py-3 bg-white border border-[#EF8354]/15 rounded-xl text-[#2D3142] text-sm outline-none focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20 cursor-pointer min-w-[170px]"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.code})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]/70 pointer-events-none" />
        </div>

        {/* Number input */}
        <div className="relative flex-1">
          <input
            type="tel"
            value={number}
            onChange={e => handleNumChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={`${country.minLen} digits`}
            className={`${inputClass} pr-9 ${
              touched && error   ? "border-red-400 focus:ring-red-400/20 focus:border-red-400"
              : touched && isValid ? "border-green-400 focus:ring-green-400/20 focus:border-green-400"
              : ""
            }`}
          />
          {touched && isValid && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Hint / error */}
      {touched && error
        ? <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>
        : touched && isValid
          ? <p className="text-xs text-green-600 mt-1.5">✓ Valid {country.name} number</p>
          : <p className="text-xs text-[#6B7280]/70 mt-1.5">
              {country.name}: {country.minLen === country.maxLen ? `${country.minLen} digits` : `${country.minLen}–${country.maxLen} digits`} required
            </p>
      }
    </div>
  );
};

// ── Platform row (for non-numeric platforms uses plain text; numeric uses PhoneInput) ──
const PlatformRow = ({ index, platform, number, onChange, onRemove, required, usedPlatforms }) => {
  const [touched, setTouched] = useState(false);
  const selected  = PLATFORMS.find(p => p.id === platform) || PLATFORMS[0];
  const available = PLATFORMS.filter(p => !usedPlatforms.includes(p.id) || p.id === platform);

  // For non-numeric: simple text validation
  const textError   = touched && !selected.numeric && !number.trim() ? "This field is required." : "";
  const textIsValid = !selected.numeric && number.trim().length > 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-[#2D3142]">
          {index === 0
            ? <span>Primary Contact <span className="text-red-500">*</span></span>
            : "Alternative Contact"}
          <span className="ml-2 text-[10px] font-normal text-[#6B7280]">
            {index === 0 ? "Required" : "Optional"}
          </span>
        </label>
        {index === 1 && (
          <button type="button" onClick={onRemove}
            className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-red-500 transition-colors">
            <X className="w-3.5 h-3.5" /> Remove
          </button>
        )}
      </div>

      {/* Platform selector */}
      <div className="relative w-full">
        <select
          value={platform}
          onChange={e => { onChange("platform", e.target.value); setTouched(false); }}
          className="appearance-none w-full pl-3 pr-7 py-3 bg-white border border-[#EF8354]/15 rounded-xl text-[#2D3142] text-sm font-medium outline-none focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20 cursor-pointer"
        >
          {available.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]/70 pointer-events-none" />
      </div>

      {/* Numeric platforms → PhoneInput with country dropdown */}
      {selected.numeric ? (
        <PhoneInput
          value={number}
          onChange={val => onChange("number", val)}
          required={required}
        />
      ) : (
        /* Non-numeric → plain text input */
        <div>
          <div className="relative">
            <input
              type="text"
              value={number}
              onChange={e => onChange("number", e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={
                platform === "telegram"  ? "@yourusername" :
                platform === "messenger" ? "facebook.com/yourname" :
                "Your ID or username"
              }
              className={`${inputClass} ${
                textError    ? "border-red-400 focus:ring-red-400/20 focus:border-red-400"
                : textIsValid ? "border-green-400 focus:ring-green-400/20 focus:border-green-400"
                : ""
              }`}
            />
            {textIsValid && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
          </div>
          {textError && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{textError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const BookingNotesStep = ({ data, onChange }) => {
  const { user } = useContext(AuthContext);
  const [showSecond, setShowSecond] = useState(!!(data.contactPlatform2 && data.contactNumber2));

  const nameValue = data.customerName || user?.name || "";

  const handlePlatform1 = (field, val) => {
    if (field === "platform") onChange("contactPlatform", val);
    if (field === "number")   onChange("contactNumber",   val);
  };

  const handlePlatform2 = (field, val) => {
    if (field === "platform") onChange("contactPlatform2", val);
    if (field === "number")   onChange("contactNumber2",   val);
  };

  const addSecond = () => {
    const first = data.contactPlatform || "mobile";
    const next  = PLATFORMS.find(p => p.id !== first)?.id || "whatsapp";
    onChange("contactPlatform2", next);
    onChange("contactNumber2", "");
    setShowSecond(true);
  };

  const removeSecond = () => {
    onChange("contactPlatform2", "");
    onChange("contactNumber2", "");
    setShowSecond(false);
  };

  const usedPlatforms = [
    data.contactPlatform  || "mobile",
    showSecond ? (data.contactPlatform2 || "whatsapp") : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">

      {/* ── Contact Details ── */}
      <div>
        <h3 className="text-lg font-bold text-[#2D3142] mb-1 flex items-center gap-2">
          <Phone className="w-5 h-5 text-[#EF8354]" /> Contact Details
        </h3>
        <p className="text-sm text-[#6B7280] mb-4">
          Choose how you prefer us to reach you about this booking.
        </p>

        <div className="space-y-5">

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-[#2D3142] mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nameValue}
              onChange={e => onChange("customerName", e.target.value)}
              placeholder="Your full name"
              className={inputClass}
            />
            {user?.name && (
              <p className="text-xs text-[#EF8354] mt-1 ml-1">
                ✓ Auto-filled from your profile — you can edit this
              </p>
            )}
          </div>

          {/* Primary platform */}
          <PlatformRow
            index={0}
            platform={data.contactPlatform || "mobile"}
            number={data.contactNumber || ""}
            onChange={handlePlatform1}
            required
            usedPlatforms={usedPlatforms}
          />

          {/* Second platform or add button */}
          {showSecond ? (
            <PlatformRow
              index={1}
              platform={data.contactPlatform2 || "whatsapp"}
              number={data.contactNumber2 || ""}
              onChange={handlePlatform2}
              onRemove={removeSecond}
              required={false}
              usedPlatforms={usedPlatforms}
            />
          ) : (
            <button
              type="button"
              onClick={addSecond}
              className="flex items-center gap-2 text-sm text-[#EF8354] font-semibold hover:text-[#4F5D75] transition-colors"
            >
              <div className="w-7 h-7 rounded-full border-2 border-dashed border-[#EF8354]/40 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5" />
              </div>
              Add alternative contact method
            </button>
          )}

        </div>
      </div>

      {/* ── Emergency Contact ── */}
      <div>
        <h3 className="text-lg font-bold text-[#2D3142] mb-1 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#EF8354]" /> Emergency Contact
        </h3>
        <p className="text-sm text-[#6B7280] mb-4">
          In case of emergency during the trip. Saved to your profile.
        </p>
        <div className="bg-white border border-[#EF8354]/15 rounded-2xl p-4 space-y-4">

          <div>
            <label className="block text-sm font-semibold text-[#2D3142] mb-1">Name *</label>
            <input
              type="text"
              value={data.emergencyName || ""}
              onChange={e => onChange("emergencyName", e.target.value)}
              placeholder="Full name of emergency contact"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2D3142] mb-1">Relationship *</label>
            <div className="relative">
              <select
                value={data.emergencyRelationship || ""}
                onChange={e => onChange("emergencyRelationship", e.target.value)}
                className={`${inputClass} appearance-none pr-8`}
              >
                <option value="" disabled>Select relationship</option>
                {EMERGENCY_RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]/70 pointer-events-none" />
            </div>
          </div>

          {/* Emergency phone — same PhoneInput with country dropdown */}
          <PhoneInput
            value={data.emergencyPhone || ""}
            onChange={val => onChange("emergencyPhone", val)}
            label="Phone Number"
            required
          />

        </div>
      </div>

      {/* ── Additional Notes ── */}
      <div>
        <h3 className="text-lg font-bold text-[#2D3142] mb-1 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#EF8354]" /> Additional Notes
        </h3>
        <p className="text-sm text-[#6B7280] mb-4">
          Any special requests, preferences, or information for the driver.
        </p>
        <textarea
          value={data.notes || ""}
          onChange={e => onChange("notes", e.target.value)}
          placeholder="E.g. early morning pickup, wheelchair access needed, stop at airport first…"
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </div>

    </div>
  );
};

export default BookingNotesStep;
