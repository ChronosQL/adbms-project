// Minimal mapping of country names to emoji flags. Extend as needed.
const COUNTRY_FLAGS = {
  'Sri Lanka': '🇱🇰',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Nepal': '🇳🇵',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'India': '🇮🇳',
  'Japan': '🇯🇵',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Brazil': '🇧🇷',
  'Netherlands': '🇳🇱',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Mexico': '🇲🇽',
  'China': '🇨🇳',
  'South Africa': '🇿🇦',
  'New Zealand': '🇳🇿',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Philippines': '🇵🇭',
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬',
  'Hong Kong': '🇭🇰',
  'South Korea': '🇰🇷',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Turkey': '🇹🇷',
  'Greece': '🇬🇷',
  'Ireland': '🇮🇪',
  'Switzerland': '🇨🇭',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Belgium': '🇧🇪',
  'Austria': '🇦🇹',
  'Poland': '🇵🇱',
  'Portugal': '🇵🇹',
  'Israel': '🇮🇱',
  'Russia': '🇷🇺',
  'Ukraine': '🇺🇦',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
};

export const getCountryFlag = (country) => {
  if (!country) return '🌍';
  // Accept either full country or short codes
  const key = String(country).trim();
  return COUNTRY_FLAGS[key] || '🌍';
};

export default COUNTRY_FLAGS;
