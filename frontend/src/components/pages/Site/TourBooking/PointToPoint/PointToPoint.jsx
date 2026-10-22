import { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Send, Lock, MapPin, CheckCircle } from "lucide-react";
import { AuthContext } from "../../../../../context/AuthContext";
import { submitP2PBooking, updateBooking } from "../../../../../services/bookingService";
import BookingStepIndicator from "../Booking/BookingStepIndicator";
import P2PTripStep from "./P2PTripStep";
import BookingPassengersStep from "../Booking/BookingPassengersStep";
import BookingNotesStep from "../Booking/BookingNotesStep";
import P2PReviewStep from "./P2PReviewStep";
import P2PSidePanel from "./P2PSidePanel";
 
const STEPS = ["Trip Details", "Passengers", "More Info", "Review"];
 
const initialData = {
  tourType: "P2P",
  startLocation: "",
  endLocation: "",
  startDate: "",
  endDate: "",
  pickupTime: "",
  totalDays: 0,
  daysRequired: 0,
  noOfAdults: 1,
  noOfChildren: 0,
  agesOfChildren: "",
  babySeatNeeded: false,
  categoryId: "",
  luggage10kg: 0,
  luggage25kg: 0,
  luggage35kg: 0,
  luggageCustomCount: 0,
  luggageCustomItems: [],
  customerName: "",
  contactPlatform:  "mobile",
  contactNumber:   "",
  contactPlatform2: "",
  contactNumber2:  "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: "",
  notes: "",
};
 
// ─── Guest Guard ──────────────────────────────────────────────────────────────
const GuestGuard = ({ navigate }) => {
  
  return (
  <div className="min-h-screen bg-[#BFC0C0] flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#EF8354]/10 shadow-sm p-10 text-center max-w-md w-full"
    >
      <div className="w-16 h-16 bg-[#EF8354]/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-[#EF8354]" />
      </div>
      <h2 className="text-2xl font-extrabold text-[#2D3142] mb-2">{"Login Required"}</h2>
      <p className="text-[#6B7280] text-sm mb-6">
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
          className="border border-[#EF8354]/15 text-[#2D3142] px-6 py-3 rounded-xl font-semibold hover:bg-[#BFC0C0] transition-colors cursor-pointer"
        >
          {"Register"}
        </button>
      </div>
    </motion.div>
  </div>
  );
};
 
// ─── Success Screen ───────────────────────────────────────────────────────────
const SuccessScreen = ({ bookingId, navigate }) => {
  
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
    <h2 className="text-2xl font-extrabold text-[#2D3142] tracking-tight mb-3">
      {"Booking Submitted!"}
    </h2>
    <p className="text-[#6B7280] text-sm mb-2">{"Your booking reference is:"}</p>
    <p className="text-lg font-bold text-[#EF8354] mb-8">{bookingId}</p>
    <div className="bg-[#BFC0C0] rounded-2xl p-5 mb-6 text-left space-y-2">
      {[
        "Your booking is now PENDING",
        "Our team will review and send a price quote within 24 hours",
        "You can track your booking status from your profile",
      ].map((s, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-[#2D3142]/70">
          <span className="text-[#EF8354] font-bold flex-shrink-0">✓</span>
          {s}
        </div>
      ))}
    </div>
    <button
      onClick={() => navigate("/user/profile")}
      className="w-full bg-[#EF8354] hover:bg-[#4F5D75] text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 tracking-wide cursor-pointer"
    >
      {"View My Bookings"}
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

// ─── Validation ───────────────────────────────────────────────────────────────
const validateStep = (step, data) => {
  switch (step) {
    case 0: return data.startLocation.trim() && data.endLocation.trim() && data.startDate && data.endDate && data.pickupTime;
    case 1: return data.noOfAdults >= 1 && data.categoryId && areChildAgesValid(data.noOfChildren, data.agesOfChildren);
    case 2: return data.customerName.trim() && (data.contactNumber || '').trim();
    case 3: return true;
    default: return false;
  }
};
 
// ─── Main Component ───────────────────────────────────────────────────────────
const PointToPoint = () => {
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const editBooking = location.state?.editBooking || null;

  const [currentStep, setCurrentStep] = useState(0);
  const [maxReachedStep, setMaxReachedStep] = useState(0);
  const [data, setData] = useState(() => {
    if (!editBooking) {
      return { 
        ...initialData, 
        customerName: user?.name || "",
        contactNumber: user?.contact_number || "",
        emergencyName: user?.emergency_name || "",
        emergencyPhone: user?.emergency_phone || "",
        emergencyRelationship: user?.emergency_relationship || "",
      };
    }
    return {
      ...initialData,
      ...editBooking,
      customerName: editBooking.customerName || user?.name || "",
      contactPlatform: editBooking.contactPlatform || "mobile",
      contactNumber: editBooking.contactNumber || editBooking.customerPhone || user?.contact_number || "",
      contactPlatform2: editBooking.contactPlatform2 || "",
      contactNumber2: editBooking.contactNumber2 || "",
      totalDays: editBooking.totalDays || 0,
      daysRequired: editBooking.daysRequired || 0,
      noOfAdults: editBooking.noOfAdults || 1,
      noOfChildren: editBooking.noOfChildren || 0,
      agesOfChildren: editBooking.agesOfChildren || "",
      babySeatNeeded: editBooking.babySeatNeeded || false,
      categoryId: editBooking.categoryId || "",
      luggage10kg: editBooking.luggage10kg || 0,
      luggage25kg: editBooking.luggage25kg || 0,
      luggage35kg: editBooking.luggage35kg || 0,
      luggageCustomCount: editBooking.luggageCustomCount || 0,
      luggageCustomItems: editBooking.luggageCustomItems || [],
      emergencyName: editBooking.emergencyName || user?.emergency_name || "",
      emergencyPhone: editBooking.emergencyPhone || user?.emergency_phone || "",
      emergencyRelationship: editBooking.emergencyRelationship || user?.emergency_relationship || "",
      notes: editBooking.notes || "",
    };
  });
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!user) return <GuestGuard navigate={navigate} />;

  const handleChange = (field, value) => setData((prev) => ({ ...prev, [field]: value }));
  const handleNext = () => {
    if (validateStep(currentStep, data)) {
      setCurrentStep((s) => {
        const next = s + 1;
        setMaxReachedStep((m) => Math.max(m, next));
        return next;
      });
    }
  };
  const handleBack = () => setCurrentStep((s) => s - 1);

  const CATEGORY_LABELS = {
    mini_car: "Mini Car", normal_car: "Normal Car", sedan_car: "Sedan Car",
    mpv: "MPV", suv: "SUV", mini_van: "Mini Van", van: "Van", large_van: "Large Van",
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        tourType: "P2P",
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        startDate: data.startDate,
        endDate: data.endDate,
        pickupTime: data.pickupTime,
        totalDays: data.totalDays,
        daysRequired: data.daysRequired,
        categoryId: CATEGORY_LABELS[data.categoryId] || data.categoryId,
        noOfAdults: data.noOfAdults,
        noOfChildren: data.noOfChildren,
        agesOfChildren: data.agesOfChildren,
        babySeatNeeded: data.babySeatNeeded,
        luggage10kg: data.luggage10kg || 0,
        luggage25kg: data.luggage25kg || 0,
        luggage35kg: data.luggage35kg || 0,
        luggageCustomCount: data.luggageCustomCount || 0,
        luggageCustomItems: data.luggageCustomItems || [],
        customerName: data.customerName,
        contactPlatform: data.contactPlatform || "whatsapp",
        contactNumber: data.contactNumber,
        contactPlatform2: data.contactPlatform2 || null,
        contactNumber2: data.contactNumber2 || null,
        customerEmail: user.email,
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone,
        emergencyRelationship: data.emergencyRelationship,
        notes: data.notes,
      };
      const result = editBooking?.id
        ? await updateBooking(editBooking.id, payload)
        : await submitP2PBooking(payload);
      setBookingId(editBooking?.id || result.bookingId || "");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
 
  const canProceed = validateStep(currentStep, data);
 
  return (
    <div className="min-h-screen bg-[#BFC0C0] pb-16">
 
      {/* ── Page Title ── */}
      <div className="text-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1 mb-4 text-xs font-semibold tracking-widest text-white uppercase bg-[#EF8354] rounded-full">
            <MapPin className="w-3 h-3" /> {"Point-to-Point Transfer"}
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#2D3142] mb-4 tracking-tight">
            {"Book Your "} <span className="text-[#EF8354]">{"Transfer."}</span>
          </h1>
          <p className="text-lg text-[#6B7280] max-w-xl mx-auto font-light">
            {"Reliable one-way transfers between any two locations in Sri Lanka with professional drivers and premium vehicles."}
          </p>
        </motion.div>
      </div>
 
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* ── Left: Booking Form ── */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl border border-[#EF8354]/10 shadow-sm p-8"
            >
              {submitted ? (
                <SuccessScreen bookingId={bookingId} navigate={navigate} />
              ) : (
                <>
                  <BookingStepIndicator
                    steps={[
  "Trip Details",
  "Passengers",
  "More Info",
  "Review"
]}
                    currentStep={currentStep}
                    maxReachedStep={maxReachedStep}
                    onStepClick={(idx) => setCurrentStep(idx)}
                  />
 
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                    >
                      {currentStep === 0 && <P2PTripStep data={data} onChange={handleChange} />}
                      {currentStep === 1 && <BookingPassengersStep data={data} onChange={handleChange} />}
                      {currentStep === 2 && <BookingNotesStep data={data} onChange={handleChange} />}
                      {currentStep === 3 && <P2PReviewStep data={data} />}
                    </motion.div>
                  </AnimatePresence>
 
                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#EF8354]/10">
                    <button
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#EF8354]/15 text-[#2D3142]/70 font-semibold hover:bg-[#BFC0C0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
                      <>
                        {submitError && (
                          <p className="text-sm text-red-500 text-center mb-2">{submitError}</p>
                        )}
                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="w-full bg-[#EF8354] hover:bg-[#4F5D75] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 tracking-wide cursor-pointer"
                        >
                          {submitting ? (
                            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> {"Submitting..."}</>
                          ) : (
                            <><Send className="w-4 h-4" /> {"Submit Booking"}</>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
 
          {/* ── Right: Side Panel ── */}
          <div className="lg:col-span-1">
            <P2PSidePanel />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
 
export default PointToPoint;
 
