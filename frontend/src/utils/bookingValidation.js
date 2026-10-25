const NUMERIC_CONTACT_PLATFORMS = new Set(["mobile", "whatsapp", "viber", "signal"]);

export const isValidPrimaryPhone = (platform, value) => {
  const normalizedPlatform = String(platform || "mobile").trim().toLowerCase();
  const phone = String(value || "").trim();

  if (!phone) return false;
  if (!NUMERIC_CONTACT_PLATFORMS.has(normalizedPlatform)) return true;

  return /^(?:\+\d{1,3}\s?)?\d{9}$/.test(phone);
};
