// Color utilities for ColorMind

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

// 1. Parsing and Conversions
export function hexToRgb(hex: string): RGB | null {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  h /= 360;
  s /= 100;
  l /= 100;
  let r = l;
  let g = l;
  let b = l;

  if (s !== 0) {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Convert HSL object to string
export function hslToString({ h, s, l }: HSL): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Convert RGB object to string
export function rgbToString({ r, g, b }: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

// Parse any CSS color string to Hex
export function parseColorToHex(color: string): string {
  const clean = color.trim().toLowerCase();
  if (clean.startsWith("#")) {
    return clean;
  }
  if (clean.startsWith("rgb")) {
    const match = clean.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return rgbToHex({ r, g, b });
    }
  }
  if (clean.startsWith("hsl")) {
    const match = clean.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]);
      const l = parseInt(match[3]);
      return rgbToHex(hslToRgb({ h, s, l }));
    }
  }
  
  // Named color fallbacks
  const names: Record<string, string> = {
    white: "#ffffff", black: "#000000", red: "#ff0000", green: "#00ff00",
    blue: "#0000ff", yellow: "#ffff00", transparent: "#00000000"
  };
  return names[clean] || "#888888";
}

// 2. Closest Tailwind Color Matcher
const TAILWIND_PALETTE: Record<string, string> = {
  // Red
  "red-50": "#fef2f2", "red-100": "#fee2e2", "red-200": "#fecaca", "red-300": "#fca5a5",
  "red-400": "#f87171", "red-500": "#ef4444", "red-600": "#dc2626", "red-700": "#b91c1c",
  "red-800": "#991b1b", "red-900": "#7f1d1d", "red-950": "#450a0a",
  // Orange
  "orange-50": "#fff7ed", "orange-100": "#ffedd5", "orange-200": "#fed7aa", "orange-300": "#fdba74",
  "orange-400": "#fb923c", "orange-500": "#f97316", "orange-600": "#ea580c", "orange-700": "#c2410c",
  "orange-800": "#9a3412", "orange-900": "#7c2d12", "orange-950": "#431407",
  // Amber
  "amber-50": "#fffbeb", "amber-100": "#fef3c7", "amber-200": "#fde68a", "amber-300": "#fcd34d",
  "amber-400": "#fbbf24", "amber-500": "#f59e0b", "amber-600": "#d97706", "amber-700": "#b45309",
  "amber-800": "#92400e", "amber-900": "#78350f", "amber-955": "#451a03",
  // Yellow
  "yellow-50": "#fefce8", "yellow-100": "#fef9c3", "yellow-200": "#fef08a", "yellow-300": "#fde047",
  "yellow-400": "#facc15", "yellow-500": "#eab308", "yellow-600": "#ca8a04", "yellow-700": "#a16207",
  "yellow-800": "#854d0e", "yellow-900": "#713f12", "yellow-950": "#422006",
  // Lime
  "lime-50": "#f7fee7", "lime-100": "#ecfccb", "lime-200": "#d9f99d", "lime-300": "#bef264",
  "lime-400": "#a3e635", "lime-500": "#84cc16", "lime-600": "#65a30d", "lime-700": "#4d7c0f",
  "lime-800": "#3f6212", "lime-900": "#365314", "lime-950": "#1a2e05",
  // Green
  "green-50": "#f0fdf4", "green-100": "#dcfce7", "green-200": "#bbf7d0", "green-300": "#86efac",
  "green-400": "#4ade80", "green-500": "#22c55e", "green-600": "#16a34a", "green-700": "#15803d",
  "green-800": "#166534", "green-900": "#14532d", "green-950": "#052e16",
  // Emerald
  "emerald-50": "#ecfdf5", "emerald-100": "#d1fae5", "emerald-200": "#a7f3d0", "emerald-300": "#6ee7b7",
  "emerald-400": "#34d399", "emerald-500": "#10b981", "emerald-600": "#059669", "emerald-700": "#047857",
  "emerald-800": "#065f46", "emerald-900": "#064e3b", "emerald-950": "#022c22",
  // Teal
  "teal-50": "#f0fdfa", "teal-100": "#ccfbf1", "teal-200": "#99f6e4", "teal-300": "#5eead4",
  "teal-400": "#2dd4bf", "teal-500": "#14b8a6", "teal-600": "#0d9488", "teal-700": "#0f766e",
  "teal-800": "#115e59", "teal-900": "#134e4a", "teal-950": "#042f2e",
  // Cyan
  "cyan-50": "#ecfeff", "cyan-100": "#cffafe", "cyan-200": "#a5f3fc", "cyan-300": "#67e8f9",
  "cyan-400": "#22d3ee", "cyan-500": "#06b6d4", "cyan-600": "#0891b2", "cyan-700": "#0e7490",
  "cyan-800": "#155e75", "cyan-900": "#164e63", "cyan-950": "#083344",
  // Sky
  "sky-50": "#f0f9ff", "sky-100": "#e0f2fe", "sky-200": "#bae6fd", "sky-300": "#7dd3fc",
  "sky-400": "#38bdf8", "sky-500": "#0ea5e9", "sky-600": "#0284c7", "sky-700": "#0369a1",
  "sky-800": "#075985", "sky-900": "#0c4a6e", "sky-950": "#082f49",
  // Blue
  "blue-50": "#eff6ff", "blue-100": "#dbeafe", "blue-200": "#bfdbfe", "blue-300": "#93c5fd",
  "blue-400": "#60a5fa", "blue-500": "#3b82f6", "blue-600": "#2563eb", "blue-700": "#1d4ed8",
  "blue-800": "#1e40af", "blue-900": "#1e3a8a", "blue-950": "#172554",
  // Indigo
  "indigo-50": "#eef2ff", "indigo-100": "#e0e7ff", "indigo-200": "#c7d2fe", "indigo-300": "#a5b4fc",
  "indigo-400": "#818cf8", "indigo-500": "#6366f1", "indigo-600": "#4f46e5", "indigo-700": "#4338ca",
  "indigo-800": "#3730a3", "indigo-900": "#312e81", "indigo-950": "#1e1b4b",
  // Violet
  "violet-50": "#f5f3ff", "violet-100": "#ede9fe", "violet-200": "#ddd6fe", "violet-300": "#c4b5fd",
  "violet-400": "#a78bfa", "violet-500": "#8b5cf6", "violet-600": "#7c3aed", "violet-700": "#6d28d9",
  "violet-800": "#5b21b6", "violet-900": "#4c1d95", "violet-950": "#2e1065",
  // Purple
  "purple-50": "#faf5ff", "purple-100": "#f3e8ff", "purple-200": "#e9d5ff", "purple-300": "#d8b4fe",
  "purple-400": "#c084fc", "purple-500": "#a855f7", "purple-600": "#9333ea", "purple-700": "#7e22ce",
  "purple-800": "#6b21a8", "purple-900": "#581c87", "purple-950": "#3b0764",
  // Fuchsia
  "fuchsia-50": "#fdf4ff", "fuchsia-100": "#fae8ff", "fuchsia-200": "#f5d0fe", "fuchsia-300": "#f0abfc",
  "fuchsia-400": "#e879f9", "fuchsia-500": "#d946ef", "fuchsia-600": "#c026d3", "fuchsia-700": "#a21caf",
  "fuchsia-800": "#86198f", "fuchsia-900": "#701a75", "fuchsia-950": "#4a044e",
  // Pink
  "pink-50": "#fdf2f8", "pink-100": "#fce7f3", "pink-200": "#fbcfe8", "pink-300": "#f472b6",
  "pink-400": "#f472b6", "pink-500": "#ec4899", "pink-600": "#db2777", "pink-700": "#be185d",
  "pink-800": "#9d174d", "pink-900": "#831843", "pink-950": "#500724",
  // Rose
  "rose-50": "#fff1f2", "rose-100": "#ffe4e6", "rose-200": "#fecdd3", "rose-300": "#fda4af",
  "rose-400": "#fb7185", "rose-500": "#f43f5e", "rose-600": "#e11d48", "rose-700": "#be123c",
  "rose-800": "#9f1239", "rose-900": "#881337", "rose-950": "#4c0519",
  // Slate
  "slate-50": "#f8fafc", "slate-100": "#f1f5f9", "slate-200": "#e2e8f0", "slate-300": "#cbd5e1",
  "slate-400": "#94a3b8", "slate-500": "#64748b", "slate-600": "#475569", "slate-700": "#334155",
  "slate-800": "#1e293b", "slate-900": "#0f172a", "slate-950": "#020617",
  // Zinc
  "zinc-50": "#fafafa", "zinc-100": "#f4f4f5", "zinc-200": "#e4e4e7", "zinc-300": "#d4d4d8",
  "zinc-400": "#a1a1aa", "zinc-500": "#71717a", "zinc-600": "#52525b", "zinc-700": "#3f3f46",
  "zinc-800": "#27272a", "zinc-900": "#18181b", "zinc-950": "#09090b",
  // Neutral
  "neutral-50": "#fafafa", "neutral-100": "#f5f5f5", "neutral-200": "#e5e5e5", "neutral-300": "#d4d4d4",
  "neutral-400": "#a3a3a3", "neutral-500": "#737373", "neutral-600": "#525252", "neutral-700": "#404040",
  "neutral-800": "#262626", "neutral-900": "#171717", "neutral-950": "#0a0a0a",
  // Stone
  "stone-50": "#fafaf9", "stone-100": "#f5f5f4", "stone-200": "#e7e5e4", "stone-300": "#d6d3d1",
  "stone-400": "#a8a29e", "stone-500": "#78716c", "stone-600": "#57534e", "stone-700": "#44403c",
  "stone-800": "#292524", "stone-900": "#1c1917", "stone-950": "#0c0a09",
};

export function findClosestTailwindColor(hex: string): string {
  const currentRgb = hexToRgb(hex);
  if (!currentRgb) return "custom";

  let minDistance = Infinity;
  let closestName = "custom";

  for (const [name, twHex] of Object.entries(TAILWIND_PALETTE)) {
    const twRgb = hexToRgb(twHex);
    if (!twRgb) continue;

    // Euclidean distance in RGB color space
    const distance = Math.sqrt(
      Math.pow(currentRgb.r - twRgb.r, 2) +
      Math.pow(currentRgb.g - twRgb.g, 2) +
      Math.pow(currentRgb.b - twRgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestName = name;
    }
  }

  // If distance is too far (e.g. over 80), suggest it is custom but approximate
  return minDistance < 70 ? closestName : `~${closestName}`;
}

// 3. Exporters
export function getTailwindColorConfig(palette: string[]): string {
  const config: Record<string, string> = {};
  palette.forEach((hex, i) => {
    config[`color-${i + 1}`] = hex;
  });
  return JSON.stringify(config, null, 2);
}

export function getCssVariablesCode(palette: string[]): string {
  const vars = palette
    .map((hex, i) => `  --color-brand-${i + 1}: ${hex};`)
    .join("\n");
  return `:root {\n${vars}\n}`;
}

export function getScssVariablesCode(palette: string[]): string {
  return palette
    .map((hex, i) => `$color-brand-${i + 1}: ${hex};`)
    .join("\n");
}

export function getFlutterColorCode(hex: string): string {
  const cleanHex = hex.replace("#", "").toUpperCase();
  const hex8 = cleanHex.length === 6 ? `FF${cleanHex}` : cleanHex;
  return `Color(0x${hex8})`;
}

export function getReactNativeColorCode(hex: string): string {
  return `'${hex}'`;
}

export function getJsonTokensCode(palette: string[]): string {
  const tokens = {
    color: palette.reduce((acc, hex, i) => {
      acc[`brand_${i + 1}`] = {
        value: hex,
        type: "color",
      };
      return acc;
    }, {} as Record<string, { value: string; type: string }>)
  };
  return JSON.stringify(tokens, null, 2);
}

// 4. Accessibility Calculations (WCAG 2.1)
function getRelativeLuminance({ r, g, b }: RGB): number {
  const transformChannel = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = transformChannel(r);
  const G = transformChannel(g);
  const B = transformChannel(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  const ratio = (brightest + 0.05) / (darkest + 0.05);
  return Math.round(ratio * 100) / 100;
}

export interface WCAGStatus {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
}

export function checkWCAG(textHex: string, bgHex: string): WCAGStatus {
  const ratio = getContrastRatio(textHex, bgHex);
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3.0,
    aaaNormal: ratio >= 7.0,
    aaaLarge: ratio >= 4.5,
  };
}
