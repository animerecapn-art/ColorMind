"use client";

import React, { useState } from "react";
import { Plus, Trash2, Sliders, LayoutGrid, Terminal } from "lucide-react";
import DesignTokenExporter from "../../components/DesignTokenExporter";

export default function ExportsPage() {
  const [sandboxColors, setSandboxColors] = useState<string[]>([
    "#6366f1",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ]);
  const [newColor, setNewColor] = useState("#8b5cf6");

  const handleAddColor = () => {
    if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
      if (!sandboxColors.includes(newColor.toLowerCase())) {
        setSandboxColors([...sandboxColors, newColor.toLowerCase()]);
      }
    }
  };

  const handleRemoveColor = (color: string) => {
    setSandboxColors(sandboxColors.filter((c) => c !== color));
  };

  const handleClearAll = () => {
    setSandboxColors([]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Sliders className="w-8 h-8" />
          Design Token Sandbox
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Construct custom color palettes manually, arrange tokens, and export them immediately to any developer format.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl">
        {/* Sandbox Editor Panel */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm glow-card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-indigo-500" />
              Palette Swatches ({sandboxColors.length})
            </h3>
            {sandboxColors.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-wider"
              >
                Clear Sandbox
              </button>
            )}
          </div>

          {/* Manually Add Colors */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-muted-foreground block">
              Add Hex Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
              />
              <input
                type="text"
                placeholder="#8b5cf6"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm font-mono uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleAddColor}
                className="px-4 py-2 bg-foreground text-background rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Sandbox Color List */}
          {sandboxColors.length > 0 ? (
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {sandboxColors.map((color, index) => (
                <div
                  key={`${color}-${index}`}
                  className="flex items-center justify-between p-2.5 bg-secondary/50 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-md border border-border/80 shadow-inner"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-mono text-xs uppercase font-bold text-foreground">
                      {color}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveColor(color)}
                    className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-secondary transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-border rounded-xl">
              <p className="text-xs text-muted-foreground font-semibold">
                No swatches in sandbox. Add one above!
              </p>
            </div>
          )}
        </div>

        {/* Exporter Output Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-foreground">Exporter Outputs</h3>
          </div>
          <DesignTokenExporter data={{ colors: sandboxColors }} />
        </div>
      </div>
    </div>
  );
}
