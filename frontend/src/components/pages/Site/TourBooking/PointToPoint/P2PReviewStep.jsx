import { MapPin, Calendar, Users, Car, Phone, FileText, Clock, AlertTriangle, Briefcase } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../../../../../context/AuthContext";
const VEHICLE_LABELS = {
  mini_car: "Mini Car", normal_car: "Normal Car", sedan_car: "Sedan Car",
  mpv: "MPV", suv: "SUV", mini_van: "Mini Van", van: "Van", large_van: "Large Van",
};

const PLATFORM_LABELS = {
  mobile: "Mobile", whatsapp: "WhatsApp", telegram: "Telegram",
  wechat: "WeChat", line: "LINE", kakao: "KakaoTalk",
  viber: "Viber", signal: "Signal", messenger: "Messenger",
  imessage: "iMessage", other: "Other",
};

const ReviewRow = ({ icon: Icon, label, value }) =>
  value ? (
    <div className="flex items-start gap-3 py-3 border-b border-[#EF8354]/8 last:border-0">
      <div className="w-8 h-8 bg-[#EF8354]/8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[#EF8354]" />
      </div>
      <div>
        <p className="text-xs text-[#6B7280] font-medium">{label}</p>
        <p className="text-sm font-semibold text-[#2D3142] mt-0.5">{value}</p>
      </div>
    </div>
  ) : null;

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-[#EF8354]/10 shadow-sm p-5">
    <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">{title}</p>
    {children}
  </div>
);

const P2PReviewStep = ({ data }) => {
  
  const { user } = useContext(AuthContext);

  const luggageParts = [];
  if (data.luggage10kg  > 0) luggageParts.push(`${data.luggage10kg}× 10 kg`);
  if (data.luggage25kg  > 0) luggageParts.push(`${data.luggage25kg}× 25 kg`);
  if (data.luggage35kg  > 0) luggageParts.push(`${data.luggage35kg}× 35 kg`);
  (data.luggageCustomItems || []).forEach((item, i) =>
    luggageParts.push(`Custom ${i + 1}: ${item.weight ? `${item.weight} kg` : "weight not set"}`)
  );
  const luggageSummary    = luggageParts.length > 0 ? luggageParts.join(" · ") : "No luggage";
  const customerFullName  = data.customerName?.trim() || user?.name || "—";
  const hasEmergency      = data.emergencyName || data.emergencyPhone;
  const platform1Label    = PLATFORM_LABELS[data.contactPlatform] || data.contactPlatform || "—";
  const platform2Label    = PLATFORM_LABELS[data.contactPlatform2] || data.contactPlatform2 || "";

  return (
    <div className="space-y-4">

      {/* ── Booking type badge ── */}
      <div className="inline-flex items-center gap-2 bg-[#EF8354]/10 text-[#EF8354] px-4 py-2 rounded-full text-sm font-bold">
        🚗 Point-to-Point Transfer
      </div>

      {/* ── Trip Details ── */}
      <Section title="Trip Details">
        <ReviewRow icon={MapPin}   label="Pickup Location"   value={data.startLocation} />
        <ReviewRow icon={MapPin}   label="Drop-off Location" value={data.endLocation} />
        <ReviewRow icon={Calendar} label="Travel Date"       value={`${data.startDate} → ${data.endDate}`} />
        <ReviewRow icon={Clock}    label="Pickup Time"       value={data.pickupTime} />
        <ReviewRow icon={Calendar} label="Total Days"        value={`${data.totalDays} day(s)`} />
      </Section>

      {/* ── Passengers & Vehicle ── */}
      <Section title="Passengers & Vehicle">
        <ReviewRow icon={Users}     label="Adults"           value={`${data.noOfAdults} adult(s)`} />
        {data.noOfChildren > 0 && (
          <ReviewRow icon={Users}   label="Children"
            value={`${data.noOfChildren} child(ren) — Ages: ${data.agesOfChildren || "not specified"}${data.babySeatNeeded ? " · Baby seat requested" : ""}`} />
        )}
        <ReviewRow icon={Briefcase} label="Luggage"          value={luggageSummary} />
        <ReviewRow icon={Car}       label="Vehicle Category" value={VEHICLE_LABELS[data.categoryId] || data.categoryId} />
      </Section>

      {/* ── Contact Details ── */}
      <Section title="Contact Details">
        <ReviewRow icon={Phone}    label="Full Name"         value={customerFullName} />
        <ReviewRow icon={Phone}    label="Email"             value={user?.email || "—"} />
        <ReviewRow icon={Phone}    label={`Primary — ${platform1Label}`}      value={data.contactNumber || "—"} />
        {data.contactNumber2 && (
          <ReviewRow icon={Phone}  label={`Alternative — ${platform2Label}`}  value={data.contactNumber2} />
        )}
        {data.notes && <ReviewRow icon={FileText} label="Additional Notes" value={data.notes} />}
      </Section>

      {/* Emergency Contact */}
      <div className="bg-white rounded-2xl border border-[#EF8354]/10 shadow-sm p-5">
        <p className="text-xs font-bold text-[#6B7280]/70 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {"Emergency Contact"}
        </p>
        {data.emergencyName || data.emergencyPhone ? (
          <>
            <ReviewRow icon={Phone} label={"Emergency Contact Name"}         value={data.emergencyName || "—"} />
            <ReviewRow icon={Phone} label={"Relationship"}                   value={data.emergencyRelationship || "—"} />
            <ReviewRow icon={Phone} label={"Emergency Contact Phone"}        value={data.emergencyPhone || "—"} />
          </>
        ) : (
          <p className="text-sm text-[#6B7280]/70 italic py-2">{"No emergency contact provided."}</p>
        )}
      </div>

      {/* What happens next */}
      <div className="bg-[#BFC0C0] rounded-2xl p-5 border border-[#EF8354]/10">
        <p className="text-sm font-bold text-[#2D3142] mb-3">{"What happens after you submit?"}</p>
        {[
          "Your booking is submitted with status: PENDING",
          "Our team reviews your request within 24 hours",
          "We'll send you a price quote through the system",
          "You accept or reject the quote from your profile",
          "Once accepted, we confirm and assign your vehicle",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-[#EF8354] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
              {i + 1}
            </div>
            <p className="text-sm text-white/80">{step}</p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default P2PReviewStep;