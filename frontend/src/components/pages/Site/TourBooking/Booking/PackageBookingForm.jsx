import { useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Send, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { AuthContext } from "../../../../../context/AuthContext";
import { submitPackageBooking, fetchMyBookings } from "../../../../../services/bookingService";
import BookingStepIndicator from "./BookingStepIndicator";
import BookingPassengersStep from "./BookingPassengersStep";
import BookingNotesStep from "./BookingNotesStep";
import P2PReviewStep from "../PointToPoint/P2PReviewStep";

// We'll get STEPS from translation instead of hardcoding


const parsePackageDays = (value) => {
  if (value == null) return 1;
  const match = String(value).match(/\d+/);
  const days = match ? Number(match[0]) : Number(value);
  return Number.isFinite(days) && days > 0 ? days : 1;
};

const addDaysToDate = (dateString, daysToAdd) => {
  if (!dateString) return "";
  const date = new Date(`${dateString}T12:00:00Z`); // use UTC
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return date.toISOString().split("T")[0];
};

const initialData = {
  tourType:       "PACKAGE",
  startLocation:  null,
  endLocation:    null,
  startDate:      "",
  endDate:        "",
  pickupTime:     "",
  totalDays:      0,
  daysRequired:   0,
  noOfAdults:     1,
  noOfChildren:   0,
  agesOfChildren: "",
  babySeatNeeded: false,
  smallLuggages:  0,
  largeLuggages:  0,
  categoryId:     "",
  customerName:   "",
  contactPlatform: "mobile",
  contactNumber:   "",
  contactPlatform2: "",
  contactNumber2:  "",
  emergencyName:   "",
  emergencyPhone:  "",
  emergencyRelationship: "",
  notes:          "",
};

// ─── Guest Guard ──────────────────────────────────────────────────────────────
const GuestGuard = ({ navigate }) => {
  
  return (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center max-w-md w-full"
    >
      <div className="w-16 h-16 bg-[#EF8354]/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-[#EF8354]" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-800 mb-2">{"Login Required"}</h2>
      <p className="text-slate-500 text-sm mb-6">
        {"You need to be logged in to place a booking."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => navigate("/login")}
          className="bg-[#EF8354] hover:bg-[#4F5D75] text-white px-6 py-3 rounded-xl font-semibold transition-colors cursor-pointer"
        >
          {"Login"}
        </button>
        <button
          onClick={() => navigate("/register")}
          className="border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
        >
          {"Register"}
        </button>
      </div>
    </motion.div>
  </div>
  );
};

// ─── Success Screen ───────────────────────────────────────────────────────────
const SuccessScreen = ({ bookingRef, navigate }) => {
  
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="text-center"
  >
    <div className="w-20 h-20 bg-[#EF8354]/10 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckCircle className="w-10 h-10 text-[#EF8354]" />
    </div>
    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-3">
      {"Booking Submitted!"}
    </h2>
    <p className="text-slate-500 text-sm mb-2">{"Your booking reference is:"}</p>
    <p className="text-lg font-bold text-[#EF8354] mb-8">{bookingRef}</p>
    <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-left space-y-2">
      {[
        "Your booking is now PENDING review",
        "Our team will send a price quote within 24 hours",
        "You can track your booking status from your profile",
      ].map((s, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
          <span className="text-[#EF8354] font-bold flex-shrink-0">✓</span>
          {s}
        </div>
      ))}
    </div>
    <button
      onClick={() => navigate("/user/profile")}
      className="w-full bg-[#EF8354] hover:bg-[#4F5D75] text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 tracking-wide cursor-pointer mb-3"
    >
      {"View My Bookings"}
    </button>
    <button
      onClick={() => navigate("/tour-booking/package")}
      className="w-full border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer"
    >
      {"Back to Packages"}
    </button>
  </motion.div>
  );
};

const areChildAgesValid = (noOfChildren, agesOfChildren) => {
  if (!noOfChildren || Number(noOfChildren) <= 0) return true;
  const ages = String(agesOfChildren || "").split(",").map((age) => age.trim());
  if (ages.length !== Number(noOfChildren)) return false;
  return ages.every((age) => {
    if (age === "") return false;
    const num = Number(age);
    return Number.isInteger(num) && num >= 0 && num <= 17;
  });
};

// ─── Step Validation ──────────────────────────────────────────────────────────
const validateStep = (step, data) => {
  switch (step) {
    case 0: return data.startDate && data.endDate && data.pickupTime;
    case 1:
      return data.noOfAdults >= 1 && data.categoryId && areChildAgesValid(data.noOfChildren, data.agesOfChildren);
    case 2: return data.customerName.trim() && (data.contactNumber || '').trim();
    case 3: return true;
    default: return false;
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PackageBookingForm = () => {
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const STEPS = [
  "Trip Details",
  "Passengers",
  "More Info",
  "Review"
];

  const packageIdRaw = searchParams.get("packageId");
  const packageId = packageIdRaw ? Number(packageIdRaw) : null;
  const packageTitle = searchParams.get("packageTitle") || "Package Tour";
  const packageDays = parsePackageDays(searchParams.get("packageDays"));

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(() => ({
    ...initialData,
    customerName:          user?.name || "",
    contactNumber:         user?.contact_number || "",
    emergencyName:         user?.emergency_name || "",
    emergencyPhone:        user?.emergency_phone || "",
    emergencyRelationship: user?.emergency_relationship || "",
  }));
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!user) return <GuestGuard navigate={navigate} />;

  const handleChange = (field, value) => setData((prev) => ({ ...prev, [field]: value }));
  const handleNext = () => {
    if (validateStep(currentStep, data)) setCurrentStep((s) => s + 1);
  };
  const handleBack = () => {
    setError("");
    setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      // ── Duplicate booking guard ──────────────────────────────
      // Prevent same customer from booking the same package on the same start date
      try {
        const myBookings = await fetchMyBookings();
        const duplicate = (myBookings || []).some(
          (b) =>
            b.tourType === "PACKAGE" &&
            String(b.packageId) === String(packageId) &&
            b.startDate?.slice(0, 10) === data.startDate &&
            ["PENDING", "QUOTED", "CONFIRMED", "TOUR_STARTED"].includes(b.status)
        );
        if (duplicate) {
          setError(
            "You already have an active booking for this package starting on the selected date. Please choose a different start date."
          );
          setSubmitting(false);
          return;
        }
      } catch {
        // If the pre-check fails, let the backend handle it
      }

      const result = await submitPackageBooking({
        ...data,
        customerEmail: user.email,
        packageId: packageId,
        packageName: packageTitle,
      });
      setBookingRef(result.bookingRef);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartDateChange = (value) => {
    const endDate = value ? addDaysToDate(value, packageDays - 1) : "";
    handleChange("startDate", value);
    handleChange("endDate", endDate);
    handleChange("totalDays", value ? packageDays : 0);
    handleChange("daysRequired", value ? packageDays : 0);
  };

  const canProceed = validateStep(currentStep, data);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header with back button */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/tour-booking/package")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            {"Back to Packages"}
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{"Book: "}{packageTitle}</h1>
            <p className="text-sm text-slate-500">{"Complete your package tour booking"}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Form ── */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8"
            >
              {submitted ? (
                <SuccessScreen bookingRef={bookingRef} navigate={navigate} />
              ) : (
                <>
                  <BookingStepIndicator steps={STEPS} currentStep={currentStep} />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                    >
                      {currentStep === 0 && (
                        <PackageBookingTripStep
                          data={data}
                          onChange={handleChange}
                          onStartDateChange={handleStartDateChange}
                          packageTitle={packageTitle}
                          packageDays={packageDays}
                        />
                      )}
                      {currentStep === 1 && <BookingPassengersStep data={data} onChange={handleChange} />}
                      {currentStep === 2 && <BookingNotesStep data={data} onChange={handleChange} />}
                      {currentStep === 3 && (
                        <P2PReviewStep
                          data={data}
                          isPackageBooking={true}
                          packageTitle={packageTitle}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                    <button
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> {"Back"}
                    </button>

                    {currentStep < STEPS.length - 1 ? (
                      <button
                        onClick={handleNext}
                        disabled={!canProceed}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#EF8354] hover:bg-[#4F5D75] text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {"Next"} <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#EF8354] hover:bg-[#4F5D75] text-white font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            {"Submitting..."}
                          </>
                        ) : (
                          <><Send className="w-4 h-4" /> {"Submit Booking"}</>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* ── Right: Info Panel ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-32">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{"Package Details"}</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{"Selected Package"}</p>
                  <p className="text-sm font-semibold text-slate-800">{packageTitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Package Trip Step (simplified - no location inputs) ──────────────────────
const PackageBookingTripStep = ({ data, onChange, onStartDateChange, packageTitle, packageDays }) => {
  // Package tours must be booked at least 2 days in advance
  const minStartDateObj = new Date();
  minStartDateObj.setDate(minStartDateObj.getDate() + 2);
  const minYear = minStartDateObj.getFullYear();
  const minMonth = String(minStartDateObj.getMonth() + 1).padStart(2, '0');
  const minDay = String(minStartDateObj.getDate()).padStart(2, '0');
  const minDate = `${minYear}-${minMonth}-${minDay}`;

  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm outline-none transition-all focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
          {"📦 Your Package"}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {"Package tour details and travel dates."}
        </p>

        <div className="bg-[#EF8354]/5 border border-[#EF8354]/20 rounded-xl p-4 mb-6">
          <p className="text-xs text-slate-500 mb-1">{"Selected Package"}</p>
          <p className="text-sm font-semibold text-slate-800">{packageTitle}</p>
        </div>
      </div>

      {/* Dates */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
          {"📅 Travel Dates"}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {"When would you like to travel?"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {"Start Date *"}
            </label>
            <input
              type="date"
              min={minDate}
              value={data.startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700 mb-1">{"End Date"}</p>
          <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm">
            {data.endDate || "Select a start date to calculate the end date"}
          </div>
        </div>

        {/* Pickup Time */}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
            {"🕐 Preferred Pickup Time *"}
          </label>
          <input
            type="time"
            value={data.pickupTime}
            onChange={(e) => onChange("pickupTime", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Total days display */}
        {data.totalDays > 0 && (
          <div className="mt-4 bg-[#EF8354]/5 border border-[#EF8354]/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EF8354]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📅</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                <span className="text-lg">{data.totalDays}</span> Day Trip
              </p>
              <p className="text-xs text-slate-500">
                {data.startDate} → {data.endDate}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Package duration: <span>{packageDays}</span> day(s)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageBookingForm;
