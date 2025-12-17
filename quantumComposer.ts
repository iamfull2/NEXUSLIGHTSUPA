/**
 * QUANTUM PROMPT COMPOSER (Layer 10)
 * Simulates Quantum Annealing to optimize prompt entropy and energy states.
 */

export interface QuantumOptimizationResult {
    optimizedPrompt: string;
    finalEnergy: number;
    iterations: number;
}

export class QuantumComposer {
    
    private static entropyTargets = { min: 4.5, max: 6.0 };

    static calculateEntropy(text: string): number {
        const words = text.toLowerCase().split(/\s+/);
        const freq: Record<string, number> = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);
        
        let entropy = 0;
        const total = words.length;
        Object.values(freq).forEach(count => {
            const p = count / total;
            entropy -= p * Math.log2(p);
        });
        return entropy;
    }

    static calculateEnergy(text: string): number {
        let energy = 100;
        const words = text.split(' ').length;
        
        // Length penalty
        if (words < 10) energy += (10 - words) * 2;
        if (words > 50) energy += (words - 50) * 0.5;

        // Technical density reward
        const technical = (text.match(/\b(8k|4k|HDR|volumetric|subsurface|caustic|f\/|mm)\b/gi) || []).length;
        energy -= technical * 5;

        // Entropy penalty
        const entropy = this.calculateEntropy(text);
        if (entropy < this.entropyTargets.min) energy += (this.entropyTargets.min - entropy) * 10;
        
        return Math.max(0, energy);
    }

    static perturb(prompt: string, temp: number): string {
        // Quantum Tunneling (Mutation based on temperature)
        if (Math.random() > temp) return prompt;

        const words = prompt.split(' ');
        const mutationType = Math.random();

        // 1. Swap words (Tunneling)
        if (mutationType < 0.33 && words.length > 3) {
            const idx1 = Math.floor(Math.random() * words.length);
            const idx2 = Math.floor(Math.random() * words.length);
            [words[idx1], words[idx2]] = [words[idx2], words[idx1]];
            return words.join(' ');
        }

        // 2. Injection (Superposition)
        if (mutationType < 0.66) {
            const modifiers = ['volumetric', 'hyper-detailed', '8k', 'cinematic', 'atmospheric', 'pristine', 'ethereal'];
            const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
            if (!words.includes(mod)) words.push(mod);
            return words.join(' ');
        }

        return prompt;
    }

    // Generator function to visualize annealing process step-by-step
    static async *anneal(basePrompt: string, iterations = 50) {
        let currentPrompt = basePrompt;
        let currentEnergy = this.calculateEnergy(currentPrompt);
        let bestPrompt = currentPrompt;
        let bestEnergy = currentEnergy;
        let temperature = 1.0;
        const coolingRate = 0.90;

        for (let i = 0; i < iterations; i++) {
            const candidatePrompt = this.perturb(currentPrompt, temperature);
            const candidateEnergy = this.calculateEnergy(candidatePrompt);

            // Acceptance probability
            if (candidateEnergy < currentEnergy || Math.random() < Math.exp((currentEnergy - candidateEnergy) / temperature)) {
                currentPrompt = candidatePrompt;
                currentEnergy = candidateEnergy;

                if (currentEnergy < bestEnergy) {
                    bestPrompt = currentPrompt;
                    bestEnergy = currentEnergy;
                }
            }

            temperature *= coolingRate;

            yield {
                iteration: i,
                temperature,
                currentEnergy,
                bestEnergy,
                currentPrompt
            };

            // Simulate computation delay
            await new Promise(r => setTimeout(r, 50));
        }

        return bestPrompt;
    }
}
