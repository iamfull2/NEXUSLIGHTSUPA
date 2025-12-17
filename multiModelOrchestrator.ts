
import { runNexusRequest } from "./geminiService";

/**
 * MULTI-MODEL ORCHESTRATOR
 * Simulates an ensemble of specialized AI models using Gemini personas
 */

export class MultiModelOrchestrator {

    static async orchestrate(basePrompt: string): Promise<string> {
        console.log("🎭 Orchestrating Multi-Model Ensemble...");
        
        try {
            // 1. Technical Specialist
            const technicalPromise = runNexusRequest(async (client) => client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: `Act as a Technical Render Engineer. Refine this image prompt by adding specific camera lenses, lighting setups, and render engine settings (Unreal/Octane). Keep it concise. Input: "${basePrompt}"` }] }
            }));

            // 2. Art Director
            const artisticPromise = runNexusRequest(async (client) => client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: `Act as a Creative Art Director. Enhance this image prompt by focusing on composition, color theory, mood, and atmosphere. Be poetic but visual. Input: "${basePrompt}"` }] }
            }));

            const [techRes, artRes] = await Promise.all([technicalPromise, artisticPromise]);
            
            const techPrompt = techRes.text || "";
            const artPrompt = artRes.text || "";

            // 3. The Synthesizer (Merges the two)
            const finalRes = await runNexusRequest(async (client) => client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: `Merge these two prompts into one supreme, coherent image generation prompt. Remove redundancies. \n\nTechnical Input: ${techPrompt}\n\nArtistic Input: ${artPrompt}\n\nFinal Output:` }] }
            }));

            return finalRes.text || basePrompt;
        } catch (e) {
            console.warn("Orchestration failed, using base prompt", e);
            return basePrompt;
        }
    }
}
