// Local database management using localStorage with real Supabase synchronization adapter

import { getSupabaseClient } from "./supabaseClient";

export interface FavoriteItem {
  id: string;
  type: "color" | "palette";
  value: string; // Color HEX or JSON string of palette colors
  name?: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  type: "site" | "image";
  target: string; // URL of site or name of image
  data: {
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
  };
  createdAt: string;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  supabaseUrl: string;
  supabaseAnonKey: string;
  useSupabase: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  supabaseUrl: "",
  supabaseAnonKey: "",
  useSupabase: false,
};

// Check if we are running in the browser
const isBrowser = () => typeof window !== "undefined";

export function getSettings(): AppSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  const stored = localStorage.getItem("colormind_settings");
  if (!stored) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  if (!isBrowser()) return;
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem("colormind_settings", JSON.stringify(updated));
}

// ----------------------------------------------------
// 🕒 History Operations
// ----------------------------------------------------

// Get history items (fetches from local cache immediately, and merges with Supabase if active)
export async function getHistory(): Promise<HistoryItem[]> {
  if (!isBrowser()) return [];

  // Read local storage first
  let localHistory: HistoryItem[] = [];
  const stored = localStorage.getItem("colormind_history");
  if (stored) {
    try {
      localHistory = JSON.parse(stored);
    } catch {}
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("colormind_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        // Map DB snake_case columns back to camelCase properties
        const mappedData: HistoryItem[] = data.map((item: any) => ({
          id: item.id,
          type: item.type,
          target: item.target,
          data: item.data,
          createdAt: item.created_at,
        }));

        // Update local cache
        localStorage.setItem("colormind_history", JSON.stringify(mappedData));
        return mappedData;
      }
    } catch (e) {
      console.error("Supabase getHistory failed, falling back to local:", e);
    }
  }

  return localHistory;
}

// Add history item
export async function addHistoryItem(item: Omit<HistoryItem, "id" | "createdAt">): Promise<HistoryItem> {
  const newItem: HistoryItem = {
    ...item,
    id: Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
  };

  // 1. Update local cache
  if (isBrowser()) {
    let localHistory: HistoryItem[] = [];
    const stored = localStorage.getItem("colormind_history");
    if (stored) {
      try {
        localHistory = JSON.parse(stored);
      } catch {}
    }
    const updated = [newItem, ...localHistory].slice(0, 50);
    localStorage.setItem("colormind_history", JSON.stringify(updated));
  }

  // 2. Synchronize to Supabase in background
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("colormind_history").insert({
        id: newItem.id,
        type: newItem.type,
        target: newItem.target,
        data: newItem.data,
        created_at: newItem.createdAt,
      });
    } catch (e) {
      console.error("Supabase insert history failed:", e);
    }
  }

  return newItem;
}

// Delete history item
export async function deleteHistoryItem(id: string): Promise<void> {
  // 1. Update local cache
  if (isBrowser()) {
    let localHistory: HistoryItem[] = [];
    const stored = localStorage.getItem("colormind_history");
    if (stored) {
      try {
        localHistory = JSON.parse(stored);
      } catch {}
    }
    const updated = localHistory.filter((item) => item.id !== id);
    localStorage.setItem("colormind_history", JSON.stringify(updated));
  }

  // 2. Sync to Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("colormind_history").delete().eq("id", id);
    } catch (e) {
      console.error("Supabase delete history failed:", e);
    }
  }
}

// Clear all history
export async function clearHistory(): Promise<void> {
  if (isBrowser()) {
    localStorage.removeItem("colormind_history");
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // In a real sandbox public schema delete all is restricted, but EQ filtering or raw deletes work
      await supabase.from("colormind_history").delete().neq("id", "_placeholder_");
    } catch (e) {
      console.error("Supabase clear history failed:", e);
    }
  }
}

// ----------------------------------------------------
// ❤️ Favorites Operations
// ----------------------------------------------------

export async function getFavorites(): Promise<FavoriteItem[]> {
  if (!isBrowser()) return [];

  // Read local storage first
  let localFavorites: FavoriteItem[] = [];
  const stored = localStorage.getItem("colormind_favorites");
  if (stored) {
    try {
      localFavorites = JSON.parse(stored);
    } catch {}
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("colormind_favorites")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mappedData: FavoriteItem[] = data.map((item: any) => ({
          id: item.id,
          type: item.type,
          value: item.value,
          name: item.name,
          createdAt: item.created_at,
        }));

        localStorage.setItem("colormind_favorites", JSON.stringify(mappedData));
        return mappedData;
      }
    } catch (e) {
      console.error("Supabase getFavorites failed, falling back to local:", e);
    }
  }

  return localFavorites;
}

// Toggle favorite (returns true if now favorited, false if removed)
export async function toggleFavorite(type: "color" | "palette", value: string, name?: string): Promise<boolean> {
  if (!isBrowser()) return false;

  let favorites: FavoriteItem[] = [];
  const stored = localStorage.getItem("colormind_favorites");
  if (stored) {
    try {
      favorites = JSON.parse(stored);
    } catch {}
  }

  const index = favorites.findIndex((f) => f.type === type && f.value === value);
  const supabase = getSupabaseClient();

  if (index >= 0) {
    // Remove favorite
    const itemToDelete = favorites[index];
    favorites.splice(index, 1);
    localStorage.setItem("colormind_favorites", JSON.stringify(favorites));

    if (supabase) {
      try {
        await supabase.from("colormind_favorites").delete().eq("id", itemToDelete.id);
      } catch (e) {
        console.error("Supabase delete favorite failed:", e);
      }
    }
    return false;
  } else {
    // Add favorite
    const newItem: FavoriteItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      value,
      name: name || (type === "color" ? value : `Palette ${favorites.length + 1}`),
      createdAt: new Date().toISOString(),
    };
    favorites.push(newItem);
    localStorage.setItem("colormind_favorites", JSON.stringify(favorites));

    if (supabase) {
      try {
        await supabase.from("colormind_favorites").insert({
          id: newItem.id,
          type: newItem.type,
          value: newItem.value,
          name: newItem.name,
          created_at: newItem.createdAt,
        });
      } catch (e) {
        console.error("Supabase insert favorite failed:", e);
      }
    }
    return true;
  }
}

// Synchronous check against local cache (for high performance color-swatch highlights)
export function isFavorited(type: "color" | "palette", value: string): boolean {
  if (!isBrowser()) return false;
  const stored = localStorage.getItem("colormind_favorites");
  if (!stored) return false;
  try {
    const favorites: FavoriteItem[] = JSON.parse(stored);
    return favorites.some((f) => f.type === type && f.value === value);
  } catch {
    return false;
  }
}

// Clear all favorites
export async function clearFavorites(): Promise<void> {
  if (isBrowser()) {
    localStorage.removeItem("colormind_favorites");
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("colormind_favorites").delete().neq("id", "_placeholder_");
    } catch (e) {
      console.error("Supabase clear favorites failed:", e);
    }
  }
}

