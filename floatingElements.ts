import { PerfectCutoutEngine } from "./perfectCutout";

/**
 * FLOATING ELEMENTS AI (V36)
 * Generates specific isolated assets and processes them for transparency.
 */

export const ELEMENT_PRESETS = {
    'coins': 'golden coins flying through air, realistic 3D render, motion blur, isolated on white background',
    'fire': 'realistic fire explosion fireball, volumetric flames, isolated on black background',
    'lightning': 'electric lightning bolt, blue plasma energy, isolated on black background',
    'smoke': 'ethereal white smoke wisps, flowing vapor, isolated on black background',
    'leaves': 'autumn leaves falling, motion blur, realistic, isolated on white background'
};

export class FloatingElementsAI {
    
    static generatePrompt(preset: keyof typeof ELEMENT_PRESETS): string {
        return ELEMENT_PRESETS[preset] || 'isolated object, white background';
    }

    // Simulates the workflow of generating -> cutting out
    // In a real app, this would call the GenAI model first, then Cutout
    static async processElement(rawImageUrl: string): Promise<string> {
        // Assume rawImageUrl comes from the generator (e.g., on white background)
        // We run the cutout engine
        return await PerfectCutoutEngine.process(rawImageUrl, 30);
    }
}
