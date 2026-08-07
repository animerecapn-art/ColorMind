"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImageIcon, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { extractDominantColors } from "../../lib/imageUtils";
import { addHistoryItem } from "../../lib/db";
import ColorDetails from "../../components/ColorDetails";
import AccessibilityCard from "../../components/AccessibilityCard";
import DesignTokenExporter from "../../components/DesignTokenExporter";

export default function ImageInspectorPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }

    setLoading(true);
    setError(null);
    setColors([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImageSrc(dataUrl);

      try {
        // Run quantization algorithm
        const extracted = await extractDominantColors(dataUrl, 8);
        setColors(extracted);

        // Save to History
        addHistoryItem({
          type: "image",
          target: file.name,
          data: {
            colors: extracted,
          },
        });
      } catch (err) {
        setError("Failed to analyze image colors. Please check file permissions.");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Image Color Extractor
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Upload any graphic mockup or logo image file to automatically analyze and extract its design palette.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Column */}
        <div className="lg:col-span-5 space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px] transition-all cursor-pointer relative ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/45 bg-card"
            }`}
            onClick={onButtonClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            {imageSrc ? (
              <div className="space-y-4 w-full h-full flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Uploaded preview"
                  className="max-h-[220px] rounded-lg object-contain border border-border shadow-sm"
                />
                <p className="text-xs text-muted-foreground font-semibold">
                  Click or drag another image to replace
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Drag and drop your image here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports PNG, JPEG, WebP up to 8MB
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-secondary border border-border rounded-lg text-xs font-bold text-foreground hover:bg-muted"
                >
                  Browse Files
                </button>
              </div>
            )}
          </div>

          {/* Error panel */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">Extraction Error</h4>
                <p className="text-xs opacity-90 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-card border border-border rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm glow-card"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-bold text-foreground">Quantizing image pixels...</p>
                <p className="text-xs text-muted-foreground mt-1">Generating dominant design scheme</p>
              </motion.div>
            )}

            {!loading && colors.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Palette */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-base font-bold text-foreground">Extracted Palette</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {colors.map((color, idx) => (
                      <ColorDetails key={`${color}-${idx}`} color={color} />
                    ))}
                  </div>
                </div>

                {/* Accessibility Matrix */}
                <AccessibilityCard palette={colors} />

                {/* Tokens Exporter */}
                <DesignTokenExporter data={{ colors }} />
              </motion.div>
            )}

            {!loading && colors.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-secondary/20 border border-dashed border-border/80 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]"
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground/60 mb-3" />
                <p className="text-sm font-bold text-muted-foreground">No colors analyzed yet</p>
                <p className="text-xs text-muted-foreground/75 mt-1">
                  Upload an image on the left to extract the design system.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
