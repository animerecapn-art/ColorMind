-- Supabase Database Schema for ColorMind
-- Run this SQL in your Supabase SQL Editor to set up database tables.

-- 1. Create history table
CREATE TABLE IF NOT EXISTS colormind_history (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('site', 'image')),
    target TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create favorites table
CREATE TABLE IF NOT EXISTS colormind_favorites (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('color', 'palette')),
    value TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Add indexes for high performance query lookups
CREATE INDEX IF NOT EXISTS idx_history_created_at ON colormind_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON colormind_favorites (created_at DESC);

-- Enable Row Level Security (RLS) policies if you want public access:
ALTER TABLE colormind_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE colormind_favorites ENABLE ROW LEVEL SECURITY;

-- Allow anonymous select/insert access (for simple development/no auth setup)
CREATE POLICY "Allow public select on history" ON colormind_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on history" ON colormind_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on history" ON colormind_history FOR DELETE USING (true);

CREATE POLICY "Allow public select on favorites" ON colormind_favorites FOR SELECT USING (true);
CREATE POLICY "Allow public insert on favorites" ON colormind_favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on favorites" ON colormind_favorites FOR DELETE USING (true);
