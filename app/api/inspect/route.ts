import { NextRequest, NextResponse } from "next/server";
import { parseColorToHex } from "../../../lib/colorUtils";

// Helper to check if a color is neutral (gray/white/black)
function isNeutral(hex: string): boolean {
  // Simple check: convert hex to RGB and check if R, G, B channels are close to each other
  const clean = hex.replace("#", "");
  if (clean.length !== 6 && clean.length !== 3) return true;
  
  let r = 0, g = 0, b = 0;
  if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  } else {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  }
  
  const threshold = 15;
  return Math.abs(r - g) < threshold && Math.abs(g - b) < threshold && Math.abs(r - b) < threshold;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrlStr = searchParams.get("url");

  if (!targetUrlStr) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  let targetUrl = targetUrlStr.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    const urlObj = new URL(targetUrl);
    
    // Fetch HTML content with browser-like headers
    const response = await fetch(urlObj.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      next: { revalidate: 60 }, // cache for 60 seconds
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch website: Status ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();

    // 1. Gather all CSS
    let cssContent = "";

    // Parse inline style tags
    const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let styleMatch;
    while ((styleMatch = styleTagRegex.exec(html)) !== null) {
      cssContent += "\n" + styleMatch[1];
    }

    // Parse stylesheet link tags
    const linkTagRegex = /<link[^>]+rel=["']stylesheet["'][^>]*>|<link[^>]+href=["'][^"']+\.css["'][^>]*>/gi;
    const stylesheetUrls: string[] = [];
    let linkMatch;
    while ((linkMatch = linkTagRegex.exec(html)) !== null) {
      const hrefMatch = /href=["']([^"']+)["']/i.exec(linkMatch[0]);
      if (hrefMatch) {
        let stylesheetUrl = hrefMatch[1];
        if (stylesheetUrl.startsWith("//")) {
          stylesheetUrl = urlObj.protocol + stylesheetUrl;
        } else if (stylesheetUrl.startsWith("/")) {
          stylesheetUrl = urlObj.origin + stylesheetUrl;
        } else if (!/^https?:\/\//i.test(stylesheetUrl)) {
          stylesheetUrl = new URL(stylesheetUrl, urlObj.href).toString();
        }
        stylesheetUrls.push(stylesheetUrl);
      }
    }

    // Fetch external stylesheets in parallel (limit to top 5 files to avoid slow response)
    const activeStylesheets = stylesheetUrls.slice(0, 5);
    const cssFetchPromises = activeStylesheets.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(4000), // 4 seconds timeout
        });
        if (res.ok) {
          return await res.text();
        }
      } catch (e) {
        console.error(`Failed to fetch stylesheet: ${url}`, e);
      }
      return "";
    });

    const externalCss = await Promise.all(cssFetchPromises);
    cssContent += "\n" + externalCss.join("\n");

    // 2. Parse CSS Tokens
    
    // Extracted colors lists
    const hexRegex = /#([a-f0-9]{6}|[a-f0-9]{3})\b/gi;
    const rgbRegex = /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\)/gi;
    const hslRegex = /hsla?\s*\(\s*\d+\s*,\s*\d+(?:%|deg)?\s*,\s*\d+%\s*(?:,\s*[\d.]+)?\)/gi;

    const colorFrequencies: Record<string, number> = {};
    const registerColor = (colorStr: string) => {
      try {
        const hex = parseColorToHex(colorStr);
        if (hex && hex !== "#00000000") {
          colorFrequencies[hex] = (colorFrequencies[hex] || 0) + 1;
        }
      } catch {}
    };

    let match;
    // Hex colors matching
    while ((match = hexRegex.exec(cssContent)) !== null) {
      registerColor(match[0]);
    }
    // RGB colors matching
    while ((match = rgbRegex.exec(cssContent)) !== null) {
      registerColor(match[0]);
    }
    // HSL colors matching
    while ((match = hslRegex.exec(cssContent)) !== null) {
      registerColor(match[0]);
    }

    // Parse typography
    const fontRegex = /font-family:\s*([^;!}]+)/gi;
    const fontWeights = /font-weight:\s*([^;!}]+)/gi;
    const fontSizes = /font-size:\s*([^;!}]+)/gi;
    const lineHeights = /line-height:\s*([^;!}]+)/gi;
    const letterSpacings = /letter-spacing:\s*([^;!}]+)/gi;

    const extractTokens = (regex: RegExp, content: string, limit: number = 3): string[] => {
      const counts: Record<string, number> = {};
      let match;
      let iterations = 0;
      // Prevent infinite loops and throttle parsing
      while ((match = regex.exec(content)) !== null && iterations++ < 500) {
        const val = match[1].replace(/["']/g, "").trim();
        if (val && val.length < 50) {
          counts[val] = (counts[val] || 0) + 1;
        }
      }
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k)
        .slice(0, limit);
    };

    const families = extractTokens(fontRegex, cssContent, 5);
    const weights = extractTokens(fontWeights, cssContent, 3);
    const sizes = extractTokens(fontSizes, cssContent, 5);
    const heights = extractTokens(lineHeights, cssContent, 3);
    const spacings = extractTokens(letterSpacings, cssContent, 3);

    // Border Radius
    const borderRadiusRegex = /border-radius:\s*([^;!}]+)/gi;
    const radii = extractTokens(borderRadiusRegex, cssContent, 3);

    // Shadows
    const shadowRegex = /box-shadow:\s*([^;!}]+)/gi;
    const parsedShadows = extractTokens(shadowRegex, cssContent, 3);

    // Gradients
    const gradientRegex = /(?:linear|radial)-gradient\([^)]+\)/gi;
    const parsedGradients: string[] = [];
    let gradientMatch;
    let gradientIter = 0;
    while ((gradientMatch = gradientRegex.exec(cssContent)) !== null && gradientIter++ < 10) {
      if (!parsedGradients.includes(gradientMatch[0])) {
        parsedGradients.push(gradientMatch[0]);
      }
    }

    // 3. Cluster and Categorize Colors
    const sortedColors = Object.entries(colorFrequencies)
      .sort((a, b) => b[1] - a[1])
      .map(([hex]) => hex);

    // Group into Primary, Secondary, Backgrounds, Text, Accents
    const backgrounds: string[] = [];
    const textColors: string[] = [];
    const brandColors: string[] = [];
    const accentColors: string[] = [];

    // Simple heuristic separation
    sortedColors.forEach((color) => {
      // Check brightness/lightness of color
      const clean = color.replace("#", "");
      let r = 0, g = 0, b = 0;
      if (clean.length === 6) {
        r = parseInt(clean.substring(0, 2), 16);
        g = parseInt(clean.substring(2, 4), 16);
        b = parseInt(clean.substring(4, 6), 16);
      } else {
        r = parseInt(clean[0] + clean[0], 16);
        g = parseInt(clean[1] + clean[1], 16);
        b = parseInt(clean[2] + clean[2], 16);
      }
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      const isColorNeutral = isNeutral(color);

      if (isColorNeutral) {
        if (brightness > 220) {
          if (backgrounds.length < 2) backgrounds.push(color);
        } else if (brightness < 50) {
          if (textColors.length < 2) textColors.push(color);
        } else {
          if (brandColors.length < 2) brandColors.push(color);
        }
      } else {
        // Colored colors
        if (brightness > 60 && brightness < 200) {
          if (brandColors.length < 3) brandColors.push(color);
        } else {
          if (accentColors.length < 2) accentColors.push(color);
        }
      }
    });

    // Provide default fallback colors if scraping didn't find any or found too few
    const allColors = [...brandColors, ...accentColors, ...backgrounds, ...textColors];
    const fallbackPalette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#1f2937", "#f3f4f6"];
    
    const colors = allColors.length >= 4 ? allColors.slice(0, 8) : fallbackPalette;

    return NextResponse.json({
      success: true,
      site: urlObj.hostname,
      colors,
      categories: {
        primary: brandColors[0] || colors[0],
        secondary: brandColors[1] || colors[1] || colors[0],
        accent: accentColors[0] || colors[2] || colors[0],
        background: backgrounds[0] || "#ffffff",
        text: textColors[0] || "#111827",
      },
      typography: {
        family: families[0] || "Inter, system-ui, sans-serif",
        weight: weights[0] || "400",
        size: sizes[0] || "16px",
        lineHeight: heights[0] || "1.5",
        letterSpacing: spacings[0] || "normal",
      },
      borderRadii: {
        button: radii[0] || "0.375rem",
        card: radii[1] || "0.5rem",
        input: radii[2] || "0.375rem",
      },
      shadows: parsedShadows.length > 0 ? parsedShadows : [
        "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      ],
      spacings: {
        padding: "1rem (16px)",
        margin: "1.5rem (24px)",
        width: "1280px",
      },
      gradients: parsedGradients.length > 0 ? parsedGradients.slice(0, 3) : [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(to right, #ff7e5f, #feb47b)"
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Scraping failed: ${error.message || "Unknown error occurred"}` },
      { status: 500 }
    );
  }
}
