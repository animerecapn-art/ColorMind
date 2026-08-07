// Image dominant colors extractor using canvas pixel quantization

import { rgbToHex, hexToRgb } from "./colorUtils";

export function extractDominantColors(
  imageUrl: string,
  maxColors: number = 8
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Downscale image to 100x100 for high-speed processing and filtering noise
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        const width = 100;
        const height = 100;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Group colors into buckets by rounding channels
        const colorCounts: Record<string, number> = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Round R, G, B to nearest 16 to bin color channels
          const roundR = Math.round(r / 16) * 16;
          const roundG = Math.round(g / 16) * 16;
          const roundB = Math.round(b / 16) * 16;

          const key = `${roundR},${roundG},${roundB}`;
          colorCounts[key] = (colorCounts[key] || 0) + 1;
        }

        // Sort by frequency
        const sortedColors = Object.entries(colorCounts)
          .map(([rgbStr, count]) => {
            const [r, g, b] = rgbStr.split(",").map(Number);
            return { r, g, b, count };
          })
          .sort((a, b) => b.count - a.count);

        // Deduplicate and merge colors that are very close (Euclidean distance < 50)
        const finalColors: { r: number; g: number; b: number }[] = [];
        const distanceThreshold = 50;

        for (const color of sortedColors) {
          if (finalColors.length >= maxColors) break;

          let isTooClose = false;
          for (const finalColor of finalColors) {
            const distance = Math.sqrt(
              Math.pow(color.r - finalColor.r, 2) +
                Math.pow(color.g - finalColor.g, 2) +
                Math.pow(color.b - finalColor.b, 2)
            );

            if (distance < distanceThreshold) {
              isTooClose = true;
              break;
            }
          }

          if (!isTooClose) {
            finalColors.push(color);
          }
        }

        const hexColors = finalColors.map((rgb) => rgbToHex(rgb));
        resolve(hexColors);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = imageUrl;
  });
}
