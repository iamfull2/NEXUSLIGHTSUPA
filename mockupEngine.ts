import { MockupTemplate } from "./types";

/**
 * ONE-CLICK MOCKUP MAGIC (V36)
 * Composes images into device frames using Canvas.
 */

export const MOCKUP_TEMPLATES: Record<string, MockupTemplate> = {
    'iphone-15': {
        id: 'iphone-15',
        name: 'iPhone 15 Pro',
        category: 'device',
        // In a real app, these would be URLs to transparent PNGs of the phone frame
        baseImage: 'https://placehold.co/600x1200/1a1a1a/FFF?text=iPhone+Frame', 
        screenX: 50,
        screenY: 50,
        screenWidth: 500,
        screenHeight: 1100
    },
    'macbook': {
        id: 'macbook',
        name: 'MacBook Pro',
        category: 'device',
        baseImage: 'https://placehold.co/1200x800/ccc/333?text=MacBook+Frame',
        screenX: 150,
        screenY: 50,
        screenWidth: 900,
        screenHeight: 560
    },
    'poster': {
        id: 'poster',
        name: 'Wall Poster',
        category: 'print',
        baseImage: 'https://placehold.co/1000x1200/eee/999?text=Poster+Frame',
        screenX: 100,
        screenY: 100,
        screenWidth: 800,
        screenHeight: 1000
    }
};

export class MockupEngine {
    
    static async generate(imageToMockup: string, templateKey: string): Promise<string> {
        const template = MOCKUP_TEMPLATES[templateKey];
        if (!template) throw new Error("Template not found");

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject("No Canvas Context");

            const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = src;
                img.onload = () => res(img);
                img.onerror = rej;
            });

            Promise.all([
                loadImg(template.baseImage),
                loadImg(imageToMockup)
            ]).then(([frame, screen]) => {
                canvas.width = frame.width;
                canvas.height = frame.height;

                // 1. Draw Screen Content first (so frame can sit on top if needed, or masked)
                // Note: Simple rectangles here. Advanced perspective requires 3D lib or matrix transforms.
                ctx.drawImage(screen, template.screenX, template.screenY, template.screenWidth, template.screenHeight);

                // 2. Draw Frame on top (assuming frame image has transparent screen area)
                // For this demo with placeholders, we draw frame first actually to simulate the background, 
                // but usually the frame is an overlay. 
                // Let's assume standard compositing: Draw Screen, then mask/overlay. 
                // Since placeholders aren't transparent, we'll draw frame THEN screen for the demo visual.
                
                // Resetting for demo visual with opaque placeholders:
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(frame, 0, 0);
                ctx.drawImage(screen, template.screenX, template.screenY, template.screenWidth, template.screenHeight);

                resolve(canvas.toDataURL('image/png'));
            }).catch(reject);
        });
    }
}
