"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { checkWCAG } from "../lib/colorUtils";

interface AccessibilityCardProps {
  palette: string[]; // List of colors extracted
}

export default function AccessibilityCard({ palette }: AccessibilityCardProps) {
  const [bgColor, setBgColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");

  useEffect(() => {
    if (palette && palette.length >= 2) {
      setBgColor(palette[palette.length - 1] || "#ffffff"); // background is usually the last one or light
      setTextColor(palette[0] || "#000000"); // text is usually the first one or dark
    }
  }, [palette]);

  const wcag = checkWCAG(textColor, bgColor);

  const Badge = ({ passed }: { passed: boolean }) => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
        passed
          ? "bg-green-500/10 text-green-500 border border-green-500/20"
          : "bg-red-500/10 text-red-500 border border-red-500/20"
      }`}
    >
      {passed ? (
        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
      ) : (
        <XCircle className="w-3 h-3 flex-shrink-0" />
      )}
      {passed ? "Pass" : "Fail"}
    </span>
  );

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm glow-card">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-foreground text-base">WCAG Accessibility Matrix</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Color pickers selection */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1 text-sm font-mono uppercase text-foreground"
              />
            </div>
            {/* Quick palette picker */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {palette.map((color) => (
                <button
                  key={`bg-${color}`}
                  onClick={() => setBgColor(color)}
                  className="w-5 h-5 rounded-full border border-border/80 shadow-sm transition-transform hover:scale-110 active:scale-95"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1 text-sm font-mono uppercase text-foreground"
              />
            </div>
            {/* Quick palette picker */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {palette.map((color) => (
                <button
                  key={`text-${color}`}
                  onClick={() => setTextColor(color)}
                  className="w-5 h-5 rounded-full border border-border/80 shadow-sm transition-transform hover:scale-110 active:scale-95"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="lg:col-span-4 flex flex-col justify-between border border-border rounded-xl p-4 min-h-[160px]"
             style={{ backgroundColor: bgColor, color: textColor }}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Live Preview</span>
            <p className="text-sm font-medium leading-relaxed mt-2">
              Designing with accessibility in mind is not optional. It is essential.
            </p>
          </div>
          <div className="mt-4">
            <h4 className="text-lg font-bold">Heading Example</h4>
            <p className="text-xs opacity-75">Large text is bold at 14pt (18.6px) or 18pt (24px) normal.</p>
          </div>
        </div>

        {/* WCAG Compliance checklist */}
        <div className="lg:col-span-4 flex flex-col justify-center bg-secondary/50 border border-border/40 rounded-xl p-5">
          <div className="text-center mb-4">
            <span className="text-2xl font-black font-mono text-foreground">
              {wcag.ratio}:1
            </span>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
              Contrast Ratio
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">AA Normal Text</span>
              <Badge passed={wcag.aaNormal} />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">AA Large Text</span>
              <Badge passed={wcag.aaLarge} />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">AAA Normal Text</span>
              <Badge passed={wcag.aaaNormal} />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">AAA Large Text</span>
              <Badge passed={wcag.aaaLarge} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
