import { HyperRealismPreset } from "./types";

/**
 * HYPER-REALISM ENGINE (V37.2)
 * Presets for achieving PBR-like quality in generation via Prompt Engineering.
 * Simulates physical camera properties and render engine settings.
 */

export const HYPER_REALISM_PRESETS: Record<string, HyperRealismPreset> = {
    'photo-studio': {
        id: 'photo-studio',
        name: 'Photo Studio',
        description: 'Professional studio lighting with softboxes and rim lights.',
        quality: 1.0,
        settings: {
            promptMod: 'studio lighting, 85mm lens, f/1.8 aperture, creamy bokeh, softbox lighting, high key, sharp focus, phase one xf iq4, 150mp',
            negative: 'low resolution, noise, grain, distortion, bad lighting, shadows'
        }
    },
    'cinematic-raw': {
        id: 'cinematic-raw',
        name: 'Cinematic RAW',
        description: 'Arri Alexa look with anamorphic lens flares and film grain.',
        quality: 1.0,
        settings: {
            promptMod: 'shot on Arri Alexa LF, anamorphic lens 50mm, film grain, color graded, cinematic lighting, teal and orange, volumetric fog, motion blur, global illumination',
            negative: 'digital look, oversaturated, clean, cgi, 3d render look'
        }
    },
    'architectural': {
        id: 'architectural',
        name: 'Arch Viz',
        description: 'V-Ray style architectural visualization with perfect lines.',
        quality: 1.0,
        settings: {
            promptMod: 'architectural photography, tilt-shift lens 24mm, daylight 5600k, hard shadows, interior design magazine, v-ray 6 render, path tracing, photorealistic',
            negative: 'curved lines, distorted perspective, blurry, messy, organic chaos'
        }
    },
    'macro-product': {
        id: 'macro-product',
        name: 'Macro Product',
        description: 'Extreme close-up details for product photography.',
        quality: 1.0,
        settings: {
            promptMod: 'macro photography, 100mm macro lens f/2.8, extreme detail, subsurface scattering, texture focus, caustic lighting, octane render, product shot',
            negative: 'wide angle, distant, low detail, blur, pixelated'
        }
    },
    'maximum-quality': {
        id: 'maximum-quality',
        name: 'Maximum Quality (Slow)',
        description: 'Absolute peak fidelity using Arnold Render simulation.',
        quality: 1.0,
        settings: {
            promptMod: 'arnold render, 20000 samples, unbiased path tracing, spectral rendering, physically accurate materials, micro-details, 8k resolution, raw output',
            negative: 'denoising artifacts, compression, jpeg artifacts, low poly'
        }
    }
};

export class HyperRealismEngine {
    static getPromptModifier(presetId: string): string {
        return HYPER_REALISM_PRESETS[presetId]?.settings.promptMod || '';
    }
}
