import { useState, useEffect } from "react";
import {
  X, MapPin, Calendar, Users, Car, Phone, FileText, Clock,
  Banknote, CheckCircle2, XCircle, Truck, Flag,
  Archive, Hash, Package, Compass, AlertTriangle, Briefcase,
} from "lucide-react";
import { StatusChip, TourTypeChip } from "./BookingChips";
import { VEHICLE_LABELS, TOUR_TYPE_CFG, formatPhone } from "./BookingConstants";
import { api } from "../../../../config/api";
import { useBookings } from "../../../../context/BookingsContext";

export default function BookingModal({ booking, dark, onClose, onSetQuote, onUpdateStatus }) {
  const [price,  setPrice]  = useState(booking.quotedPrice ?? "");
  const [vPlate, setVPlate] = useState(booking.assignedVehicle?.plateNumber ?? "");
  const [vType,  setVType]  = useState(booking.assignedVehicle?.type ?? (booking.categoryName || VEHICLE_LABELS[booking.categoryId] || ""));
  const [selectedCategoryId, setSelectedCategoryId] = useState(booking.categoryId ? String(booking.categoryId) : "");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [err,    setErr]    = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(booking.vehicleId ? String(booking.vehicleId) : "");

  const { getPaymentsForBooking, recordPayment, updateAdditionalCharges } = useBookings();
  const [paymentsData, setPaymentsData] = useState(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [recInstallment, setRecInstallment] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recMethod, setRecMethod] = useState("CASH");
  const [recDate, setRecDate] = useState(new Date().toISOString().split("T")[0]);
  const [recNotes, setRecNotes] = useState("");
  const [recError, setRecError] = useState("");
  const [recSuccess, setRecSuccess] = useState("");
  const [recSubmitting, setRecSubmitting] = useState(false);

  const [addlChargeInput, setAddlChargeInput] = useState("");
  const [addlChargeSaving, setAddlChargeSaving] = useState(false);

  const bg     = dark ? "#0f172a" : "#f8fafc";
  const card   = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const tm     = dark ? "#f1f5f9" : "#0f172a";
  const ts     = dark ? "#64748b" : "#94a3b8";

  const tourCfg = TOUR_TYPE_CFG[booking.tourType] || {};

  const loadPayments = () => {
    if (!booking.id) return;
    setPaymentsLoading(true);
    getPaymentsForBooking(booking.id)
      .then(data => {
        setPaymentsData(data);
        if (data && data.remainingAmount > 0) {
          const nextPending = data.installments.find(i => i.status === 'PENDING' || i.status === 'OVERDUE');
          if (nextPending) {
            setRecInstallment(nextPending.type === 'Deposit' ? 'DEPOSIT' : nextPending.type === 'Final Payment' ? 'FINAL' : 'FULL');
            setRecAmount(nextPending.rawAmount || "");
          } else {
            setRecInstallment(booking.tourType === 'P2P' ? 'FULL' : 'DEPOSIT');
            setRecAmount(data.remainingAmount);
          }
        } else {
          setRecInstallment("");
          setRecAmount("");
        }
      })
      .catch(err => console.error("Error fetching booking payments:", err))
      .finally(() => setPaymentsLoading(false));
  };

  const getBookingDays = () => {
    if (booking.totalDays && Number(booking.totalDays) > 0) {
      return Number(booking.totalDays);
    }
    if (booking.startDate && booking.endDate) {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    }
    return 1;
  };

  const loadVehicles = async (categoryId) => {
    if (!categoryId) {
      setVehicles([]);
      return;
    }
    setVehiclesLoading(true);
    try {
      const data = await api.get(`/vehicles/category/${categoryId}`);
      setVehicles(data.data || []);
      if (booking.vehicleId) setSelectedVehicleId(booking.vehicleId);
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await api.get('/vehicles/categories');
      setCategories(data.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    setPrice(booking.quotedPrice ?? "");
    setVPlate(booking.assignedVehicle?.plateNumber ?? "");
    setVType(booking.assignedVehicle?.type ?? (booking.categoryName || VEHICLE_LABELS[booking.categoryId] || ""));
    setSelectedCategoryId(booking.categoryId ? String(booking.categoryId) : "");
    setSelectedVehicleId(booking.vehicleId ? String(booking.vehicleId) : "");

    loadPayments();
    loadCategories();
    loadVehicles(booking.categoryId);
    setRecNotes("");
    setRecError("");
    setRecSuccess("");
  }, [booking]);

  useEffect(() => {
    if (categories.length) {
      if (!selectedCategoryId && booking.categoryName) {
        const match = categories.find(c => String(c.name).trim().toLowerCase() === String(booking.categoryName).trim().toLowerCase());
        if (match) {
          setSelectedCategoryId(String(match.id));
          setVType(match.name || booking.categoryName);
          return;
        }
      }

      if (selectedCategoryId) {
        const selectedCategory = categories.find(c => String(c.id) === String(selectedCategoryId));
        if (selectedCategory) {
          setVType(selectedCategory.name);
        }
      }
    }
  }, [categories, selectedCategoryId, booking.categoryName]);

  useEffect(() => {
    if (selectedCategoryId) {
      loadVehicles(selectedCategoryId);
    } else {
      setVehicles([]);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    if (selectedVehicleId && vehicles.length) {
      const selectedVehicle = vehicles.find((v) => String(v.id) === String(selectedVehicleId));
      const days = getBookingDays();
      if (selectedVehicle && selectedVehicle.price_per_day != null) {
        setPrice((Number(selectedVehicle.price_per_day) * days).toFixed(2));
      }
    }
  }, [selectedVehicleId, vehicles]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!recInstallment) { setRecError("Select installment type"); return; }
    const amt = parseFloat(recAmount);
    if (isNaN(amt) || amt <= 0) { setRecError("Enter a valid amount"); return; }
    if (!recDate) { setRecError("Select received date"); return; }

    setRecSubmitting(true);
    setRecError("");
    setRecSuccess("");
    try {
      await recordPayment({
        booking_id: booking.id,
        installment: recInstallment,
        amount: amt,
        payment_method: recMethod,
        received_date: recDate,
        notes: recNotes.trim() || null
      });
      setRecSuccess("Payment recorded successfully!");
      setRecNotes("");
      loadPayments();
    } catch (err) {
      console.error(err);
      setRecError(err.message || "Failed to record payment");
    } finally {
      setRecSubmitting(false);
    }
  };

  const handleAddlCharge = async (e) => {
    e.preventDefault();
    setRecError("");
    setRecSuccess("");
    if (!addlChargeInput || isNaN(Number(addlChargeInput))) {
      setRecError("Please enter a valid amount.");
      return;
    }
    try {
      setAddlChargeSaving(true);
      await updateAdditionalCharges(booking.id, addlChargeInput);
      setRecSuccess("Additional charges updated successfully!");
      setAddlChargeInput("");
      loadPayments();
    } catch (err) {
      console.error(err);
      setRecError(err.message || "Failed to update additional charges");
    } finally {
      setAddlChargeSaving(false);
    }
  };


  const handleSendQuote = () => {
    const p = parseFloat(price);
    if (!price || isNaN(p) || p <= 0) { setErr("Enter a valid price"); return; }
    if (!selectedVehicleId) { setErr("Select a vehicle"); return; }
    const selectedVehicle = vehicles.find((v) => String(v.id) === String(selectedVehicleId));
    if (!selectedVehicle) { setErr("Selected vehicle not found"); return; }
    if (!vPlate.trim()) { setErr("Enter plate number"); return; }
    const vehicleName = selectedVehicle.vehicle_name || selectedVehicle.name || "";
    onSetQuote(booking.id, p, { id: selectedVehicle.id, name: vehicleName, plateNumber: vPlate.trim(), type: vType.trim() });
    setErr("");
  };

  // Shared detail row
  const Row = ({ icon: Icon, label, value }) => !value ? null : (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${border}` }}>
      {Icon && <Icon size={15} color="#EF8354" style={{ flexShrink: 0, marginTop: 2 }} />}
      <div>
        <p style={{ margin: 0, fontSize: 10, color: ts, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: tm, fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  );

  const SectionTitle = ({ children, color = "#EF8354" }) => (
    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: ".08em" }}>
      {children}
    </p>
  );

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    border: `1px solid ${border}`, borderRadius: 10,
    padding: "9px 12px", fontSize: 13,
    color: tm, background: card, outline: "none",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: bg, borderRadius: 24, width: "100%", maxWidth: 680, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 40px 100px rgba(0,0,0,0.4)" }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div style={{ padding: "18px 24px", background: "linear-gradient(120deg,#2D3142,#4F5D75)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Booking</p>
            <h2 style={{ margin: "2px 0 6px", color: "white", fontWeight: 900, fontSize: 20 }}>{booking.id}</h2>
            <TourTypeChip tourType={booking.tourType} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusChip status={booking.status} />
            <button
              onClick={onClose}
              style={{ background: "white", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", color: "#2D3142", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flexShrink: 0 }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>

          {/* Tour type banner */}
          {tourCfg.label && (
            <div style={{ background: tourCfg.bg || "rgba(239,131,84,0.08)", border: `1px solid ${tourCfg.color || "#EF8354"}40`, borderRadius: 12, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: ts, fontWeight: 600 }}>Booking Type</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: tourCfg.color }}>{tourCfg.label}</p>
              </div>
            </div>
          )}

          {/* Trip details */}
          <SectionTitle>Trip Details</SectionTitle>
          <div style={{ background: card, borderRadius: 14, padding: "4px 16px", border: `1px solid ${border}`, marginBottom: 16 }}>
            {booking.tourType === "P2P" && (
              <>
                <Row icon={MapPin} label="Pickup Location"   value={booking.pickupLocation || booking.startLocation} />
                <Row icon={MapPin} label="Drop-off Location" value={booking.dropoffLocation || booking.endLocation} />
              </>
            )}
            {booking.tourType === "PACKAGE" && (
              <Row icon={Package} label="Package" value={booking.packageName || booking.tourPackage || "Package Tour"} />
            )}
            {booking.tourType === "CUSTOM" && (
              <Row icon={Compass} label="Destination / Details" value={booking.destination || booking.customDestination || booking.notes || "See notes"} />
            )}
            <Row icon={Calendar} label="Start Date" value={booking.startDate} />
            <Row icon={Calendar} label="End Date"   value={booking.endDate} />
            <Row icon={Clock}    label="Pickup Time" value={booking.pickupTime || null} />
            <Row icon={Calendar} label="Total Days" value={booking.totalDays ? `${booking.totalDays} day(s)` : null} />
          </div>

          {/* Passengers */}
          <SectionTitle>Passengers & Vehicle</SectionTitle>
          <div style={{ background: card, borderRadius: 14, padding: "4px 16px", border: `1px solid ${border}`, marginBottom: 16 }}>
            <Row icon={Users}    label="Adults"   value={booking.noOfAdults} />
            {booking.noOfChildren > 0 && <Row icon={Users} label="Children" value={`${booking.noOfChildren} (Ages: ${booking.agesOfChildren || "—"})`} />}
            {booking.babySeatNeeded && <Row icon={Users} label="Baby Seat" value="Required" />}
            <Row icon={Car} label="Requested Category" value={booking.categoryName || VEHICLE_LABELS[booking.categoryId] || booking.categoryId} />
            {(booking.luggage10kg > 0 || booking.luggage25kg > 0 || booking.luggage35kg > 0 || booking.luggageCustomCount > 0) ? (
              <>
                {booking.luggage10kg  > 0 && <Row icon={Briefcase} label="10 kg Bags"    value={`${booking.luggage10kg} piece(s)`} />}
                {booking.luggage25kg  > 0 && <Row icon={Briefcase} label="25 kg Bags"    value={`${booking.luggage25kg} piece(s)`} />}
                {booking.luggage35kg  > 0 && <Row icon={Briefcase} label="35 kg Bags"    value={`${booking.luggage35kg} piece(s)`} />}
                {booking.luggageCustomCount > 0 && (
                  <Row icon={Briefcase} label="Custom Luggage"
                    value={booking.luggageCustomDesc || `${booking.luggageCustomCount} item(s)`} />
                )}
              </>
            ) : (
              <Row icon={Briefcase} label="Luggage" value="No luggage specified" />
            )}
          </div>

          {/* Customer */}
          <SectionTitle>Customer</SectionTitle>
          <div style={{ background: card, borderRadius: 14, padding: "4px 16px", border: `1px solid ${border}`, marginBottom: 16 }}>
            <Row icon={Phone}    label="Full Name" value={booking.customerName} />
            <Row icon={Phone}    label="Phone"     value={formatPhone(booking.customerPhone)} />
            <Row icon={FileText} label="Email"     value={booking.customerEmail} />
            {booking.notes        && <Row icon={FileText} label="Notes"         value={booking.notes} />}
            {booking.tourThoughts && <Row icon={FileText} label="Tour Thoughts" value={booking.tourThoughts} />}
          </div>

          {/* Emergency Contact */}
          {(booking.emergencyName || booking.emergencyPhone) && (
            <>
              <SectionTitle color="#f59e0b">Emergency Contact</SectionTitle>
              <div style={{ background: card, borderRadius: 14, padding: "4px 16px", border: `1px solid ${border}`, marginBottom: 16 }}>
                <Row icon={AlertTriangle} label="Name"         value={booking.emergencyName} />
                <Row icon={AlertTriangle} label="Relationship" value={booking.emergencyRelationship} />
                <Row icon={Phone}         label="Phone"        value={formatPhone(booking.emergencyPhone)} />
              </div>
            </>
          )}

          {/* Already assigned vehicle */}
          {booking.assignedVehicle && (
            <>
              <SectionTitle color="#6366f1">Assigned Vehicle</SectionTitle>
              <div style={{ background: dark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)", borderRadius: 14, padding: "4px 16px", border: "1px solid rgba(99,102,241,0.2)", marginBottom: 16 }}>
                <Row icon={Car}  label="Vehicle Name"  value={booking.assignedVehicle.name} />
                <Row icon={Hash} label="Plate Number"  value={booking.assignedVehicle.plateNumber} />
                <Row icon={Car}  label="Vehicle Type"  value={booking.assignedVehicle.type} />
              </div>
            </>
          )}

          {/* ── Quote + vehicle assignment (PENDING or QUOTED) ── */}
          {(booking.status === "PENDING" || booking.status === "QUOTED") && (
            <div style={{ background: dark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: "#6366f1" }}>Set Price & Assign Vehicle</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: ts, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 4 }}>Price (USD) *</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: card, border: `1px solid ${border}`, borderRadius: 10, padding: "9px 12px" }}>
                    <Banknote size={14} color="#EF8354" />
                    <input type="number" value={price} onChange={e => { setPrice(e.target.value); setErr(""); }} placeholder="0.00"
                      style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: tm, width: "100%", fontWeight: 600 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: ts, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 4 }}>Vehicle Category *</label>
                  <select value={selectedCategoryId} onChange={e => {
                    const categoryId = e.target.value;
                    setSelectedCategoryId(categoryId);
                    setErr("");
                    const category = categories.find(c => String(c.id) === String(categoryId));
                    if (category) {
                      setVType(category.name);
                    } else {
                      setVType(booking.categoryName || VEHICLE_LABELS[booking.categoryId] || "");
                    }
                    setSelectedVehicleId("");
                    setVPlate("");
                    setPrice(booking.quotedPrice ?? "");
                  }} style={inputStyle}>
                    <option value="">{categoriesLoading ? "Loading categories..." : "Select vehicle category"}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: ts, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 4 }}>Vehicle Name *</label>
                  <select value={selectedVehicleId} onChange={e => {
                    const vehicleId = e.target.value;
                    setSelectedVehicleId(vehicleId);
                    setErr("");
                    const vehicle = vehicles.find(v => String(v.id) === String(vehicleId));
                    if (vehicle) {
                      setVPlate(vehicle.vehicle_number || vehicle.license_plate || "");
                      setVType(vehicle.category_name || booking.categoryName || VEHICLE_LABELS[booking.categoryId] || "");
                    }
                  }} style={inputStyle}>
                    <option value="">{vehiclesLoading ? "Loading vehicles..." : "Select a vehicle"}</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_name ? `${v.vehicle_name} (${v.vehicle_number || v.license_plate || 'No plate'})` : `${v.vehicle_number || v.license_plate || 'Unnamed vehicle'}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: ts, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 4 }}>Plate Number *</label>
                  <input value={vPlate} onChange={e => { setVPlate(e.target.value); setErr(""); }} placeholder="e.g. CAB-1234" style={{ ...inputStyle, textTransform: "uppercase" }} />
                </div>
              </div>
              {err && <p style={{ margin: "0 0 10px", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{err}</p>}
              <button onClick={handleSendQuote} style={{ width: "100%", background: "#6366f1", color: "white", border: "none", borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                📨 Send Quote to Customer
              </button>
              {booking.quotedPrice && (
                <p style={{ margin: "8px 0 0", fontSize: 12, color: ts, textAlign: "center" }}>
                  Current quote: <strong style={{ color: "#6366f1" }}>${booking.quotedPrice}</strong>
                  {booking.assignedVehicle && ` · ${booking.assignedVehicle.name} (${booking.assignedVehicle.plateNumber})`}
                </p>
              )}
            </div>
          )}

          {/* ACCEPTED → confirm */}
          {booking.status === "ACCEPTED" && (
            <div style={{ background: dark ? "rgba(16,185,129,0.07)" : "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: "#2F9E44" }}>
                ✅ Customer accepted — ${booking.quotedPrice}
              </p>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: ts }}>
                Confirm to lock this booking.{booking.assignedVehicle ? ` Vehicle: ${booking.assignedVehicle.name} (${booking.assignedVehicle.plateNumber})` : ""}
              </p>
              <button onClick={() => onUpdateStatus(booking.id, "CONFIRMED")}
                style={{ background: "#2F9E44", color: "white", border: "none", borderRadius: 12, padding: "10px 28px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={15} /> Confirm Booking
              </button>
            </div>
          )}

          {/* ── Payments Section (Admins) ── */}
          {booking.quotedPrice && (
            <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 20, marginBottom: 16 }}>
              <SectionTitle color="#EF8354">💳 Payment History & Record</SectionTitle>
              
              {/* Payment Summary Indicators */}
              {paymentsData && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "10px 0 15px", background: bg, padding: 12, borderRadius: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: ts, fontWeight: 700, textTransform: "uppercase" }}>Total Price</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: tm }}>
                      LKR {paymentsData.totalAmount.toLocaleString('en-LK')}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: ts, fontWeight: 700, textTransform: "uppercase" }}>Paid Amount</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: "#2F9E44" }}>
                      LKR {paymentsData.paidAmount.toLocaleString('en-LK')}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: ts, fontWeight: 700, textTransform: "uppercase" }}>Remaining</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: paymentsData.remainingAmount > 0 ? "#f59e0b" : "#2F9E44" }}>
                      LKR {paymentsData.remainingAmount.toLocaleString('en-LK')}
                    </p>
                  </div>
                </div>
              )}

              {/* Transactions List */}
              {paymentsLoading ? (
                <p style={{ fontSize: 12, color: ts }}>Loading payment records...</p>
              ) : paymentsData && paymentsData.transactions.length > 0 ? (
                <div style={{ marginBottom: 15 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: tm }}>Recorded Payments:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {paymentsData.transactions.map((tx) => (
                      <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: bg, padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}`, fontSize: 12 }}>
                        <div>
                          <strong style={{ color: tm }}>{tx.type} ({tx.method})</strong>
                          <p style={{ margin: 0, fontSize: 10, color: ts }}>Received {tx.date} · Rec: {tx.recordedBy}</p>
                          {tx.notes && <p style={{ margin: "2px 0 0", fontSize: 10, color: ts, fontStyle: "italic" }}>"{tx.notes}"</p>}
                        </div>
                        <span style={{ fontWeight: 700, color: "#2F9E44" }}>{tx.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: ts, fontStyle: "italic", marginBottom: 15 }}>No payments recorded yet.</p>
              )}

              {/* Additional Charges Form */}
              {booking.tourType !== 'P2P' && paymentsData && (
                <form onSubmit={handleAddlCharge} style={{ borderTop: `1px solid ${border}`, paddingTop: 15, paddingBottom: 15 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 800, color: tm }}>➕ Add Additional Mileage Charges</p>
                  
                  {paymentsData.paidAmount < paymentsData.baseAmount ? (
                    <div style={{ background: "rgba(245,158,11,0.1)", padding: 10, borderRadius: 8, border: "1px solid rgba(245,158,11,0.2)" }}>
                      <p style={{ margin: 0, fontSize: 11, color: "#b45309", fontWeight: 600 }}>⚠️ Cannot add additional charges yet. The quoted base price must be fully paid and approved first.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <input 
                          type="number" 
                          value={addlChargeInput} 
                          onChange={e => setAddlChargeInput(e.target.value)} 
                          placeholder="Amount in LKR" 
                          style={inputStyle}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={addlChargeSaving}
                        style={{ background: "#0d9488", color: "white", border: "none", borderRadius: 8, padding: "0 20px", fontWeight: 700, fontSize: 11, cursor: "pointer", opacity: addlChargeSaving ? 0.7 : 1 }}
                      >
                        {addlChargeSaving ? "Saving..." : "Update"}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Record Form */}
              {paymentsData && paymentsData.remainingAmount > 0 ? (
                <form onSubmit={handleRecordPayment} style={{ borderTop: `1px solid ${border}`, paddingTop: 15 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 800, color: tm }}>✍️ Record Received Payment</p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: ts, display: "block", marginBottom: 4 }}>Installment Type *</label>
                      <select 
                        value={recInstallment} 
                        onChange={e => {
                          setRecInstallment(e.target.value);
                          if (e.target.value === 'DEPOSIT') setRecAmount(paymentsData.totalAmount * 0.5);
                          else if (e.target.value === 'FINAL') setRecAmount(paymentsData.totalAmount * 0.5);
                          else if (e.target.value === 'ADDITIONAL') {
                            const addl = paymentsData.installments?.find(i => i.type === 'Additional Charges');
                            setRecAmount(addl ? addl.rawAmount : 0);
                          }
                          else if (e.target.value === 'FULL') setRecAmount(paymentsData.remainingAmount);
                        }} 
                        style={inputStyle}
                      >
                        <option value="">-- Select --</option>
                        {booking.tourType !== 'P2P' && <option value="DEPOSIT">DEPOSIT (50%)</option>}
                        {booking.tourType !== 'P2P' && <option value="FINAL">FINAL (50%)</option>}
                        {booking.tourType !== 'P2P' && paymentsData.installments?.some(i => i.type === 'Additional Charges') && (
                          <option value="ADDITIONAL">ADDITIONAL CHARGES</option>
                        )}
                        <option value="FULL">FULL PAYMENT</option>
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: ts, display: "block", marginBottom: 4 }}>Amount Received (LKR) *</label>
                      <input 
                        type="number" 
                        value={recAmount} 
                        onChange={e => setRecAmount(e.target.value)} 
                        placeholder="0.00" 
                        style={inputStyle} 
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: ts, display: "block", marginBottom: 4 }}>Payment Method *</label>
                      <select value={recMethod} onChange={e => setRecMethod(e.target.value)} style={inputStyle}>
                        <option value="CASH">CASH</option>
                        <option value="BANK_TRANSFER">BANK TRANSFER</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: ts, display: "block", marginBottom: 4 }}>Date Received *</label>
                      <input type="date" value={recDate} onChange={e => setRecDate(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: ts, display: "block", marginBottom: 4 }}>Notes (Optional)</label>
                    <textarea 
                      value={recNotes} 
                      onChange={e => setRecNotes(e.target.value)} 
                      placeholder="e.g. 50% deposit received in cash" 
                      rows={2} 
                      style={{ ...inputStyle, resize: "none" }} 
                    />
                  </div>

                  {recError && <p style={{ margin: "0 0 10px", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{recError}</p>}
                  {recSuccess && <p style={{ margin: "0 0 10px", fontSize: 12, color: "#2F9E44", fontWeight: 600 }}>{recSuccess}</p>}

                  <button 
                    type="submit" 
                    disabled={recSubmitting}
                    style={{ width: "100%", background: "#EF8354", color: "white", border: "none", borderRadius: 10, padding: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    {recSubmitting ? "Recording..." : "💾 Record Payment"}
                  </button>
                </form>
              ) : (
                paymentsData && paymentsData.remainingAmount <= 0 && (
                  <p style={{ margin: 0, fontSize: 12, color: "#2F9E44", fontWeight: 700, textAlign: "center" }}>
                    🎉 Booking is fully paid.
                  </p>
                )
              )}
            </div>
          )}



          {/* Action buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {booking.status === "CONFIRMED" && (
              <button onClick={() => onUpdateStatus(booking.id, "TOUR_STARTED")}
                style={{ background: "#4F5D75", color: "white", border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Truck size={14} /> Mark Tour Started
              </button>
            )}
            {booking.status === "TOUR_STARTED" && (
              <button onClick={() => onUpdateStatus(booking.id, "COMPLETED")}
                style={{ background: "#4F5D75", color: "white", border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Flag size={14} /> Mark Completed
              </button>
            )}
            {booking.status === "COMPLETED" && (
              <button onClick={() => onUpdateStatus(booking.id, "CLOSED")}
                style={{ background: "rgba(191,192,192,0.25)", color: "#4F5D75", border: "1px solid rgba(148,163,184,0.3)", borderRadius: 12, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Archive size={14} /> Archive (Close)
              </button>
            )}
            {["ACCEPTED", "CONFIRMED"].includes(booking.status) && (
              <button onClick={() => onUpdateStatus(booking.id, "CANCELLED")}
                style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <XCircle size={14} /> Cancel Booking
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
