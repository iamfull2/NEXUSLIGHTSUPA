
/**
 * PERFECT CUTOUT ENGINE V2.0 (Browser Native)
 * 
 * ARCHITECTURE:
 * 1. Primary: Canvas-based Pixel Manipulation (Local)
 * 2. Fallback: Simulated External API Calls (Placeholder for remove.bg / Clipdrop)
 */

export class PerfectCutoutEngine {
    
    // --- CANVAS ENGINE (Local) ---
    static async process(imageUrl: string, threshold = 20): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imageUrl;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                if (!ctx) return reject("No Canvas Context");

                // Draw original
                ctx.drawImage(img, 0, 0);
                
                // Get pixel data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Simple algorithm: Assume top-left pixel is background color
                // In a real V2, this would use Web Assembly (wasm) with a model like rembg-wasm
                const bgR = data[0];
                const bgG = data[1];
                const bgB = data[2];

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Euclidean distance
                    const dist = Math.sqrt(
                        Math.pow(r - bgR, 2) + 
                        Math.pow(g - bgG, 2) + 
                        Math.pow(b - bgB, 2)
                    );

                    // If close to background color, make transparent
                    if (dist < threshold) {
                        data[i + 3] = 0; // Alpha 0
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = (e) => reject(e);
        });
    }

    // --- EDGE REFINEMENT ---
    static async addShadow(imageUrl: string, blur = 20, color = 'rgba(0,0,0,0.5)'): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = imageUrl;
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const pad = blur * 2;
                canvas.width = img.width + pad * 2;
                canvas.height = img.height + pad * 2;
                const ctx = canvas.getContext('2d');
                
                if (!ctx) return reject("No context");

                // Draw Shadow
                ctx.shadowColor = color;
                ctx.shadowBlur = blur;
                ctx.shadowOffsetX = 10;
                ctx.shadowOffsetY = 10;
                ctx.drawImage(img, pad, pad);
                
                // Reset shadow and draw image on top
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.drawImage(img, pad, pad);

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
        });
    }

    // --- COMPOSITING ---
    static async composite(foregroundUrl: string, background: { type: 'color' | 'image', value: string }): Promise<string> {
        return new Promise((resolve, reject) => {
            const fg = new Image();
            fg.crossOrigin = "Anonymous";
            fg.src = foregroundUrl;
            fg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = fg.width;
                canvas.height = fg.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject("No Canvas Context");

                if (background.type === 'color') {
                    ctx.fillStyle = background.value;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(fg, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } else if (background.type === 'image') {
                    const bg = new Image();
                    bg.crossOrigin = "Anonymous";
                    bg.src = background.value;
                    bg.onload = () => {
                        // Draw BG cover
                        // Scale background to cover the canvas maintaining aspect ratio
                        const scale = Math.max(canvas.width / bg.width, canvas.height / bg.height);
                        const x = (canvas.width / 2) - (bg.width / 2) * scale;
                        const y = (canvas.height / 2) - (bg.height / 2) * scale;
                        
                        ctx.drawImage(bg, x, y, bg.width * scale, bg.height * scale);
                        ctx.drawImage(fg, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    bg.onerror = (e) => reject("Failed to load background image");
                }
            };
            fg.onerror = reject;
        });
    }
}
