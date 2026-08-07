"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Trash2, Search, Calendar, ChevronDown, ChevronUp, Globe, ImageIcon } from "lucide-react";
import { getHistory, clearHistory, deleteHistoryItem, HistoryItem } from "../../lib/db";
import ColorDetails from "../../components/ColorDetails";
import AccessibilityCard from "../../components/AccessibilityCard";
import DesignTokenExporter from "../../components/DesignTokenExporter";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getHistory().then(setHistory);
  }, []);

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear your inspection history?")) {
      await clearHistory();
      setHistory([]);
      setExpandedId(null);
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteHistoryItem(id);
    setHistory(history.filter((item) => item.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const filteredHistory = history.filter((item) =>
    item.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <History className="w-8 h-8" />
            Inspection History
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Access previous design scans and dominant image colors.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold transition-colors self-start sm:self-center"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </div>

      {/* Filter and Content */}
      {history.length > 0 ? (
        <div className="space-y-4 max-w-5xl">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search history by site name or image file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder-muted-foreground"
            />
          </div>

          {/* History list */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredHistory.map((item) => {
                const isExpanded = expandedId === item.id;
                const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <motion.div
                    key={item.id}
                    layout
                    className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:border-muted-foreground/35 transition-colors"
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground flex-shrink-0">
                          {item.type === "site" ? (
                            <Globe className="w-4 h-4" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate max-w-[280px]">
                            {item.target}
                          </h4>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formattedDate}
                          </span>
                        </div>
                      </div>

                      {/* Small inline color track preview */}
                      <div className="flex-1 flex items-center gap-1 md:justify-center overflow-x-auto py-1">
                        {item.data.colors.map((color, idx) => (
                          <div
                            key={`${item.id}-${color}-${idx}`}
                            className="w-5 h-5 rounded-full border border-border/80 flex-shrink-0"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>

                      {/* Expand / delete actions */}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Container */}
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/60 bg-secondary/20 p-5 space-y-6"
                      >
                        {/* Expanded Colors Grid */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Color Palette Details
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {item.data.colors.map((color, idx) => (
                              <ColorDetails key={`${item.id}-det-${color}-${idx}`} color={color} />
                            ))}
                          </div>
                        </div>

                        {/* WCAG Contrast */}
                        <AccessibilityCard palette={item.data.colors} />

                        {/* Code Exporter */}
                        <DesignTokenExporter data={item.data} />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredHistory.length === 0 && (
              <div className="text-center py-10 bg-secondary/10 border border-dashed border-border rounded-xl">
                <p className="text-sm font-semibold text-muted-foreground">
                  No history items match your search.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-secondary/20 border border-dashed border-border/80 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] max-w-3xl">
          <History className="w-12 h-12 text-muted-foreground/60 mb-3" />
          <h3 className="text-base font-bold text-foreground">No inspection history</h3>
          <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm">
            Scans performed using the Website Inspector or Image Extractor will automatically be preserved here.
          </p>
        </div>
      )}
    </div>
  );
}
