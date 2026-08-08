"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  Bookmark,
  Share2,
  FolderHeart,
  Palette,
  Check,
  Zap,
} from "lucide-react";
import { addHistoryItem } from "../../lib/db";
import ColorDetails from "../../components/ColorDetails";
import AccessibilityCard from "../../components/AccessibilityCard";
import DesignTokenExporter from "../../components/DesignTokenExporter";

interface GenerationResult {
  success: boolean;
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

const EXAMPLE_PROMPTS = [
  { text: "Sunset in Kyoto", emoji: "⛩️" },
  { text: "Cyberpunk Hackathon", emoji: "🌌" },
  { text: "Minimalist Matcha Cafe", emoji: "🍵" },
  { text: "Warm Cozy Cabin", emoji: "🏡" },
  { text: "Modern SaaS Dashboard", emoji: "💼" },
  { text: "Vintage Desert Sunset", emoji: "🏜️" },
];

const LOADING_STEPS = [
  "Initializing NVIDIA NIM connection...",
  "Analyzing prompt description...",
  "Evaluating color harmonics...",
  "Running contrast ratio checks...",
  "Selecting typography and radius tokens...",
  "Structuring design tokens schema...",
  "Ready to compile palette!",
];

export default function AIGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Google Fonts loading for preview
  useEffect(() => {
    if (result?.typography?.family) {
      const fontName = result.typography.family.split(",")[0].trim().replace(/['"]/g, "");
      if (
        fontName &&
        !["sans-serif", "serif", "monospace", "system-ui", "arial", "inter", "roboto"].includes(
          fontName.toLowerCase()
        )
      ) {
        const link = document.createElement("link");
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
          fontName
        )}:wght@400;500;700&display=swap`;
        link.rel = "stylesheet";
        document.head.appendChild(link);
        return () => {
          document.head.removeChild(link);
        };
      }
    }
  }, [result?.typography?.family]);

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
    }, 1200);
    return interval;
  };

  const handleGenerate = async (targetPrompt: string) => {
    if (!targetPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const interval = startLoadingAnimation();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: targetPrompt.trim() }),
      });

      const data = await response.json();
      clearInterval(interval);

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate design system");
      }

      setResult(data);

      // Save to History (using type: 'site' to satisfy check constraints in DB schema)
      await addHistoryItem({
        type: "site",
        target: `AI: ${targetPrompt.trim()}`,
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
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get preview styling variables
  const previewFont = result?.typography?.family || "Inter, system-ui, sans-serif";
  const primaryColor = result?.categories?.primary || "#3b82f6";
  const secondaryColor = result?.categories?.secondary || "#10b981";
  const accentColor = result?.categories?.accent || "#f59e0b";
  const bgColor = result?.categories?.background || "#0f172a";
  const textColor = result?.categories?.text || "#ffffff";
  const borderRadiusButton = result?.borderRadii?.button || "0.375rem";
  const borderRadiusCard = result?.borderRadii?.card || "0.5rem";
  const borderRadiusInput = result?.borderRadii?.input || "0.375rem";
  const gradientHeader =
    result?.gradients?.[0] || "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)";
  const shadowStyle = result?.shadows?.[0] || "0 4px 6px -1px rgba(0,0,0,0.1)";

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
          AI Design System Generator
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Leverage NVIDIA NIM Llama 3.1 70B Instruct to dream up custom color palettes, matching
          typography tokens, and border radii values from simple natural language prompts.
        </p>
      </div>

      {/* Input container */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-md glow-card max-w-4xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Describe your theme (e.g., 'Retro cyberpunk sunset', 'Cozy warm organic coffee house', 'Sleek luxury fashion brand')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate(prompt)}
            disabled={loading}
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-50"
          />
          <button
            onClick={() => handleGenerate(prompt)}
            disabled={loading || !prompt.trim()}
            className="px-6 py-3 bg-foreground hover:opacity-90 active:scale-95 text-background font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>

        {/* Suggestion tags */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Or try these ideas
          </span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p.text}
                onClick={() => {
                  setPrompt(p.text);
                  handleGenerate(p.text);
                }}
                disabled={loading}
                className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary border border-border/80 hover:border-border text-xs text-foreground font-semibold rounded-lg transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <span>{p.emoji}</span>
                <span>{p.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state animation */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-2xl p-12 text-center max-w-4xl flex flex-col items-center justify-center min-h-[300px] shadow-sm space-y-6"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-muted/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-foreground">AI is imagining your palette</h3>
              <p className="text-sm text-amber-500 font-bold min-h-[20px] transition-all">
                {LOADING_STEPS[loadingStep]}
              </p>
            </div>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-xl flex items-center gap-2 max-w-4xl"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-6xl"
          >
            {/* Grid display for results */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column - Palette view and tokens */}
              <div className="lg:col-span-7 space-y-8">
                {/* Generated Palette Swatches */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-500" />
                    Color Palette (8 Colors)
                  </h3>

                  {/* Horizontal visual strip */}
                  <div className="flex h-14 rounded-xl overflow-hidden border border-border shadow-inner">
                    {result.colors.map((color, idx) => (
                      <div
                        key={`strip-${color}-${idx}`}
                        className="flex-1 transition-all hover:flex-[1.5] cursor-pointer"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* Dynamic Color Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.colors.map((color, idx) => (
                      <ColorDetails key={`details-${color}-${idx}`} color={color} />
                    ))}
                  </div>
                </div>

                {/* Categories & Configuration Tokens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Semantic Roles Mapping */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Semantic Roles Mapping
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(result.categories).map(([role, hex]) => (
                        <div key={role} className="flex items-center justify-between">
                          <span className="text-xs font-bold capitalize text-muted-foreground">
                            {role}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-foreground">
                              {hex}
                            </span>
                            <div
                              className="w-4 h-4 rounded border border-border"
                              style={{ backgroundColor: hex }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Layout & Typography Tokens */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Typography & Radii
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-muted-foreground">Font Family</span>
                        <span className="font-semibold text-foreground truncate max-w-[150px]">
                          {result.typography.family.split(",")[0]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-muted-foreground">Font Weight</span>
                        <span className="font-semibold text-foreground">
                          {result.typography.weight}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-muted-foreground">Button Radius</span>
                        <span className="font-semibold text-foreground">
                          {result.borderRadii.button}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-muted-foreground">Card Radius</span>
                        <span className="font-semibold text-foreground">
                          {result.borderRadii.card}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WCAG Contrast check */}
                <AccessibilityCard palette={result.colors} />
              </div>

              {/* Right Column - Live Mockup Preview & Exporter */}
              <div className="lg:col-span-5 space-y-8">
                {/* Live Mockup Preview */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Layout className="w-5 h-5 text-indigo-500" />
                      Live Mockup Preview
                    </h3>
                    <span className="text-[10px] bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded-full font-bold">
                      Interactive
                    </span>
                  </div>

                  {/* Rendered Mockup Container */}
                  <div
                    className="border border-border/80 rounded-xl overflow-hidden shadow-inner p-4 transition-all"
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                      fontFamily: previewFont,
                    }}
                  >
                    {/* Mock Header Navigation */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                          style={{
                            backgroundColor: primaryColor,
                            color: bgColor,
                          }}
                        >
                          M
                        </div>
                        <span className="text-xs font-bold">MindStudio</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                      </div>
                    </div>

                    {/* Mock Hero Banner */}
                    <div
                      className="my-4 p-4 rounded-lg flex flex-col justify-between min-h-[90px] relative overflow-hidden"
                      style={{
                        background: gradientHeader,
                        borderRadius: borderRadiusCard,
                      }}
                    >
                      <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />
                      <div className="relative z-10 space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                          Product Launch
                        </span>
                        <h4 className="text-xs font-bold leading-tight max-w-[150px]">
                          Unleash your design potential
                        </h4>
                      </div>
                      <div className="relative z-10 flex items-center justify-between mt-3">
                        <div className="w-6 h-6 rounded-full bg-white/20" />
                        <div
                          className="px-2.5 py-1 text-[8px] font-bold"
                          style={{
                            backgroundColor: accentColor,
                            color: "#1e293b",
                            borderRadius: borderRadiusButton,
                          }}
                        >
                          Special Access
                        </div>
                      </div>
                    </div>

                    {/* Mock Content Dashboard Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Metric Card 1 */}
                      <div
                        className="p-3 bg-white/5 border border-white/10"
                        style={{
                          borderRadius: borderRadiusCard,
                          boxShadow: shadowStyle,
                        }}
                      >
                        <span className="text-[9px] text-muted-foreground block">Active Users</span>
                        <span className="text-sm font-bold block mt-1">12,482</span>
                        <span className="text-[8px] text-green-500 font-semibold block mt-0.5">
                          +14.8% up
                        </span>
                      </div>

                      {/* Mock Interactive Button Form Card */}
                      <div
                        className="p-3 bg-white/5 border border-white/10 flex flex-col justify-between"
                        style={{
                          borderRadius: borderRadiusCard,
                          boxShadow: shadowStyle,
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Your email..."
                          disabled
                          className="w-full bg-white/5 border border-white/10 px-2 py-1 text-[9px] focus:outline-none opacity-80 cursor-not-allowed placeholder-white/30"
                          style={{
                            borderRadius: borderRadiusInput,
                          }}
                        />
                        <button
                          disabled
                          className="w-full text-center py-1 text-[9px] font-bold cursor-not-allowed transition-all mt-2"
                          style={{
                            backgroundColor: primaryColor,
                            color: bgColor,
                            borderRadius: borderRadiusButton,
                          }}
                        >
                          Join Waitlist
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exporter presets */}
                <DesignTokenExporter data={result} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
