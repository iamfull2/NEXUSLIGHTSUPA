import { StyleDNAProfile } from "./types";

/**
 * QUANTUM STYLE DNA ENGINE
 * Ported to TypeScript for Browser Execution
 */

export const GENE_POOL = {
  // GENES DE COR
  color: {
    neonCyberpunk: {
      palette: ['#00FFFF', '#FF00FF', '#FFFF00'],
      saturation: 0.95,
      vibrance: 0.9,
      dominance: 'cool'
    },
    pastelDreamy: {
      palette: ['#FFB6C1', '#E0BBE4', '#C5E3F6'],
      saturation: 0.4,
      vibrance: 0.5,
      dominance: 'warm'
    },
    darkIndustrial: {
      palette: ['#1A1A1A', '#4A4A4A', '#FF3333'],
      saturation: 0.3,
      vibrance: 0.6,
      dominance: 'cool'
    },
    goldenHour: {
      palette: ['#FFA500', '#FFD700', '#FF6347'],
      saturation: 0.7,
      vibrance: 0.8,
      dominance: 'warm'
    }
  },
  
  // GENES DE ILUMINAÇÃO
  lighting: {
    volumetricDramatic: {
      type: 'volumetric',
      intensity: 0.8,
      direction: 'rim',
      quality: 'cinematic'
    },
    softNatural: {
      type: 'diffused',
      intensity: 0.5,
      direction: 'ambient',
      quality: 'natural'
    },
    neonHard: {
      type: 'direct',
      intensity: 0.9,
      direction: 'multiple',
      quality: 'synthetic'
    }
  },
  
  // GENES DE COMPOSIÇÃO
  composition: {
    goldenSpiral: {
      rule: 'fibonacci',
      balance: 'asymmetric',
      flow: 'spiral',
      tension: 0.3
    },
    centered: {
      rule: 'symmetry',
      balance: 'symmetric',
      flow: 'radial',
      tension: 0.1
    },
    ruleOfThirds: {
      rule: 'thirds',
      balance: 'asymmetric',
      flow: 'linear',
      tension: 0.5
    }
  },
  
  // GENES DE TEXTURA
  texture: {
    hyperRealistic: {
      detail: 0.95,
      roughness: 0.6,
      imperfection: 0.7,
      subsurface: true
    },
    illustrated: {
      detail: 0.6,
      roughness: 0.3,
      imperfection: 0.2,
      subsurface: false
    },
    minimalist: {
      detail: 0.3,
      roughness: 0.1,
      imperfection: 0.1,
      subsurface: false
    }
  }
};

export const PRESET_DNA: Record<string, StyleDNAProfile> = {
  cyberpunkNoir: {
    color: 'neonCyberpunk',
    lighting: 'neonHard',
    composition: 'ruleOfThirds',
    texture: 'hyperRealistic'
  },
  dreamyFantasy: {
    color: 'pastelDreamy',
    lighting: 'softNatural',
    composition: 'goldenSpiral',
    texture: 'illustrated'
  },
  industrialBrutalist: {
    color: 'darkIndustrial',
    lighting: 'volumetricDramatic',
    composition: 'centered',
    texture: 'hyperRealistic'
  }
};

export class StyleDNAEngine {
    
    static crossover(dna1Name: string, dna2Name: string, ratio = 0.5): StyleDNAProfile {
        const dna1 = PRESET_DNA[dna1Name];
        const dna2 = PRESET_DNA[dna2Name];

        if (!dna1 || !dna2) throw new Error("DNA Preset not found");

        return {
            color: Math.random() < ratio ? dna1.color : dna2.color,
            lighting: Math.random() < ratio ? dna1.lighting : dna2.lighting,
            composition: Math.random() < ratio ? dna1.composition : dna2.composition,
            texture: Math.random() < ratio ? dna1.texture : dna2.texture,
            parents: [dna1Name, dna2Name],
            generation: 1
        };
    }

    static mutate(dna: StyleDNAProfile, mutationRate = 0.1): StyleDNAProfile {
        const mutated = { ...dna };
        const genes: (keyof typeof GENE_POOL)[] = ['color', 'lighting', 'composition', 'texture'];

        genes.forEach(gene => {
            if (Math.random() < mutationRate) {
                const options = Object.keys(GENE_POOL[gene]);
                // @ts-ignore
                mutated[gene] = options[Math.floor(Math.random() * options.length)];
                mutated.mutated = true;
            }
        });

        mutated.generation = (dna.generation || 0) + 1;
        return mutated;
    }

    static dnaToPrompt(dna: StyleDNAProfile, baseConcept: string): string {
        // @ts-ignore
        const colorGenes = GENE_POOL.color[dna.color];
        // @ts-ignore
        const lightGenes = GENE_POOL.lighting[dna.lighting];
        // @ts-ignore
        const compGenes = GENE_POOL.composition[dna.composition];
        // @ts-ignore
        const textureGenes = GENE_POOL.texture[dna.texture];

        if (!colorGenes || !lightGenes) return baseConcept; // Fallback

        const promptParts = [
            baseConcept,
            `${colorGenes.dominance} color palette with ${colorGenes.saturation > 0.7 ? 'high' : 'subtle'} saturation`,
            `${lightGenes.type} ${lightGenes.quality} lighting from ${lightGenes.direction} direction`,
            `${compGenes.rule} composition with ${compGenes.balance} balance`,
            `${textureGenes.detail > 0.7 ? 'hyper-detailed' : 'minimalist'} texture ${textureGenes.subsurface ? 'with subsurface scattering' : ''}`
        ];

        return promptParts.filter(p => p).join(', ');
    }
}
