import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Missing 'prompt' parameter" }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NVIDIA_API_KEY environment variable is not configured. Please add it to your .env.local file." },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert design system generator.
Given a prompt describing a style, theme, or mood, generate a cohesive design system palette and design tokens in JSON format.
You must return ONLY the raw JSON object, without any markdown formatting (do not wrap in \`\`\`json block or backticks).

JSON Structure:
{
  "colors": ["#HEX1", "#HEX2", "#HEX3", "#HEX4", "#HEX5", "#HEX6", "#HEX7", "#HEX8"], // Array of exactly 8 colors matching the theme, from primary to neutral/text
  "categories": {
    "primary": "#HEX1", // The dominant brand color
    "secondary": "#HEX2", // Supporting brand color
    "accent": "#HEX3", // Action/highlight color
    "background": "#HEX4", // Primary app canvas background (light or dark depending on prompt)
    "text": "#HEX5" // High contrast text color relative to the background
  },
  "typography": {
    "family": "Font Family Name, e.g. Outfit, system-ui, sans-serif",
    "weight": "font weight, e.g. 400 or 500 or 600",
    "size": "base font size, e.g. 16px or 14px",
    "lineHeight": "base line height, e.g. 1.5 or 1.6",
    "letterSpacing": "normal or -0.01em or 0.02em"
  },
  "borderRadii": {
    "button": "e.g. 0.375rem or 0.5rem or 9999px",
    "card": "e.g. 0.75rem or 1rem or 0px",
    "input": "e.g. 0.375rem or 0.25rem"
  },
  "shadows": [
    "e.g. 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    "e.g. 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
  ], // Array of exactly 2 shadow styles (small, medium)
  "spacings": {
    "padding": "base padding, e.g. 1rem (16px)",
    "margin": "base margin, e.g. 1.5rem (24px)",
    "width": "max container width, e.g. 1200px"
  },
  "gradients": [
    "linear-gradient(135deg, #HEX1 0%, #HEX2 100%)",
    "linear-gradient(to right, #HEX2, #HEX3)"
  ] // Array of 2 CSS gradient strings matching the theme
}

Ensure the colors are beautiful, harmonized, and accessible. The text color must have high contrast with the background color. Make sure the background color matches the prompt (e.g. if prompt is 'dark midnight', use a very dark color for background and light color for text/neutral).`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a design system for: "${prompt}"` }
        ],
        temperature: 0.2,
        max_tokens: 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `NVIDIA API error: Status ${response.status} - ${errText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "";

    // Clean up any markdown blocks if present
    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.substring(7);
    } else if (text.startsWith("```")) {
      text = text.substring(3);
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", text);
      return NextResponse.json(
        { error: "AI returned invalid JSON formatting. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      site: `AI: ${prompt}`,
      ...parsedResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown server error" }, { status: 500 });
  }
}
