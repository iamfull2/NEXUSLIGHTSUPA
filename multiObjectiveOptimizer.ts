import { OptimizationObjectives, ContextDimensions } from "./types";

/**
 * MULTI-OBJECTIVE OPTIMIZER (V37)
 * Balances conflicting goals based on detected context.
 */

export class MultiObjectiveOptimizer {

    static initializeObjectives(): OptimizationObjectives {
        return {
            engagement: { weight: 0.5, target: 'maximize' },
            brandSafety: { weight: 0.5, target: 'maximize' },
            productionSpeed: { weight: 0.5, target: 'maximize' },
            uniqueness: { weight: 0.5, target: 'maximize' },
            aestheticQuality: { weight: 0.5, target: 'maximize' }
        };
    }

    static optimize(intentText: string, context: ContextDimensions): OptimizationObjectives {
        const objs = this.initializeObjectives();
        const text = intentText.toLowerCase();

        // 1. Contextual Adjustments
        if (context.behavioral.urgency === 'high') {
            objs.productionSpeed.weight = 0.9;
            objs.aestheticQuality.weight = 0.4; // Trade-off
        }

        if (context.behavioral.experimentMode) {
            objs.uniqueness.weight = 0.9;
            objs.brandSafety.weight = 0.3; // Allow risk
        }

        if (context.temporal.timeOfDay === 'late_night') {
            objs.uniqueness.weight += 0.2; // Creative hours
        }

        // 2. Intent Analysis
        if (text.includes('viral') || text.includes('social')) {
            objs.engagement.weight = 1.0;
            objs.brandSafety.weight = 0.4;
        }

        if (text.includes('corporate') || text.includes('business')) {
            objs.brandSafety.weight = 1.0;
            objs.uniqueness.weight = 0.3;
        }

        if (text.includes('masterpiece') || text.includes('award')) {
            objs.aestheticQuality.weight = 1.0;
            objs.productionSpeed.weight = 0.1;
        }

        return objs;
    }

    static getModulesForObjectives(objs: OptimizationObjectives): string[] {
        const modules: string[] = [];

        if (objs.aestheticQuality.weight > 0.8) modules.push('RENDER_OCTANE_CAUSTICS', 'COMP_GOLDEN_SPIRAL');
        else modules.push('RENDER_UNREAL_LUMEN');

        if (objs.engagement.weight > 0.8) modules.push('MOOD_DOPAMINE_FLOOD', 'LIGHT_RIM_VOLUMETRIC');
        else if (objs.brandSafety.weight > 0.8) modules.push('MOOD_SEROTONIN_FLOW', 'LIGHT_STANDARD');
        else modules.push('MOOD_BALANCED');

        if (objs.uniqueness.weight > 0.8) modules.push('STYLE_AVANT_GARDE');
        
        return modules;
    }
}
