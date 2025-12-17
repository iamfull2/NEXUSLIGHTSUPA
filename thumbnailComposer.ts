import { ThumbnailConfig } from "./types";

/**
 * SMART THUMBNAIL COMPOSER (V36)
 * Composes layers into a final YouTube-ready thumbnail.
 */

export class ThumbnailComposer {
    
    static async compose(config: ThumbnailConfig, assets: {
        bgUrl: string,
        mainUrl: string,
        elementUrls: string[]
    }): Promise<string> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1280;
            canvas.height = 720;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject("No context");

            const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = src;
                img.onload = () => res(img);
                img.onerror = rej;
            });

            Promise.all([
                loadImg(assets.bgUrl),
                loadImg(assets.mainUrl),
                ...assets.elementUrls.map(url => loadImg(url))
            ]).then(([bg, main, ...elements]) => {
                
                // 1. Draw Background
                ctx.drawImage(bg, 0, 0, 1280, 720);

                // 2. Draw Elements (Behind)
                elements.forEach((el, i) => {
                    if (i % 2 === 0) { // Some behind
                        ctx.drawImage(el, 50 + (i * 100), 100 + (i * 50), 200, 200);
                    }
                });

                // 3. Draw Main Image (Cutout)
                // Center-right usually
                const mainScale = Math.min(720 / main.height, 600 / main.width);
                const mW = main.width * mainScale;
                const mH = main.height * mainScale;
                ctx.drawImage(main, 1280 - mW - 50, 720 - mH, mW, mH);

                // 4. Draw Elements (Front)
                elements.forEach((el, i) => {
                    if (i % 2 !== 0) { // Some in front
                        ctx.drawImage(el, 1000 - (i * 100), 500 - (i * 50), 150, 150);
                    }
                });

                // 5. Draw Title
                ctx.save();
                ctx.font = "900 120px Impact, sans-serif";
                ctx.fillStyle = "white";
                ctx.strokeStyle = "black";
                ctx.lineWidth = 8;
                ctx.shadowColor = "rgba(0,0,0,0.8)";
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = 10;
                ctx.shadowOffsetY = 10;
                
                // Word wrap logic simplified
                const words = config.title.toUpperCase().split(' ');
                let y = 200;
                words.forEach(word => {
                    ctx.strokeText(word, 50, y);
                    ctx.fillText(word, 50, y);
                    y += 110;
                });
                ctx.restore();

                resolve(canvas.toDataURL('image/png'));
            }).catch(reject);
        });
    }
}
