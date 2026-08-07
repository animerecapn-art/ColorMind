"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, Check, Database, Trash2, Sun, Moon, Info } from "lucide-react";
import { useTheme } from "../../components/ThemeProvider";
import { getSettings, saveSettings } from "../../lib/db";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [useSupabase, setUseSupabase] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    setSupabaseUrl(settings.supabaseUrl || "");
    setSupabaseAnonKey(settings.supabaseAnonKey || "");
    setUseSupabase(settings.useSupabase || false);
  }, []);

  const handleSave = () => {
    saveSettings({
      supabaseUrl,
      supabaseAnonKey,
      useSupabase,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetApp = () => {
    if (
      confirm(
        "Warning: This will clear your entire history, favorites library, and configurations. Are you sure you want to reset ColorMind?"
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Application Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Configure database synchronization, developer preferences, and application themes.
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm glow-card space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sun className="w-4 h-4 text-indigo-500" />
            Appearance
          </h3>
          <p className="text-xs text-muted-foreground">
            Select your preferred visual style for the ColorMind workspace interface.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-md">
            {["light", "dark", "system"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t as any)}
                className={`py-3 rounded-lg border text-xs font-bold capitalize transition-all ${
                  theme === t
                    ? "bg-secondary border-primary/50 text-foreground font-extrabold shadow-sm scale-[1.02]"
                    : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Database Integration */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm glow-card space-y-5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" />
            Supabase DB Integration
          </h3>
          <p className="text-xs text-muted-foreground -mt-1">
            Store favorites and crawl history inside a persistent cloud database rather than local client cache.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-secondary/30 border border-border p-3.5 rounded-lg">
              <input
                type="checkbox"
                id="useSupabase"
                checked={useSupabase}
                onChange={(e) => setUseSupabase(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-border bg-secondary text-primary focus:ring-1 focus:ring-primary cursor-pointer"
              />
              <label
                htmlFor="useSupabase"
                className="text-xs font-bold text-foreground cursor-pointer select-none"
              >
                Enable Supabase cloud sync adapter
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Supabase URL Endpoint
                </label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-all"
                  disabled={!useSupabase}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-all"
                  disabled={!useSupabase}
                />
              </div>
            </div>

            {useSupabase && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-semibold rounded-lg flex items-start gap-2 max-w-xl">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Ensure tables `favorites` and `history` are created in your database. Otherwise, the client will fall back to local mode.
                </p>
              </div>
            )}

            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-foreground text-background font-bold text-xs rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 self-start"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Saved Changes!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* Clear Data Settings */}
        <div className="bg-card border border-red-500/20 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-red-500 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground">
            Irreversibly wipe out color favorites, crawled URLs history, and database configurations.
          </p>
          <button
            onClick={handleResetApp}
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            Reset Workspace Configs
          </button>
        </div>
      </div>
    </div>
  );
}
