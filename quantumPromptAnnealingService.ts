import { runNexusRequest } from "./geminiService";
import { PromptState, AnnealingSchedule } from "./types";
import { QuantumComposer } from "./quantumComposer";

/**
 * QUANTUM PROMPT ANNEALING SERVICE (V37.5)
 * Implements the 5-phase optimization process:
 * 1. Superposition (Gemini Semantic Variations)
 * 2. Annealing (Local Physics Optimization)
 * 3. Context Injection
 * 4. Hyper-Realism
 * 5. Creative Studio
 */
export class QuantumPromptAnnealingService {

    // FASE 1: Superposition (Generate 5 distinct contexts)
    static async initializeSuperposition(userIntent: string): Promise<PromptState[]> {
        console.log("⚛️ QPA: Initializing Superposition...");
        
        try {
            // Fixed: runNexusRequest requires 3 arguments. Used gemini-3-flash-preview.
            const response = await runNexusRequest("generateContent", 'gemini-3-flash-preview', {
                contents: { parts: [{ text: `
                    You are a Quantum Prompt Engineer.
                    User Intent: "${userIntent}"
                    
                    Generate 5 distinct prompt variations for this intent with different contexts:
                    1. Cinematic
                    2. Mythological
                    3. Futuristic
                    4. Artistic
                    5. Technical
                    
                    Return ONLY a valid JSON array of strings (the prompts). No markdown blocks.
                ` }] },
                config: { responseMimeType: "application/json" }
            });
            
            const text = response.text || "[]";
            // Cleanup potentially messy JSON
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const prompts: string[] = JSON.parse(cleanText);
            
            return prompts.map(p => ({
                primary: p,
                // We use local energy function for speed in the initial state mapping
                energy: QuantumComposer.calculateEnergy(p), 
                temperature: 1.0
            }));
        } catch (e) {
            console.warn("Superposition failed, using single state", e);
            // Fallback to local perturbation if Gemini fails
            return [
                { primary: userIntent, energy: 50, temperature: 1.0 },
                { primary: QuantumComposer.perturb(userIntent, 0.5), energy: 60, temperature: 1.0 },
                { primary: QuantumComposer.perturb(userIntent, 0.8), energy: 70, temperature: 1.0 }
            ];
        }
    }

    // FASE 2: Annealing (Hybrid: Semantic Init + Local Physics Loop)
    // This generator yields state updates for visualization
    static async *annealPrompts(initialStates: PromptState[], schedule: AnnealingSchedule) {
        let currentStates = initialStates;
        let bestState = initialStates.reduce((prev, curr) => prev.energy < curr.energy ? prev : curr);
        let temperature = schedule.initialTemperature;

        for (let i = 0; i < schedule.iterations; i++) {
            temperature *= schedule.coolingRate;

            // Evolve states
            currentStates = currentStates.map(state => {
                // Perturb locally (swap/insert words)
                const mutatedPrompt = QuantumComposer.perturb(state.primary, temperature);
                // Calculate energy locally (entropy/technical density)
                const newEnergy = QuantumComposer.calculateEnergy(mutatedPrompt);
                
                // Metropolis-Hastings Acceptance
                const deltaE = newEnergy - state.energy;
                const acceptProb = deltaE < 0 ? 1.0 : Math.exp(-deltaE / temperature);

                const accept = Math.random() < acceptProb;
                
                return accept ? { ...state, primary: mutatedPrompt, energy: newEnergy, temperature } : { ...state, temperature };
            });

            // Find best in this generation
            const iterBest = currentStates.reduce((prev, curr) => prev.energy < curr.energy ? prev : curr);
            if (iterBest.energy < bestState.energy) {
                bestState = iterBest;
            }

            // Probability of Reannealing (heating up to escape local minima)
            if (Math.random() < schedule.reannealingProb) {
                temperature = Math.min(temperature * 1.5, 1.0);
            }

            yield {
                iteration: i,
                temperature,
                currentEnergy: iterBest.energy,
                bestEnergy: bestState.energy,
                currentPrompt: iterBest.primary,
                status: 'annealing' as const
            };
            
            // Simulation delay for visualization
            await new Promise(r => setTimeout(r, 20)); 
        }
        
        return bestState;
    }

    // FASE 3: Adaptive Context Injection
    static async injectAdaptiveContext(prompt: string): Promise<string> {
        // In a full implementation, this would read from neuralMemory
        // For now, we simulate context injection based on the prompt content
        const contextTags = [];
        if (prompt.toLowerCase().includes('cinematic')) contextTags.push('Context: Film Production');
        if (prompt.toLowerCase().includes('future')) contextTags.push('Trend: Cyberpunk 2077');
        
        return `${prompt} [ADAPTIVE CONTEXT: ${contextTags.join(', ') || 'General High Quality'}]`;
    }

    // FASE 4: Hyper-Realism Refinement
    static async applyHyperRealism(prompt: string): Promise<string> {
        return `[HYPER-REALISM LAYER] ${prompt} [SPECS: 8K, Octane Render, Ray Tracing, Subsurface Scattering, ACEScg Color Space, Micro-Details]`;
    }

    // FASE 5: Creative Studio (Optional Generation of variations)
    static async generateCreativeStudioVariations(prompt: string): Promise<any> {
        return {
            hero: `${prompt} --v 6.0 --style raw`,
            minimal: `Minimalist version: ${prompt} --style minimal`,
            bold: `High contrast version: ${prompt} --style expressive`
        };
    }
}