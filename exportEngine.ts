import { ExportConfig } from "./types";

/**
 * EXPORT ANYWHERE ENGINE (V36)
 * Handles client-side resizing and format conversion.
 */

export const SOCIAL_DIMENSIONS: Record<string, { w: number, h: number }> = {
    'instagram-story': { w: 1080, h: 1920 },
    'instagram-feed': { w: 1080, h: 1080 },
    'youtube-thumb': { w: 1280, h: 720 },
    'twitter-post': { w: 1200, h: 675 },
    'linkedin': { w: 1200, h: 627 }
};

export class ExportEngine {

    static async process(imageUrl: string, config: ExportConfig): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imageUrl;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                // Determine Dimensions
                let targetW = img.width;
                let targetH = img.height;

                if (config.platform && SOCIAL_DIMENSIONS[config.platform]) {
                    targetW = SOCIAL_DIMENSIONS[config.platform].w;
                    targetH = SOCIAL_DIMENSIONS[config.platform].h;
                } else if (config.width && config.height) {
                    targetW = config.width;
                    targetH = config.height;
                }

                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject("No Canvas");

                // Smart Crop / Fit
                const scale = Math.max(targetW / img.width, targetH / img.height);
                const x = (targetW / 2) - (img.width / 2) * scale;
                const y = (targetH / 2) - (img.height / 2) * scale;
                
                // Draw white background for transparent images (if exporting to jpg)
                if (config.format === 'jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, targetW, targetH);
                }

                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject("Blob creation failed");
                    }, 
                    `image/${config.format}`, 
                    config.quality
                );
            };
            img.onerror = reject;
        });
    }
}
