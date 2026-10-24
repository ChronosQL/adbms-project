// components/pages/User/MyBookings/MyBookingDetail.jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, Calendar, Users, Car, Phone, FileText, Clock, Baby, Briefcase, Check, X, Zap, AlertTriangle, Download } from "lucide-react";
import { STATUS_STYLES, TOUR_TYPE_LABEL } from "./MyBookingCard";
import { useBookings } from "../../../../context/BookingsContext.jsx";
import BookingWeatherPanel from "./BookingWeatherPanel";
import { getBookingReferenceForBooking } from "../../../../utils/bookingReference";

const VEHICLE_LABELS = {
  mini_car: "Mini Car", normal_car: "Normal Car", sedan_car: "Sedan Car",
  mpv: "MPV", suv: "SUV", mini_van: "Mini Van", van: "Van", large_van: "Large Van",
};

const DetailRow = ({ icon: Icon, label, value }) =>
  value !== undefined && value !== "" && value !== null ? (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 bg-[#EF8354]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[#EF8354]" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <div className="text-sm font-semibold text-slate-800 mt-0.5">{value}</div>
      </div>
    </div>
  ) : null;

const Section = ({ title, children, accent }) => (
  <div className={`bg-white rounded-2xl border shadow-sm p-5 mb-4 ${accent ? "border-[#EF8354]/20" : "border-slate-100"}`}>
    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${accent ? "text-[#EF8354]" : "text-slate-400"}`}>{title}</p>
    {children}
  </div>
);

const MyBookingDetail = ({ booking, onBack }) => {
  const navigate = useNavigate();
  const { acceptQuote, rejectQuote, cancelBooking, downloadConfirmationPdf } = useBookings();

  const statusSteps = ["PENDING", "QUOTED", "ACCEPTED", "CONFIRMED", "TOUR_STARTED", "COMPLETED", "CLOSED"];
  const currentStepIndex = statusSteps.indexOf(booking.status);
  const acceptedStepIndex = statusSteps.indexOf("ACCEPTED");

  const canCancel = ["ACCEPTED", "CONFIRMED"].includes(booking.status);
  const canDownloadPdf = currentStepIndex >= acceptedStepIndex;
  
  const tourStartedStepIndex = statusSteps.indexOf("TOUR_STARTED");
  const showPaymentsButton = currentStepIndex >= tourStartedStepIndex;

  const handleDownloadPdf = async () => {
    try {
      await downloadConfirmationPdf(booking.id);
    } catch (err) {
      window.alert(err.message || "Failed to download booking confirmation PDF.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-bold text-sm hover:border-[#EF8354] hover:text-[#EF8354] hover:bg-[#EF8354]/5 transition-all cursor-pointer group shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to List</span>
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-800">{booking.bookingRef || getBookingReferenceForBooking(booking)}</h2>
          <p className="text-xs text-slate-500">{TOUR_TYPE_LABEL[booking.tourType] || booking.tourType}</p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${STATUS_STYLES[booking.status] || "bg-slate-100 text-slate-600"}`}>
          {booking.status.replace("_", " ")}
        </span>

        {booking.status === "PENDING" && (
          <button
            onClick={() => {
              const path = booking.tourType === "PACKAGE"
                ? "/tour-booking/package/book"
                : "/tour-booking/point";
              navigate(path, { state: { editBooking: booking } });
            }}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EF8354] text-white font-bold text-sm hover:bg-[#4F5D75] transition-all cursor-pointer group shadow-lg shadow-[#EF8354]/20"
          >
            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Modify Request</span>
          </button>
        )}

        {/* Payments button - navigates to profile Payments tab for this booking */}
        {showPaymentsButton && (
          <button
            onClick={() => navigate('/user/profile', { state: { activeTab: 'payments', bookingId: booking.id } })}
            className="ml-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EF8354] hover:bg-[#4F5D75] text-white font-semibold text-sm shadow-md shadow-[#EF8354]/20 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Payments</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-0 pr-1">

        {/* Status timeline */}
        <Section title="Booking Progress">
          <div className="flex items-center gap-1 flex-wrap">
            {statusSteps.map((step, i) => {
              const isDone    = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                    isCurrent ? "bg-[#EF8354] text-white" : isDone ? "bg-[#EF8354]/20 text-[#EF8354]" : "bg-slate-100 text-slate-400"
                  }`}>
                    {isDone && !isCurrent && <Check className="w-2.5 h-2.5" />}
                    {step.replace("_", " ")}
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`w-3 h-0.5 ${i < currentStepIndex ? "bg-[#EF8354]" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
          {booking.status === "CANCELLED" && (
            <p className="mt-3 text-xs text-red-500 font-semibold bg-red-50 rounded-xl px-3 py-2">
              ❌ This booking has been cancelled.
            </p>
          )}
          {booking.status === "REJECTED" && (
            <p className="mt-3 text-xs text-red-500 font-semibold bg-red-50 rounded-xl px-3 py-2">
              ❌ You rejected this quote. Feel free to submit a new booking.
            </p>
          )}
          {canDownloadPdf && (
            <button
              onClick={handleDownloadPdf}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#EF8354]/30 text-[#4F5D75] font-semibold text-sm hover:bg-[#EF8354]/10 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          )}
        </Section>

        {/* ── QUOTED — accept or reject ── */}
        {booking.status === "QUOTED" && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-4">
            <p className="text-sm font-bold text-slate-800 mb-1">Price Quote Received!</p>
            <p className="text-2xl font-bold text-[#EF8354] mb-1">
              LKR {Number(booking.quotedPrice).toLocaleString('en-LK')}
            </p>

            {booking.adminNote && (
              <div className="bg-white rounded-xl border border-blue-100 px-4 py-3 mb-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Note from Admin</p>
                <p className="text-sm font-medium text-slate-700 italic">"{booking.adminNote}"</p>
              </div>
            )}

            {/* Show assigned vehicle to customer */}
            {booking.assignedVehicle && (
              <div className="bg-white rounded-xl border border-blue-100 px-4 py-3 mb-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Your Assigned Vehicle</p>
                <p className="text-sm font-bold text-slate-800">
                  🚗 {booking.assignedVehicle.name}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {booking.assignedVehicle.plateNumber} · {booking.assignedVehicle.type}
                </p>
              </div>
            )}

            <p className="text-xs text-slate-500 mb-4">Accept to proceed, or reject to cancel this booking.</p>
            <div className="flex gap-3">
              <button onClick={async () => {
                  await acceptQuote(booking.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-[#EF8354] text-white py-2.5 rounded-xl font-semibold hover:bg-[#4F5D75] transition-colors cursor-pointer">
                <Check className="w-4 h-4" /> Accept Quote
              </button>
              <button onClick={() => rejectQuote(booking.id)}
                className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-xl font-semibold hover:bg-red-50 transition-colors cursor-pointer">
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        )}

        {booking.adminNote && ["CONFIRMED", "TOUR_STARTED", "COMPLETED", "CLOSED"].includes(booking.status) && (
          <Section title="Admin's Note" accent>
            <div className="bg-[#EF8354]/5 border border-[#EF8354]/10 rounded-xl p-4 mt-1">
              <p className="text-sm font-medium text-slate-700 italic">"{booking.adminNote}"</p>
            </div>
          </Section>
        )}

        {/* ── CONFIRMED — show vehicle info ── */}
        {["CONFIRMED", "TOUR_STARTED", "COMPLETED", "CLOSED"].includes(booking.status) && booking.assignedVehicle && (
          <Section title="Your Assigned Vehicle" accent>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-10 bg-[#EF8354]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Car className="w-5 h-5 text-[#EF8354]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{booking.assignedVehicle.name}</p>
                <p className="text-xs text-slate-500 font-mono">{booking.assignedVehicle.plateNumber} · {booking.assignedVehicle.type}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-400">Quoted Price</p>
                <p className="text-lg font-extrabold text-[#EF8354]">
                  LKR {Number(booking.quotedPrice).toLocaleString('en-LK')}
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* ── CANCEL button (customer) ── */}
        {canCancel && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-xs text-slate-500 mb-3">
              Need to cancel? You can cancel this booking. Please note cancellation policies may apply.
            </p>
            <button
              onClick={() => cancelBooking(booking.id)}
              className="flex items-center gap-2 border border-red-300 text-red-600 bg-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-50 transition-colors cursor-pointer text-sm"
            >
              <X className="w-4 h-4" /> Cancel This Booking
            </button>
          </div>
        )}

        {/* Trip details */}
        <Section title="Trip Details">
          {booking.tourType === "P2P" && (
            <>
              <DetailRow
                icon={MapPin}
                label="Pickup Location"
                value={
                  booking.startLocation || booking.pickupLocation ? (
                    <span className="flex items-center gap-2 flex-wrap">
                      <span>{booking.startLocation || booking.pickupLocation}</span>
                      {booking.pickupLat != null && booking.pickupLng != null && (
                        <span className="text-[10px] font-medium bg-[#EF8354]/10 text-[#EF8354] px-2 py-0.5 rounded-full border border-[#EF8354]/20">
                          GPS: {Number(booking.pickupLat).toFixed(4)}°, {Number(booking.pickupLng).toFixed(4)}°
                        </span>
                      )}
                    </span>
                  ) : null
                }
              />
              <DetailRow
                icon={MapPin}
                label="Drop-off Location"
                value={
                  booking.endLocation || booking.dropoffLocation ? (
                    <span className="flex items-center gap-2 flex-wrap">
                      <span>{booking.endLocation || booking.dropoffLocation}</span>
                      {booking.dropoffLat != null && booking.dropoffLng != null && (
                        <span className="text-[10px] font-medium bg-[#EF8354]/10 text-[#EF8354] px-2 py-0.5 rounded-full border border-[#EF8354]/20">
                          GPS: {Number(booking.dropoffLat).toFixed(4)}°, {Number(booking.dropoffLng).toFixed(4)}°
                        </span>
                      )}
                    </span>
                  ) : null
                }
              />
            </>
          )}
          <DetailRow icon={Calendar} label="Start Date"   value={booking.startDate} />
          <DetailRow icon={Calendar} label="End Date"     value={booking.endDate} />
          <DetailRow icon={Clock}    label="Pickup Time"  value={booking.pickupTime || null} />
          <DetailRow icon={Calendar} label="Total Days"   value={booking.totalDays ? `${booking.totalDays} day(s)` : null} />
        </Section>

        {/* ── Custom Tour Itinerary ── */}
        {booking.tourType === "CUSTOM" && booking.itinerary && booking.itinerary.length > 0 && (
          <Section title="Tour Itinerary" accent>
            <div className="flex flex-col gap-3 mt-2">
              {booking.itinerary.map((day, idx) => (
                <div key={idx} className="bg-white border border-pink-100 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-pink-500 uppercase tracking-wider">Stop {day.day_number}</span>
                    <span className="text-sm font-extrabold text-slate-800">{day.city_name}</span>
                  </div>
                  {day.activities && day.activities.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Activities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {day.activities.map(act => (
                          <span key={act} className="bg-pink-50 text-pink-600 border border-pink-100 px-2 py-0.5 rounded-md text-xs font-semibold">
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Passengers */}
        <Section title="Passengers & Vehicle">
          <DetailRow icon={Users}    label="Adults"    value={booking.noOfAdults ? `${booking.noOfAdults} adult(s)` : null} />
          {booking.noOfChildren > 0 && (
            <DetailRow icon={Users} label="Children" value={`${booking.noOfChildren} child(ren) — Ages: ${booking.agesOfChildren || "not specified"}`} />
          )}
          {booking.babySeatNeeded && <DetailRow icon={Baby} label="Baby Seat" value="Required" />}
          {(booking.luggage10kg > 0 || booking.luggage25kg > 0 || booking.luggage35kg > 0 || booking.luggageCustomCount > 0) ? (
            <>
              {booking.luggage10kg  > 0 && <DetailRow icon={Briefcase} label="10 kg Bags"    value={`${booking.luggage10kg} piece(s)`} />}
              {booking.luggage25kg  > 0 && <DetailRow icon={Briefcase} label="25 kg Bags"    value={`${booking.luggage25kg} piece(s)`} />}
              {booking.luggage35kg  > 0 && <DetailRow icon={Briefcase} label="35 kg Bags"    value={`${booking.luggage35kg} piece(s)`} />}
              {booking.luggageCustomCount > 0 && (
                <DetailRow icon={Briefcase} label="Custom Luggage"
                  value={booking.luggageCustomDesc || `${booking.luggageCustomCount} item(s)`} />
              )}
            </>
          ) : (
            <DetailRow icon={Briefcase} label="Luggage" value="No luggage specified" />
          )}
          <DetailRow icon={Car} label="Requested Category" value={booking.categoryName || VEHICLE_LABELS[booking.categoryId] || booking.categoryId} />
        </Section>

        {/* Contact */}
        <Section title="Contact Details">
          <DetailRow icon={Phone}    label="Full Name"   value={booking.customerName} />
          <DetailRow icon={Phone}    label="Phone"       value={booking.customerPhone} />
          <DetailRow icon={FileText} label="Email"       value={booking.customerEmail} />
          {booking.notes        && <DetailRow icon={FileText} label="Notes"         value={booking.notes} />}
          {booking.tourThoughts && <DetailRow icon={FileText} label="Tour Thoughts" value={booking.tourThoughts} />}
        </Section>

        {/* Emergency Contact */}
        {(booking.emergencyName || booking.emergencyPhone) && (
          <Section title="Emergency Contact">
            <DetailRow icon={AlertTriangle} label="Name"         value={booking.emergencyName} />
            <DetailRow icon={AlertTriangle} label="Relationship" value={booking.emergencyRelationship} />
            <DetailRow icon={Phone}         label="Phone"        value={booking.emergencyPhone} />
          </Section>
        )}

        {/* Booking info */}
        <Section title="Booking Info">
          <DetailRow icon={Calendar}  label="Submitted On"        value={booking.bookingDate} />
          <DetailRow icon={FileText}  label="Booking Reference"   value={booking.bookingRef || getBookingReferenceForBooking(booking)} />
          {booking.tourType === "PACKAGE" && booking.packageName && (
            <DetailRow icon={FileText} label="Package" value={booking.packageName} />
          )}
        </Section>

        {/* Package tour weather — not shown for P2P or customized tours */}
        <BookingWeatherPanel booking={booking} />

      </div>
    </motion.div>
  );
};

export default MyBookingDetail;
