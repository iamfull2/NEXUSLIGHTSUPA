import { StyleReferenceAnalysis } from "./types";

/**
 * STYLE TRANSFER ENGINE
 * Client-side analysis of reference images
 */

export class StyleTransferEngine {

    static async analyze(imageUrl: string): Promise<StyleReferenceAnalysis> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imageUrl;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject("No Canvas Context");

                canvas.width = 100; // Small size for performance
                canvas.height = 100;
                ctx.drawImage(img, 0, 0, 100, 100);

                const data = ctx.getImageData(0, 0, 100, 100).data;
                const colorMap: Record<string, number> = {};
                let rTotal = 0, gTotal = 0, bTotal = 0;

                for (let i = 0; i < data.length; i += 4) {
                    const r = Math.floor(data[i] / 32) * 32;
                    const g = Math.floor(data[i+1] / 32) * 32;
                    const b = Math.floor(data[i+2] / 32) * 32;
                    const key = `rgb(${r},${g},${b})`;
                    colorMap[key] = (colorMap[key] || 0) + 1;
                    
                    rTotal += data[i];
                    gTotal += data[i+1];
                    bTotal += data[i+2];
                }

                // Sort colors by frequency
                const sortedColors = Object.entries(colorMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([color]) => color);

                const pixelCount = data.length / 4;
                const avgBrightness = (rTotal + gTotal + bTotal) / (pixelCount * 3);
                
                const brightness = avgBrightness > 180 ? 'high-key' : avgBrightness < 80 ? 'low-key' : 'balanced';
                const contrast = 'standard'; // Simplified for this demo

                const promptAddition = `color palette of ${sortedColors.join(', ')}, ${brightness} lighting style`;

                resolve({
                    colors: sortedColors,
                    brightness,
                    contrast,
                    promptAddition
                });
            };

            img.onerror = (e) => reject(e);
        });
    }
}
