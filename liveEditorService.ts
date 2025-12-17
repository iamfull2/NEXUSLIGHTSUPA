
import { PerfectCutoutEngine } from "./perfectCutout";
import { runNexusRequest } from "./geminiService";
import { GenerateContentResponse } from "@google/genai";
import { SceneLayer } from "./types";

/**
 * LIVE EDITOR AI SERVICES (V37 COMPLETE)
 * Client-side implementation of the NEXUS V37 Generator Routes.
 * Replaces DALL-E 3 with Gemini 2.5 Flash Image.
 */

export class LiveEditorService {

    // ═══════════════════════════════════════════════════════════
    // PROMPT ENHANCER (QUALITY CONTROL)
    // ═══════════════════════════════════════════════════════════
    
    private static enhancePrompt(basePrompt: string, context: string = ''): string {
        // Injeta tokens de qualidade para evitar imagens "defeituosas"
        const qualityTokens = "masterpiece, best quality, ultra-detailed, 8k, sharp focus, professional lighting, octane render";
        const negativeTokens = " --no blur, distortion, low quality, text, watermark, bad anatomy, deformed, pixelated, ugly";
        return `${basePrompt}. ${context}. ${qualityTokens}${negativeTokens}`;
    }

    // ═══════════════════════════════════════════════════════════
    // GEMINI PROMPT BUILDER (Reasoning Layer)
    // ═══════════════════════════════════════════════════════════

    private static async buildTitlePrompt(text: string, style: string, size: string, background: string, description: string): Promise<string> {
        const prompt = `
        3D Typography Design of the text "${text}".
        Style: ${style}, ${description}.
        View: Front facing, clear legibility.
        Details: High gloss, metallic or glowing texture depending on style.
        Lighting: Cinematic studio lighting.
        Background: ${background === 'transparent' ? 'ISOLATED ON PURE WHITE BACKGROUND' : background}.
        `;
        return this.enhancePrompt(prompt, "Typography Render");
    }

    private static async buildLogoPrompt(brandName: string, style: string, industry: string, color: string, inspiration: string): Promise<string> {
        const prompt = `
        Professional vector-style logo symbol for brand "${brandName}".
        Industry: ${industry}.
        Style: ${style}, ${inspiration}.
        Primary Color: ${color}.
        Composition: Centered, symmetrical or balanced.
        Background: ISOLATED ON PURE WHITE BACKGROUND.
        `;
        return this.enhancePrompt(prompt, "Vector Design");
    }

    private static async buildAssetPrompt(type: string, description: string, style: string): Promise<string> {
        const prompt = `
        Game Asset / UI Element: ${type}.
        Description: ${description}.
        Style: ${style}.
        View: Isometric or Frontal depending on object.
        Background: ISOLATED ON PURE WHITE BACKGROUND.
        `;
        return this.enhancePrompt(prompt, "Digital Asset");
    }

    private static async buildMascotPrompt(role: string, archetype: string, expression: string): Promise<string> {
        const prompt = `
        3D Character Render of a Nexus Mascot.
        Role: ${role}. Archetype: ${archetype}.
        Expression: ${expression}.
        Appearance: Cute, futuristic robot or creature, glowing blue accents, white ceramic armor, high tech.
        Style: Pixar-style 3D render, subsurface scattering.
        Background: ISOLATED ON PURE WHITE BACKGROUND.
        `;
        return this.enhancePrompt(prompt, "Character Design");
    }

    // ═══════════════════════════════════════════════════════════
    // SCENE DECOMPOSITION & GENERATION (Layered System)
    // ═══════════════════════════════════════════════════════════

    static async generateLayeredScene(prompt: string, style: string): Promise<SceneLayer[]> {
        console.log("🧩 Initiating Layered Scene Generation...");

        // 1. Analyze and Split Prompt (Simplified for speed/reliability)
        // We force a structure to ensure Gemini understands the task
        const decompositionPrompt = `
            Split this scene description into 3 visual layers:
            Scene: "${prompt}"
            
            1. Background (Environment, Sky, Walls)
            2. Middle Ground (Main Subject, Character, Object)
            3. Foreground (Particles, Fog, Leaves, Overlay elements)
            
            Return JSON: { "bg": "...", "mid": "...", "fg": "..." }
        `;

        let components = { bg: prompt + " background", mid: prompt + " subject", fg: "atmospheric particles" };
        
        try {
            const analysisRes = await runNexusRequest<GenerateContentResponse>(async (client) => client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: decompositionPrompt }] },
                config: { responseMimeType: "application/json" }
            }));
            const parsed = JSON.parse(analysisRes.text || "{}");
            if (parsed.bg) components = parsed;
        } catch (e) {
            console.warn("Analysis failed, using fallback decomposition.");
        }

        const layers: SceneLayer[] = [];

        // 2. Generate Layers (Parallel Execution)
        const genLayer = async (name: string, desc: string, needsCutout: boolean, zIndex: number) => {
            if (!desc || desc.length < 3) return;
            
            const context = needsCutout ? "ISOLATED ON PURE WHITE BACKGROUND" : "Full frame background";
            const fullPrompt = this.enhancePrompt(`${desc}, ${style} style`, context);
            
            try {
                const img = await this.generateImage(fullPrompt, '16:9'); 
                
                let finalUrl = img;
                if (needsCutout) {
                    finalUrl = await PerfectCutoutEngine.process(img, 20);
                }

                layers.push({
                    id: Math.random().toString(36).substr(2,9),
                    name,
                    prompt: desc,
                    url: finalUrl,
                    zIndex
                });
            } catch (e) {
                console.error(`Failed to generate layer ${name}`, e);
            }
        };

        await Promise.all([
            genLayer('Background', components.bg, false, 0),
            genLayer('Subject', components.mid, true, 10),
            genLayer('Foreground', components.fg, true, 20)
        ]);

        return layers.sort((a, b) => a.zIndex - b.zIndex);
    }

    // ═══════════════════════════════════════════════════════════
    // IMAGE GENERATION (Materialization Layer)
    // ═══════════════════════════════════════════════════════════

    private static async generateImage(prompt: string, aspectRatio: '1:1' | '16:9' = '1:1'): Promise<string> {
        console.log("🎨 Generative Request:", prompt.substring(0, 50) + "...");
        
        try {
            const response = await runNexusRequest<GenerateContentResponse>(async (client) => client.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { 
                    imageConfig: { aspectRatio: aspectRatio },
                }
            }));

            // Iterate parts to find image, following guidelines
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            
            throw new Error("Model returned no image data");
        } catch (error: any) {
            console.error("Gemini Generation Error:", error);
            throw new Error(error.message || "Generation failed");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PUBLIC METHODS
    // ═══════════════════════════════════════════════════════════

    static async generateTitle(text: string, style: string, size: string, background: string, description: string): Promise<string> {
        const enhancedPrompt = await this.buildTitlePrompt(text, style, size, background, description);
        const img = await this.generateImage(enhancedPrompt, '16:9');
        if (background === 'transparent') {
            return await PerfectCutoutEngine.process(img, 25);
        }
        return img;
    }

    static async generateLogo(brandName: string, style: string, industry: string, color: string, inspiration: string): Promise<string> {
        const enhancedPrompt = await this.buildLogoPrompt(brandName, style, industry, color, inspiration);
        const img = await this.generateImage(enhancedPrompt, '1:1');
        return await PerfectCutoutEngine.process(img, 25);
    }

    static async generateAsset(type: string, description: string, style: string): Promise<string> {
        const enhancedPrompt = await this.buildAssetPrompt(type, description, style);
        const img = await this.generateImage(enhancedPrompt, '1:1');
        return await PerfectCutoutEngine.process(img, 25);
    }

    static async generateMascot(role: string, archetype: string, expression: string): Promise<string> {
        const enhancedPrompt = await this.buildMascotPrompt(role, archetype, expression);
        const img = await this.generateImage(enhancedPrompt, '1:1');
        return await PerfectCutoutEngine.process(img, 20);
    }

    static async upscaleImage(image: string, scale: string, mode: string): Promise<string> {
        const prompt = `Upscale this image by ${scale} using ${mode} mode. Enhance details, sharpen, maintain fidelity, do not change content. Output high resolution.`;
        
        try {
            const mimeType = image.substring(image.indexOf(':') + 1, image.indexOf(';'));
            const base64 = image.split(',')[1];

            const response = await runNexusRequest<GenerateContentResponse>(async (client) => client.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { 
                    parts: [
                        { inlineData: { mimeType, data: base64 } },
                        { text: prompt }
                    ] 
                }
            }));

            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            throw new Error("Upscaling returned no data");
        } catch (e: any) {
            throw new Error("Upscaling falhou: " + e.message);
        }
    }
}
