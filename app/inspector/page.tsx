"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  Loader2,
  Sparkles,
  Type,
  Maximize2,
  Layers,
  Heart,
  ExternalLink,
  Info,
} from "lucide-react";
import { addHistoryItem } from "../../lib/db";
import ColorDetails from "../../components/ColorDetails";
import AccessibilityCard from "../../components/AccessibilityCard";
import DesignTokenExporter from "../../components/DesignTokenExporter";

interface InspectionResult {
  site: string;
  colors: string[];
  categories: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    family: string;
    weight: string;
    size: string;
    lineHeight: string;
    letterSpacing: string;
  };
  borderRadii: {
    button: string;
    card: string;
    input: string;
  };
  shadows: string[];
  spacings: {
    padding: string;
    margin: string;
    width: string;
  };
  gradients: string[];
}

const SAMPLE_SITES = [
  "vercel.com",
  "linear.app",
  "stripe.com",
  "tailwindcss.com",
  "figma.com",
];

const LOADING_STEPS = [
  "Resolving website DNS...",
  "Retrieving HTML source code...",
  "Locating style tags & external CSS links...",
  "Parsing stylesheet rules with regex engine...",
  "Clustering color tokens and font families...",
  "Calculating WCAG accessibility standards...",
  "Generating responsive Tailwind configs...",
];

export default function InspectorPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startLoadingAnimation = () => {
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= LOADING_STEPS.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 900);
    return interval;
  };

  const handleInspect = async (targetUrl: string) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const interval = startLoadingAnimation();

    try {
      const res = await fetch(`/api/inspect?url=${encodeURIComponent(targetUrl)}`);
      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to parse website design details.");
      }

      const data = await res.json();
      setResult(data);

      // Save to history
      addHistoryItem({
        type: "site",
        target: targetUrl,
        data: {
          colors: data.colors,
          typography: data.typography,
          borderRadii: data.borderRadii,
          shadows: data.shadows,
          spacings: data.spacings,
          gradients: data.gradients,
        },
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Website Design Inspector
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Enter any URL to crawl the stylesheet resources and extract the design guidelines.
        </p>
      </div>

      {/* Input container */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm glow-card max-w-3xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleInspect(url);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="e.g. vercel.com or https://linear.app"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-all"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-6 py-3 rounded-lg bg-foreground text-background font-bold text-sm hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Globe className="w-4.5 h-4.5" />}
            {loading ? "Inspecting..." : "Inspect Site"}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold text-muted-foreground">
          <span>Suggestions:</span>
          {SAMPLE_SITES.map((site) => (
            <button
              key={site}
              onClick={() => {
                setUrl(site);
                handleInspect(site);
              }}
              className="px-2.5 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border/80 transition-colors"
              disabled={loading}
            >
              {site}
            </button>
          ))}
        </div>
      </div>

      {/* Loading overlay / spinner */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-xl shadow-sm glow-card max-w-3xl"
          >
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-sm font-bold text-foreground transition-all duration-300">
              {LOADING_STEPS[loadingStep]}
            </p>
            <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
              Step {loadingStep + 1} of {LOADING_STEPS.length}
            </span>
          </motion.div>
        )}

        {/* Error notice */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium rounded-xl max-w-3xl flex items-start gap-3"
          >
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Inspection failed</h4>
              <p className="text-xs opacity-90 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Results grid */}
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Scrape Target header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-foreground flex items-center gap-1.5">
                    {result.site}
                    <a
                      href={`https://${result.site}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Styles crawled successfully from source stylesheets
                  </p>
                </div>
              </div>
            </div>

            {/* Colors Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h4 className="text-lg font-bold text-foreground">Extracted Palette</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {result.colors.map((color, idx) => (
                  <ColorDetails key={`${color}-${idx}`} color={color} />
                ))}
              </div>
            </div>

            {/* Typography / BorderRadius / Shadows */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Typography */}
              <div className="lg:col-span-6 bg-card border border-border rounded-xl p-6 shadow-sm glow-card">
                <div className="flex items-center gap-2 mb-5">
                  <Type className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-bold text-foreground text-base">Typography</h4>
                </div>
                <div className="space-y-4 text-sm font-semibold">
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground font-medium">Font Family</span>
                    <span className="text-foreground truncate max-w-[200px]" title={result.typography.family}>
                      {result.typography.family}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground font-medium">Primary Weight</span>
                    <span className="text-foreground">{result.typography.weight}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground font-medium">Base Font Size</span>
                    <span className="text-foreground">{result.typography.size}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground font-medium">Line Height</span>
                    <span className="text-foreground">{result.typography.lineHeight}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground font-medium">Letter Spacing</span>
                    <span className="text-foreground">{result.typography.letterSpacing}</span>
                  </div>
                </div>
              </div>

              {/* Borders and Radii */}
              <div className="lg:col-span-6 bg-card border border-border rounded-xl p-6 shadow-sm glow-card">
                <div className="flex items-center gap-2 mb-5">
                  <Maximize2 className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-bold text-foreground text-base">Border Radii</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-secondary/40 p-4 border border-border/60 rounded-xl flex flex-col items-center justify-between">
                    <div
                      className="w-12 h-10 bg-primary/20 border border-primary/45 flex items-center justify-center text-[10px] font-bold text-foreground"
                      style={{ borderRadius: result.borderRadii.button }}
                    >
                      Btn
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground mt-3 uppercase">Button</span>
                    <p className="text-xs font-mono font-bold mt-1 text-foreground">{result.borderRadii.button}</p>
                  </div>
                  <div className="bg-secondary/40 p-4 border border-border/60 rounded-xl flex flex-col items-center justify-between">
                    <div
                      className="w-12 h-10 bg-primary/20 border border-primary/45 flex items-center justify-center text-[10px] font-bold text-foreground"
                      style={{ borderRadius: result.borderRadii.card }}
                    >
                      Card
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground mt-3 uppercase">Card</span>
                    <p className="text-xs font-mono font-bold mt-1 text-foreground">{result.borderRadii.card}</p>
                  </div>
                  <div className="bg-secondary/40 p-4 border border-border/60 rounded-xl flex flex-col items-center justify-between">
                    <div
                      className="w-12 h-10 bg-primary/20 border border-primary/45 flex items-center justify-center text-[10px] font-bold text-foreground"
                      style={{ borderRadius: result.borderRadii.input }}
                    >
                      Inp
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground mt-3 uppercase">Input</span>
                    <p className="text-xs font-mono font-bold mt-1 text-foreground">{result.borderRadii.input}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Box Shadows & Gradients */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Shadows */}
              <div className="lg:col-span-6 bg-card border border-border rounded-xl p-6 shadow-sm glow-card">
                <div className="flex items-center gap-2 mb-5">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-bold text-foreground text-base">Box Shadows</h4>
                </div>
                <div className="space-y-4">
                  {result.shadows.map((shadow, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border"
                      style={{ boxShadow: shadow }}
                    >
                      <span className="text-xs font-bold text-foreground">Shadow {index + 1}</span>
                      <span className="font-mono text-[10px] text-muted-foreground max-w-[250px] truncate select-all" title={shadow}>
                        {shadow}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gradients */}
              <div className="lg:col-span-6 bg-card border border-border rounded-xl p-6 shadow-sm glow-card">
                <div className="flex items-center gap-2 mb-5">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-bold text-foreground text-base">Gradients</h4>
                </div>
                <div className="space-y-4">
                  {result.gradients.map((gradient, index) => (
                    <div key={index} className="space-y-2">
                      <div
                        className="h-12 rounded-lg border border-border shadow-inner"
                        style={{ backgroundImage: gradient }}
                      />
                      <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-muted-foreground">
                        <span className="truncate max-w-[300px] select-all">{gradient}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Accessibility and Token Exporter */}
            <AccessibilityCard palette={result.colors} />

            <DesignTokenExporter data={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
