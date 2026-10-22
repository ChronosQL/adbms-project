import { api } from '../config/api';
 
// Submit a Point-to-Point booking
export const submitP2PBooking = (data) => api.post('/bookings/p2p', data);

// Update an existing booking
export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data);

const buildPackageBookingPayload = (data) => {
  const CATEGORY_LABELS = {
    mini_car: "Mini Car", normal_car: "Normal Car", sedan_car: "Sedan Car",
    mpv: "MPV", suv: "SUV", mini_van: "Mini Van", van: "Van", large_van: "Large Van",
  };
  return {
    tourType: 'PACKAGE',
    packageId: data.packageId,
    packageName: data.packageName,
    customerEmail: data.customerEmail,
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
    contactPlatform: data.contactPlatform || "mobile",
    contactNumber: data.contactNumber,
    contactPlatform2: data.contactPlatform2 || null,
    contactNumber2: data.contactNumber2 || null,
    emergencyName: data.emergencyName,
    emergencyPhone: data.emergencyPhone,
    emergencyRelationship: data.emergencyRelationship,
    notes: data.notes,
  };
};

// Submit a Package booking through the same booking endpoint
export const submitPackageBooking = (data) =>
  api.post('/bookings/p2p', buildPackageBookingPayload(data));
 
// Fetch the logged-in customer's own bookings
export const fetchMyBookings = () => api.get('/bookings/my').then((d) => d.bookings);
 
// Admin: fetch ALL bookings
export const fetchAllBookings = () => api.get('/bookings').then((d) => d.bookings);
 
// Admin: send a price quote
export const sendQuote = (bookingId, quotedPrice, vehicleId) =>
  api.patch(`/bookings/${bookingId}/quote`, { quotedPrice, vehicleId });
 
// Customer: accept or reject a quote. Admin: advance workflow
export const updateBookingStatus = (bookingId, status) =>
  api.patch(`/bookings/${bookingId}/status`, { status });
 
