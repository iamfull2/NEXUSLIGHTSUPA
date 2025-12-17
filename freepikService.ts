import { runNexusRequest } from './geminiService';

/**
 * FREEPIK MCP MODULE (Model Context Protocol) V3.3 SECURE
 * Ported to direct environment use.
 */

interface FreepikGenerationParams {
    prompt: string;
    model: 'flux1' | 'mystic25' | 'seedream';
    aspectRatio: string;
}

export const generateWithFreepik = async (params: FreepikGenerationParams): Promise<string> => {
    const env = (import.meta as any).env || {};
    const apiKey = env.VITE_FREEPIK_API_KEY;

    // Use standard mappings for aspect ratio
    let ar = "square";
    if (params.aspectRatio === "16:9") ar = "landscape_16_9";
    if (params.aspectRatio === "9:16") ar = "portrait_16_9";

    const proxyUrl = "https://corsproxy.io/?https://api.freepik.com/v1/ai/text-to-image";

    try {
        if (!apiKey) throw new Error("Fallback triggered");

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-freepik-api-key': apiKey,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                prompt: params.prompt,
                model: params.model === 'mystic25' ? 'mystic-2.5' : 'flux-1.1-pro', 
                image: { size: ar },
                num_images: 1
            })
        });

        const data = await response.json();
        if (data.data && data.data[0]?.base64) {
            const raw = data.data[0].base64.trim();
            return raw.startsWith('data:image') ? raw : `data:image/png;base64,${raw}`;
        }
        throw new Error("Invalid response");

    } catch (error) {
        // Silent fallback to Gemini Engine which is pre-configured
        // Fixed: Correct signature for runNexusRequest. Used gemini-2.5-flash-image.
        return runNexusRequest("generateContent", 'gemini-2.5-flash-image', {
            contents: params.prompt,
            config: { imageConfig: { aspectRatio: params.aspectRatio as any || '1:1' } }
        });
    }
};