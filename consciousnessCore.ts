import { AdaptiveContextAwareness } from "./adaptiveContext";
import { MultiObjectiveOptimizer } from "./multiObjectiveOptimizer";
import { CollaborativeRefinement } from "./collaborativeRefinement";
import { ConsciousnessState, CheckpointData } from "./types";

/**
 * CONSCIOUSNESS CORE (V37)
 * The orchestrator that integrates Context, Optimization, and Collaboration.
 */

export class ConsciousnessCore {
    private startTime: number;
    private state: ConsciousnessState;
    private stateListener: (s: ConsciousnessState) => void;

    constructor(listener: (s: ConsciousnessState) => void) {
        this.startTime = Date.now();
        this.stateListener = listener;
        this.state = {
            isActive: true,
            context: null,
            currentObjectives: null,
            activeCheckpoint: null,
            logs: []
        };
    }

    private log(msg: string) {
        this.state.logs = [msg, ...this.state.logs].slice(0, 10);
        this.update();
    }

    private update() {
        this.stateListener({ ...this.state });
    }

    async process(userInput: string, sessionDuration: number): Promise<any> {
        this.log("🧠 Consciousness Awakened...");
        
        // 1. Adaptive Context
        const context = AdaptiveContextAwareness.analyze(userInput, sessionDuration);
        this.state.context = context;
        this.log(`Analyzed Context: ${context.behavioral.urgency} urgency`);
        this.update();

        // 2. Multi-Objective Optimization
        const objectives = MultiObjectiveOptimizer.optimize(userInput, context);
        this.state.currentObjectives = objectives;
        const topObjective = Object.entries(objectives).reduce((a, b) => a[1].weight > b[1].weight ? a : b)[0];
        this.log(`Optimizing for: ${topObjective.toUpperCase()}`);
        this.update();

        // 3. Collaborative Refinement (Yielding checkpoints)
        // If urgency is high, skip checkpoints
        if (context.behavioral.urgency !== 'high') {
            await this.runCheckpoint(
                await CollaborativeRefinement.generateIntentProposal(userInput)
            );
            await this.runCheckpoint(
                await CollaborativeRefinement.generateCompositionPreview(userInput)
            );
        } else {
            this.log("⚡ High urgency detected. Skipping checkpoints.");
        }

        // 4. Final Module Selection
        const modules = MultiObjectiveOptimizer.getModulesForObjectives(objectives);
        this.log(`Selected Modules: ${modules.length} active`);

        return {
            context,
            objectives,
            modules
        };
    }

    private async runCheckpoint(data: CheckpointData): Promise<string> {
        return new Promise((resolve) => {
            this.log(`🛑 Checkpoint Required: ${data.type}`);
            this.state.activeCheckpoint = data;
            this.update();

            // Store the resolve function to be called externally by the UI
            // This is a simplified event emitter pattern for the demo
            (window as any).__nexusCheckpointResolver = (action: string) => {
                this.log(`User Action: ${action}`);
                this.state.activeCheckpoint = null;
                this.update();
                resolve(action);
            };
        });
    }

    resolveCheckpoint(action: string) {
        if ((window as any).__nexusCheckpointResolver) {
            (window as any).__nexusCheckpointResolver(action);
        }
    }
}
