"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, Heart } from "lucide-react";
import {
  hexToRgb,
  rgbToHsl,
  findClosestTailwindColor,
  getFlutterColorCode,
  getReactNativeColorCode,
  rgbToString,
  hslToString,
} from "../lib/colorUtils";
import { isFavorited, toggleFavorite } from "../lib/db";

interface ColorDetailsProps {
  color: string; // Hex format
  onFavoriteChange?: () => void;
}

export default function ColorDetails({ color, onFavoriteChange }: ColorDetailsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(isFavorited("color", color));
  }, [color]);

  const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 };
  const hsl = rgbToHsl(rgb);
  const tailwind = findClosestTailwindColor(color);
  const flutter = getFlutterColorCode(color);
  const rn = getReactNativeColorCode(color);

  const formats = [
    { label: "HEX", value: color, key: "hex" },
    { label: "RGB", value: rgbToString(rgb), key: "rgb" },
    { label: "HSL", value: hslToString(hsl), key: "hsl" },
    { label: "CSS Var", value: `var(--color-${tailwind.replace("~", "")})`, key: "css" },
    { label: "Tailwind", value: tailwind, key: "tailwind" },
    { label: "Flutter", value: flutter, key: "flutter" },
    { label: "React Native", value: rn, key: "rn" },
  ];

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleFavorite = async () => {
    const newState = await toggleFavorite("color", color);
    setIsFav(newState);
    if (onFavoriteChange) onFavoriteChange();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm glow-card">
      <div className="flex items-start gap-4">
        {/* Color preview swatch */}
        <div
          className="w-16 h-16 rounded-xl border border-border/80 shadow-inner flex-shrink-0 relative group"
          style={{ backgroundColor: color }}
        >
          {/* Subtle hover effect to show hex code inside */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl cursor-pointer"
               onClick={() => handleCopy(color, "swatch")}>
            <Copy className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Title and Fav Button */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono font-bold text-lg text-foreground uppercase">{color}</span>
            <button
              onClick={handleFavorite}
              className={`p-1.5 rounded-lg border transition-all ${
                isFav
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                  : "bg-secondary hover:bg-muted border-border text-muted-foreground hover:text-foreground"
              }`}
              title="Save to favorites"
            >
              <Heart className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground font-medium capitalize mt-0.5">
            Closest match: <span className="font-semibold text-foreground">{tailwind}</span>
          </p>
        </div>
      </div>

      {/* Formats list */}
      <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
        {formats.map((format) => (
          <div
            key={format.key}
            className="flex items-center justify-between text-xs font-medium"
          >
            <span className="text-muted-foreground w-24">{format.label}</span>
            <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
              <span className="font-mono text-foreground truncate select-all">{format.value}</span>
              <button
                onClick={() => handleCopy(format.value, format.key)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                {copiedKey === format.key ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
