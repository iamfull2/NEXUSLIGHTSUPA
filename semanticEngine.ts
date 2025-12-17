import { SemanticAnalysis } from "./types";

/**
 * SEMANTIC UNDERSTANDING ENGINE (Client-Side)
 * Uses heuristic keyword matching to expand concepts
 */

const CONCEPT_GRAPH: any = {
    emotions: {
        'nostalgia': { keywords: ['vintage', 'retro', 'old', 'classic', 'memories'], elements: 'sepia tone, soft golden hour lighting, film grain, hazy atmosphere' },
        'anxiety': { keywords: ['tense', 'nervous', 'anxious', 'stressful', 'pressure', 'dark'], elements: 'harsh fluorescent lighting, high contrast, tight framing, desaturated cold colors' },
        'hope': { keywords: ['bright', 'future', 'optimistic', 'uplifting', 'inspiring', 'light'], elements: 'bright white and sky blue palette, sunrise rim lighting, open space, upward perspective' },
        'power': { keywords: ['strong', 'dominant', 'powerful', 'mighty', 'imposing', 'leader'], elements: 'dramatic low key lighting, metallic textures, monumental scale, deep black and gold' },
        'peace': { keywords: ['calm', 'serene', 'quiet', 'nature', 'relax'], elements: 'soft diffused light, harmonious pastel colors, slow composition, organic shapes' }
    },
    abstracts: {
        'innovation': { keywords: ['tech', 'new', 'idea', 'future'], visual: 'crystalline structures, geometric patterns, light refraction' },
        'speed': { keywords: ['fast', 'race', 'quick', 'motion'], visual: 'motion blur, streaking lights, dynamic angles' },
        'luxury': { keywords: ['rich', 'expensive', 'premium', 'gold'], visual: 'soft materials, metallic accents, minimal composition, marble textures' },
        'chaos': { keywords: ['mess', 'disorder', 'broken', 'wild'], visual: 'fractured geometry, overlapping elements, high entropy' }
    },
    cultural: {
        'brazilian': { keywords: ['brasil', 'brazil', 'rio', 'carnival', 'tropical'], visual: 'vibrant yellow and green, tropical vegetation, coastal atmosphere, organic curves' },
        'cyberpunk': { keywords: ['cyber', 'neon', 'tokyo', 'robot', 'future'], visual: 'electric blue and pink neon, wet streets, rain, high contrast, holographic signs' },
        'noir': { keywords: ['detective', 'rain', 'shadow', 'crime'], visual: 'black and white, high contrast, venetian blind shadows, smoke, wet pavement' }
    }
};

export class SemanticEngine {
    
    static analyze(concept: string): SemanticAnalysis {
        const lower = concept.toLowerCase();
        const emotions: string[] = [];
        const abstracts: string[] = [];
        let cultural: string | null = null;
        let enrichedParts: string[] = [concept];

        // Detect Emotions
        for (const [key, data] of Object.entries(CONCEPT_GRAPH.emotions)) {
            // @ts-ignore
            if (data.keywords.some(k => lower.includes(k))) {
                // @ts-ignore
                emotions.push(data.elements);
                // @ts-ignore
                enrichedParts.push(`evoking ${key} through ${data.elements}`);
            }
        }

        // Detect Abstracts
        for (const [key, data] of Object.entries(CONCEPT_GRAPH.abstracts)) {
            // @ts-ignore
            if (data.keywords.some(k => lower.includes(k))) {
                // @ts-ignore
                abstracts.push(data.visual);
                // @ts-ignore
                enrichedParts.push(`visualizing ${key} with ${data.visual}`);
            }
        }

        // Detect Cultural
        for (const [key, data] of Object.entries(CONCEPT_GRAPH.cultural)) {
            // @ts-ignore
            if (data.keywords.some(k => lower.includes(k))) {
                // @ts-ignore
                cultural = data.visual;
                // @ts-ignore
                enrichedParts.push(`${data.visual}`);
            }
        }

        return {
            emotions,
            abstracts,
            cultural,
            enrichedConcept: enrichedParts.join(', ')
        };
    }
}
