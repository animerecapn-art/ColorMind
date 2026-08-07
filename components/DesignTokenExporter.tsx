"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import {
  getCssVariablesCode,
  getScssVariablesCode,
  getTailwindColorConfig,
  getFlutterColorCode,
  getReactNativeColorCode,
  getJsonTokensCode,
} from "../lib/colorUtils";

interface ExportData {
  colors: string[];
  typography?: {
    family: string;
    weight: string;
    size: string;
    lineHeight: string;
    letterSpacing: string;
  };
  borderRadii?: {
    button: string;
    card: string;
    input: string;
  };
  shadows?: string[];
  spacings?: {
    padding: string;
    margin: string;
    width: string;
  };
  gradients?: string[];
}

interface DesignTokenExporterProps {
  data: ExportData;
}

type TabType = "css" | "tailwind" | "scss" | "flutter" | "reactnative" | "json";

export default function DesignTokenExporter({ data }: DesignTokenExporterProps) {
  const [activeTab, setActiveTab] = useState<TabType>("css");
  const [copied, setCopied] = useState(false);

  const getCode = (): string => {
    const { colors, typography, borderRadii, shadows, spacings, gradients } = data;

    switch (activeTab) {
      case "css": {
        let code = `:root {\n`;
        colors.forEach((c, i) => {
          code += `  --color-brand-${i + 1}: ${c};\n`;
        });
        if (typography) {
          code += `\n  /* Typography */\n`;
          code += `  --font-family-primary: ${typography.family};\n`;
          code += `  --font-size-base: ${typography.size};\n`;
          code += `  --font-weight-normal: ${typography.weight};\n`;
        }
        if (borderRadii) {
          code += `\n  /* Border Radii */\n`;
          code += `  --radius-button: ${borderRadii.button};\n`;
          code += `  --radius-card: ${borderRadii.card};\n`;
        }
        if (shadows && shadows.length > 0) {
          code += `\n  /* Shadows */\n`;
          shadows.forEach((s, i) => {
            code += `  --shadow-${i + 1}: ${s};\n`;
          });
        }
        code += `}`;
        return code;
      }

      case "tailwind": {
        const twColors = colors.reduce((acc, c, i) => {
          acc[`brand-${i + 1}`] = c;
          return acc;
        }, {} as Record<string, string>);

        const config = {
          theme: {
            extend: {
              colors: twColors,
              fontFamily: {
                brand: [typography?.family || "Inter", "sans-serif"],
              },
              borderRadius: {
                button: borderRadii?.button || "0.375rem",
                card: borderRadii?.card || "0.5rem",
              },
              boxShadow: shadows?.reduce((acc, s, i) => {
                acc[`brand-${i + 1}`] = s;
                return acc;
              }, {} as Record<string, string>) || {},
            },
          },
        };
        return `module.exports = ${JSON.stringify(config, null, 2)}`;
      }

      case "scss": {
        let code = ``;
        colors.forEach((c, i) => {
          code += `$color-brand-${i + 1}: ${c};\n`;
        });
        if (typography) {
          code += `\n// Typography\n`;
          code += `$font-family-primary: "${typography.family}";\n`;
          code += `$font-size-base: ${typography.size};\n`;
        }
        if (borderRadii) {
          code += `\n// Border Radii\n`;
          code += `$radius-button: ${borderRadii.button};\n`;
          code += `$radius-card: ${borderRadii.card};\n`;
        }
        return code;
      }

      case "flutter": {
        let code = `import 'package:flutter/material.dart';\n\n`;
        code += `class BrandTheme {\n`;
        colors.forEach((c, i) => {
          code += `  static const Color brand${i + 1} = ${getFlutterColorCode(c)};\n`;
        });
        code += `\n  static final ThemeData lightTheme = ThemeData(\n`;
        code += `    primaryColor: brand1,\n`;
        code += `    cardTheme: CardTheme(\n`;
        code += `      shape: RoundedRectangleBorder(\n`;
        code += `        borderRadius: BorderRadius.circular(8.0), // approx ${borderRadii?.card || "8px"}\n`;
        code += `      ),\n`;
        code += `    ),\n`;
        code += `  );\n`;
        code += `}`;
        return code;
      }

      case "reactnative": {
        let code = `import { StyleSheet } from 'react-native';\n\n`;
        code += `export const BrandColors = {\n`;
        colors.forEach((c, i) => {
          code += `  brand${i + 1}: ${getReactNativeColorCode(c)},\n`;
        });
        code += `};\n\n`;
        code += `export const themeStyles = StyleSheet.create({\n`;
        code += `  button: {\n`;
        code += `    borderRadius: 8, // approx ${borderRadii?.button || "8px"}\n`;
        code += `    backgroundColor: BrandColors.brand1,\n`;
        code += `  },\n`;
        code += `  card: {\n`;
        code += `    borderRadius: 12, // approx ${borderRadii?.card || "12px"}\n`;
        code += `  },\n`;
        code += `});`;
        return code;
      }

      case "json": {
        const tokens = {
          color: colors.reduce((acc, c, i) => {
            acc[`brand_${i + 1}`] = { value: c, type: "color" };
            return acc;
          }, {} as Record<string, any>),
          font: {
            primary: { value: typography?.family, type: "fontFamily" },
          },
          radius: {
            button: { value: borderRadii?.button, type: "borderRadius" },
            card: { value: borderRadii?.card, type: "borderRadius" },
          },
        };
        return JSON.stringify(tokens, null, 2);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tabs: { name: string; id: TabType }[] = [
    { name: "CSS Variables", id: "css" },
    { name: "Tailwind Config", id: "tailwind" },
    { name: "SCSS", id: "scss" },
    { name: "Flutter Theme", id: "flutter" },
    { name: "React Native", id: "reactnative" },
    { name: "JSON Tokens", id: "json" },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm glow-card flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-foreground text-base">Export Tokens</h3>
        </div>

        {/* Tab triggers */}
        <div className="flex flex-wrap gap-1 bg-secondary p-1 rounded-lg border border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Code box */}
      <div className="relative bg-secondary/80 border border-border rounded-xl overflow-hidden">
        {/* Header toolbar */}
        <div className="h-10 border-b border-border bg-card/60 flex items-center justify-between px-4">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Format: {activeTab}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1 rounded bg-secondary hover:bg-muted border border-border transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy code
              </>
            )}
          </button>
        </div>

        {/* Scrollable code block */}
        <pre className="p-5 overflow-auto text-xs font-mono text-foreground leading-relaxed max-h-[350px]">
          <code>{getCode()}</code>
        </pre>
      </div>
    </div>
  );
}
