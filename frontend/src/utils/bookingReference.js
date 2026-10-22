export const normalizeTourType = (tourType) => {
  if (!tourType) return "P2P";
  const normalized = String(tourType).trim().toUpperCase();
  return normalized === "PACKAGE" ? "PACKAGE" : "P2P";
};

export const getBookingReference = (tourType, bookingId) => {
  const type = normalizeTourType(tourType);
  const typeCode = type === "PACKAGE" ? "PKG" : "P2P";
  return `CBT-${typeCode}-${bookingId}`;
};

export const getBookingReferenceForBooking = (booking) => {
  if (!booking) return "";
  return getBookingReference(booking.tourType, booking.id);
};
