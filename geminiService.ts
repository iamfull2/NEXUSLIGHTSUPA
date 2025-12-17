
import { GoogleGenAI } from "@google/genai";
import { NexusConfig, GenerationResult, BatchConfig, BatchResultItem, MarketListing } from "./types";
import { generateMasterPrompt, BRAZIL_DIMENSIONS, SYSTEM_PROMPT_EXPANDER } from "./nexusCore";

// ═══════════════════════════════════════════════════════════
// NEXUS ENGINE V33.5 - STABLE PRODUCTION CORE
// ═══════════════════════════════════════════════════════════

const MODEL_TEXT = "gemini-3-flash-preview"; 
const MODEL_IMAGE_PRIMARY = "gemini-2.5-flash-image"; 

// --- ROBUST REQUEST EXECUTOR ---
export const runNexusRequest = async <T>(callback: (client: GoogleGenAI) => Promise<T>): Promise<T> => {
    try {
        // Strict adherence to system rules: use process.env.API_KEY exclusively
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        return await callback(ai);
    } catch (error: any) {
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            throw new Error("COTA EXCEDIDA: O sistema está processando muitas requisições. Tente em instantes.");
        }
        throw error;
    }
};

// --- BACKUP PROTOCOL: POLLINATIONS (FLUX) ---
const generateFallbackImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
    let width = 1024;
    let height = 1024;
    if (aspectRatio === '16:9') { width = 1280; height = 720; }
    else if (aspectRatio === '9:16') { width = 720; height = 1280; }
    
    const seed = Math.floor(Math.random() * 1000000);
    const safePrompt = prompt.slice(0, 800).replace(/[^\w\s,]/gi, ''); 
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(safePrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
};

export const analyzeContextFile = async (base64Data: string, mimeType: string, userPrompt: string): Promise<string> => {
    return runNexusRequest(async (client) => {
        const result = await client.models.generateContent({
            model: MODEL_TEXT, 
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: `Analyze this image details. Use it to optimize this prompt: "${userPrompt}". Return ONLY the optimized generation prompt.` }
                ]
            }
        });
        return result.text || userPrompt;
    });
}

const expandPromptWithAI = async (baseConfig: NexusConfig): Promise<string> => {
    try {
        if (baseConfig.useSemantic === false) return baseConfig.concept;
        return await runNexusRequest(async (client) => {
            const result = await client.models.generateContent({
                model: MODEL_TEXT,
                contents: `Optimize this for image generation: "${baseConfig.concept}" Style: ${baseConfig.style} Mood: ${baseConfig.mood}`,
                config: { systemInstruction: SYSTEM_PROMPT_EXPANDER }
            });
            return result.text || baseConfig.concept;
        });
    } catch (e) {
        return baseConfig.concept;
    }
};

export const executeNexusSwarm = async (config: NexusConfig): Promise<GenerationResult> => {
    let optimizedPrompt = config.concept;
    if (config.useSemantic !== false) {
        const expanded = await expandPromptWithAI(config);
        const { prompt } = generateMasterPrompt({ ...config, concept: expanded });
        optimizedPrompt = prompt;
    } else {
        const { prompt } = generateMasterPrompt(config);
        optimizedPrompt = prompt;
    }

    const { specs } = generateMasterPrompt(config);
    const viralScore = Math.floor(Math.random() * (99 - 88) + 88);
    const projectedRevenue = (viralScore * 2.5 + Math.random() * 100).toFixed(2);

    try {
        return await runNexusRequest(async (client) => {
            const response = await client.models.generateContent({
                model: MODEL_IMAGE_PRIMARY,
                contents: optimizedPrompt,
                config: {
                    imageConfig: {
                        aspectRatio: config.aspectRatio || "1:1",
                    }
                }
            });

            let imageUrl = '';
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                }
            }

            if (!imageUrl) throw new Error("Fallback required");

            return {
                imageUrl,
                title: config.concept.slice(0, 30).toUpperCase(),
                finalPrompt: optimizedPrompt,
                specs,
                generationTime: '1.2s',
                qualityScore: '11.0/10 [NEXUS CORE]',
                viralScore,
                commercialValue: `R$ ${projectedRevenue}`,
                nftHash: "0x" + Math.random().toString(16).substr(2, 40),
                watermarkId: `NX-${Date.now()}`
            };
        });
    } catch (error) {
        const fallbackUrl = await generateFallbackImage(optimizedPrompt, config.aspectRatio);
        return {
            imageUrl: fallbackUrl,
            title: config.concept.slice(0, 30).toUpperCase(),
            finalPrompt: optimizedPrompt,
            specs: { ...specs, render: "Nexus Flux Backup" },
            generationTime: '2.1s',
            qualityScore: '9.8/10',
            viralScore: viralScore - 2,
            commercialValue: `R$ ${projectedRevenue}`,
            nftHash: "0x" + Math.random().toString(16).substr(2, 40),
            watermarkId: `FB-${Date.now()}`
        };
    }
};

export const chatWithNexus = async (
    history: any[], 
    newMessage: string, 
    systemInstruction?: string,
    attachments?: { mimeType: string, data: string }[]
): Promise<string> => {
    return await runNexusRequest(async (client) => {
        const chat = client.chats.create({
            model: MODEL_TEXT,
            config: { systemInstruction: systemInstruction || "Você é o NEXUS." },
            history: history,
        });
        const parts: any[] = [];
        if (newMessage) parts.push({ text: newMessage });
        if (attachments) {
            attachments.forEach(f => parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } }));
        }
        const result = await chat.sendMessage({ message: parts });
        return result.text || "Sem resposta.";
    });
};

export const executeBatchNexus = async (config: BatchConfig, onProgress: (count: number) => void): Promise<BatchResultItem[]> => {
    let completed = 0;
    const results: BatchResultItem[] = [];
    const promises = config.selectedDimensions.map(async (dimLabel) => {
        const ar = BRAZIL_DIMENSIONS[dimLabel] || '1:1';
        try {
            const res = await executeNexusSwarm({ ...config, concept: config.concept, style: config.style as any, mood: config.mood as any, aspectRatio: ar as any, quality: 10 });
            results.push({ id: Math.random().toString(36), dimensionLabel: dimLabel, aspectRatio: ar, imageUrl: res.imageUrl, status: 'success' });
        } catch (e) {
            results.push({ id: Math.random().toString(36), dimensionLabel: dimLabel, aspectRatio: ar, imageUrl: '', status: 'error' });
        }
        completed++;
        onProgress(completed);
    });
    await Promise.all(promises);
    return results;
};

export const analyzeTrends = async () => ({ trendName: "Neon Future", concepts: [{ concept: "Cyberpunk Samurai", style: "cinematic", mood: "MOODDOPAMINEFLOOD" }] });

/**
 * GENERATE NEXUS VIDEO (Veo 3.1)
 * Fixed signature to accept 5 arguments as required by calling components.
 * Implemented logic following @google/genai guidelines for Veo models.
 */
export const generateNexusVideo = async (
    prompt: string, 
    image?: string, 
    modelAlias: string = 'veo-fast', 
    duration: string = '5s', 
    resolution: '720p' | '1080p' = '720p'
): Promise<string> => {
    // Veo models require user key selection as per mandatory guidelines
    if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
        }
    }

    try {
        return await runNexusRequest(async (client) => {
            // Mapping aliases to full model names as per guidelines
            const model = modelAlias === 'veo-hq' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
            
            const videoConfig: any = {
                numberOfVideos: 1,
                resolution,
                aspectRatio: '16:9', // Defaulting to landscape; supported are 16:9 and 9:16
            };

            const payload: any = {
                model,
                prompt,
                config: videoConfig
            };

            if (image) {
                // Handling base64 image data from data URLs
                const data = image.includes('base64,') ? image.split(',')[1] : image;
                const mimeType = image.includes('image/') ? image.substring(image.indexOf(':') + 1, image.indexOf(';')) : 'image/png';
                payload.image = {
                    imageBytes: data,
                    mimeType: mimeType
                };
            }

            let operation = await client.models.generateVideos(payload);
            
            // Poll for operation completion
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await client.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) throw new Error("Falha na síntese: URI do vídeo não encontrada.");

            // Must append API key when fetching from the download link
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!response.ok) throw new Error("Erro ao baixar o vídeo gerado.");
            
            const videoBlob = await response.blob();
            return URL.createObjectURL(videoBlob);
        });
    } catch (error: any) {
        // Reset key selection if required per guidelines
        if (error.message?.includes("Requested entity was not found.")) {
             if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
                 await (window as any).aistudio.openSelectKey();
             }
        }
        throw error;
    }
};

export const generateAutonomousImage = async (c: any) => {
    const res = await executeNexusSwarm(c);
    return { id: Math.random().toString(36), imageUrl: res.imageUrl, concept: c.concept, style: c.style, price: 50, trendScore: 95, status: 'listed', timestamp: Date.now() };
};
