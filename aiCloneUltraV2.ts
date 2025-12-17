
import { CloneAnalysisResult } from "./types";
import { runNexusRequest } from "./geminiService";
import { GenerateContentResponse } from "@google/genai";

/**
 * AI CLONE ULTRA V3.0 (Client-Side Adaptation)
 * Uses Gemini 1.5/2.5 Flash Vision capabilities to analyze reference images
 * and extract "Style DNA" for cloning.
 */

export class AICloneUltraV2 {

    static async analyzeReference(imageUrl: string): Promise<CloneAnalysisResult> {
        try {
            // Extract base64 data and mime type
            const base64Data = imageUrl.split(',')[1];
            const mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));

            console.log("👁️ AI Clone V3: Analyzing Reference Image...");

            const response = await runNexusRequest<GenerateContentResponse>(async (client) => client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        parts: [
                            { inlineData: { mimeType, data: base64Data } },
                            { text: `ANÁLISE ULTRA-PROFUNDA para recriação de imagem.

                            Analise e retorne APENAS um objeto JSON com os seguintes campos (sem markdown):
                            {
                            "content": "descrição detalhada do conteúdo",
                            "style": "estilo visual exato",
                            "lighting": "tipo e qualidade de iluminação",
                            "colors": ["#hex1", "#hex2", "#hex3"],
                            "composition": "tipo de composição",
                            "mood": "atmosfera",
                            "technical": "qualidade técnica",
                            "generatedPrompt": "prompt ultra-detalhado de 200+ palavras para recriação perfeita"
                            }` }
                        ]
                    }
                ]
            }));

            const text = response.text || "";
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                console.log("✅ Clone DNA Extracted:", analysis);
                return analysis;
            } else {
                throw new Error("Failed to parse Clone DNA");
            }

        } catch (e) {
            console.error("Clone Analysis Failed", e);
            // Fallback DNA
            return {
                content: "Unknown Subject",
                style: "Photorealistic",
                lighting: "Cinematic",
                colors: ["#000000"],
                composition: "Balanced",
                mood: "Neutral",
                technical: "High Quality",
                generatedPrompt: "high quality, detailed, professional photography, cinematic lighting, 8k resolution, award winning style"
            };
        }
    }

    static generateClonePrompt(basePrompt: string, analysis: CloneAnalysisResult): string {
        return `Target Content: ${basePrompt}. \n\nMandatory Style Replication based on Analysis: \n- Style: ${analysis.style} \n- Lighting: ${analysis.lighting} \n- Mood: ${analysis.mood} \n- Technical: ${analysis.technical}. \n\n${analysis.generatedPrompt}`;
    }
}
