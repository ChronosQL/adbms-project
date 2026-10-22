// components/pages/Admin/AdminDashboard/adminTheme.jsx
//
// Single source of truth for the Ceylon Best Tours admin brand.
// Import BRAND / FONT / getTheme(dark) anywhere in /Admin instead of
// hardcoding hex values, so the whole dashboard re-themes from one file.

export const BRAND = {
  coral:     "#EF8354", // Coral        — primary brand / CTA buttons, active states
  gunmetal:  "#2D3142", // Gunmetal     — headings text, dark-mode surfaces
  payneGray: "#4F5D75", // Payne's Gray — secondary accent, subtext
  silver:    "#BFC0C0", // Silver       — borders, neutral fills
  white:     "#FFFFFF", // White        — card backgrounds
};

// Functional colors kept separate from brand colors on purpose — statuses
// (success/warning/danger) should read the same regardless of brand accent.
export const STATE = {
  success: "#2F9E44",
  warning: "#E3A857",
  danger:  "#E0483B",
  info:    "#6366F1",
};

export const FONT = {
  // Montserrat — bold, adventurous — used for headings/titles/stat numbers
  heading: "'Montserrat', 'Segoe UI', sans-serif",
  // Open Sans — friendly, modern — used for body copy, labels, table cells
  body: "'Open Sans', 'Segoe UI', sans-serif",
};

// Google Fonts import — inject once (AdminLayout does this) and every
// admin page inherits it since font-family cascades.
export const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap');";

// Returns the light/dark surface palette for the current mode.
export function getTheme(dark) {
  return {
    dark,
    pageBg:      dark ? BRAND.gunmetal : "#F4F4F6",
    cardBg:      dark ? "#383C4E" : BRAND.white,
    cardBorder:  dark ? "rgba(255,255,255,0.08)" : "#E8E8EA",
    headerBg:    dark ? "rgba(255,255,255,0.03)" : "#F7F7F8",
    hoverBg:     dark ? "rgba(255,255,255,0.04)" : "#F7F7F8",
    textPrimary:   dark ? "#F5F5F6" : BRAND.gunmetal,
    textSecondary: dark ? "#B7BAC7" : BRAND.payneGray,
    divider:     dark ? "rgba(255,255,255,0.08)" : "#EEEEF0",
  };
}
