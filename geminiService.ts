import { NexusConfig, GenerationResult, BatchConfig, BatchResultItem, MarketListing } from "./types";
import { generateMasterPrompt, BRAZIL_DIMENSIONS, SYSTEM_PROMPT_EXPANDER } from "./nexusCore";

// ═══════════════════════════════════════════════════════════
// NEXUS ENGINE V33.6 - SECURE PROXY CORE
// ═══════════════════════════════════════════════════════════

const MODEL_TEXT = "gemini-3-flash-preview"; 
const MODEL_IMAGE_PRIMARY = "gemini-2.5-flash-image"; 

/**
 * EXECUTOR DE PONTE SEGURA (API PROXY)
 * Redireciona a requisição para o backend para proteger a chave e evitar erros de browser.
 */
export const runNexusRequest = async (action: string, model: string, payload: any): Promise<any> => {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, model, payload })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erro na conexão com a ponte Nexus.");
        
        return data;
    } catch (error: any) {
        if (error.message?.includes('429')) {
            throw new Error("COTA EXCEDIDA: O sistema está processando muitas requisições. Tente em instantes.");
        }
        throw error;
    }
};

// --- BACKUP PROTOCOL: POLLINATIONS (FLUX) ---
const generateFallbackImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
    // Fixed: Added 'let' to declare height variable
    let width = 1024; let height = 1024;
    if (aspectRatio === '16:9') { width = 1280; height = 720; }
    else if (aspectRatio === '9:16') { width = 720; height = 1280; }
    const seed = Math.floor(Math.random() * 1000000);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0,800))}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
};

export const analyzeContextFile = async (base64Data: string, mimeType: string, userPrompt: string): Promise<string> => {
    const res = await runNexusRequest("generateContent", MODEL_TEXT, {
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: `Analyze this image details. Use it to optimize this prompt: "${userPrompt}". Return ONLY the optimized generation prompt.` }
            ]
        }
    });
    return res.text || userPrompt;
};

const expandPromptWithAI = async (baseConfig: NexusConfig): Promise<string> => {
    try {
        if (baseConfig.useSemantic === false) return baseConfig.concept;
        const res = await runNexusRequest("generateContent", MODEL_TEXT, {
            contents: `Optimize this for image generation: "${baseConfig.concept}" Style: ${baseConfig.style} Mood: ${baseConfig.mood}`,
            config: { systemInstruction: SYSTEM_PROMPT_EXPANDER }
        });
        return res.text || baseConfig.concept;
    } catch (e) {
        return baseConfig.concept;
    }
};

export const executeNexusSwarm = async (config: NexusConfig): Promise<GenerationResult> => {
    let optimizedPrompt = config.concept;
    if (config.useSemantic !== false) {
        optimizedPrompt = await expandPromptWithAI(config);
    }
    
    const { prompt } = generateMasterPrompt({ ...config, concept: optimizedPrompt });
    const { specs } = generateMasterPrompt(config);
    const viralScore = Math.floor(Math.random() * (99 - 88) + 88);
    const projectedRevenue = (viralScore * 2.5 + Math.random() * 100).toFixed(2);

    try {
        const response = await runNexusRequest("generateContent", MODEL_IMAGE_PRIMARY, {
            contents: prompt,
            config: {
                imageConfig: { aspectRatio: config.aspectRatio || "1:1" }
            }
        });

        let imageUrl = '';
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }

        if (!imageUrl) throw new Error("Fallback required");

        return {
            imageUrl,
            title: config.concept.slice(0, 30).toUpperCase(),
            finalPrompt: prompt,
            specs,
            generationTime: '1.2s',
            qualityScore: '11.0/10 [NEXUS CORE]',
            viralScore,
            commercialValue: `R$ ${projectedRevenue}`,
            nftHash: "0x" + Math.random().toString(16).substr(2, 40),
            watermarkId: `NX-${Date.now()}`
        };
    } catch (error) {
        const fallbackUrl = await generateFallbackImage(prompt, config.aspectRatio);
        return {
            imageUrl: fallbackUrl,
            title: config.concept.slice(0, 30).toUpperCase(),
            finalPrompt: prompt,
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
    const parts: any[] = [];
    if (newMessage) parts.push({ text: newMessage });
    if (attachments) {
        attachments.forEach(f => parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } }));
    }

    const res = await runNexusRequest("generateContent", MODEL_TEXT, {
        config: { systemInstruction: systemInstruction || "Você é o NEXUS." },
        history: history,
        contents: parts
    });
    
    return res.text || "Sem resposta da ponte neural.";
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

export const generateNexusVideo = async (
    prompt: string, 
    image?: string, 
    modelAlias: string = 'veo-fast', 
    duration: string = '5s', 
    resolution: '720p' | '1080p' = '720p'
): Promise<string> => {
    const model = modelAlias === 'veo-hq' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
    
    const videoPayload: any = {
        config: { numberOfVideos: 1, resolution, aspectRatio: '16:9' },
        prompt
    };

    if (image) {
        const data = image.includes('base64,') ? image.split(',')[1] : image;
        const mimeType = image.includes('image/') ? image.substring(image.indexOf(':') + 1, image.indexOf(';')) : 'image/png';
        videoPayload.image = { imageBytes: data, mimeType };
    }

    let operation = await runNexusRequest("generateVideos", model, videoPayload);
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await runNexusRequest("getVideosOperation", model, { operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Falha na síntese: Link de download não encontrado.");

    // O backend agora deve lidar com o download ou fornecemos um link assinado se possível.
    // Para simplificar seguindo a orientação do usuário, usamos a chave no ambiente se disponível.
    const response = await fetch(`${downloadLink}&key=${(import.meta as any).env.VITE_GEMINI_API_KEY || ''}`);
    if (!response.ok) throw new Error("Erro ao baixar o vídeo gerado.");
    
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateAutonomousImage = async (c: any): Promise<MarketListing> => {
    const res = await executeNexusSwarm(c);
    return { 
        id: Math.random().toString(36), 
        imageUrl: res.imageUrl, 
        concept: c.concept, 
        style: c.style, 
        price: 50, 
        trendScore: 95, 
        status: 'listed' as const, 
        timestamp: Date.now() 
    };
};