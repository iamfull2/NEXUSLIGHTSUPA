
import React, { useState } from 'react';
import { StyleDNAEngine, PRESET_DNA } from '../styleDNA';
import { StyleDNAProfile } from '../types';

interface EvolutionDashboardProps {
    onEvolveComplete: (dna: StyleDNAProfile, prompt: string) => void;
    isProcessing?: boolean;
}

const EvolutionDashboard: React.FC<EvolutionDashboardProps> = ({ onEvolveComplete, isProcessing = false }) => {
    const [parent1, setParent1] = useState<string>('cyberpunkNoir');
    const [parent2, setParent2] = useState<string>('dreamyFantasy');
    const [offspring, setOffspring] = useState<StyleDNAProfile | null>(null);
    const [concept, setConcept] = useState('A futuristic vehicle');

    const handleEvolve = () => {
        // 1. Crossover
        let child = StyleDNAEngine.crossover(parent1, parent2, 0.5);
        // 2. Mutate (20% chance)
        child = StyleDNAEngine.mutate(child, 0.2);
        
        setOffspring(child);
        const prompt = StyleDNAEngine.dnaToPrompt(child, concept);
        onEvolveComplete(child, prompt);
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border border-nexus-border animate-in fade-in">
             <div className="flex items-center gap-2 mb-6 border-b border-nexus-border pb-4">
                <span className="text-2xl animate-pulse">🧬</span>
                <div>
                    <h3 className="text-nexus-accent font-mono text-sm tracking-widest font-bold">DNA DE ESTILO QUÂNTICO</h3>
                    <p className="text-nexus-dim text-xs">Camada 5: Evolução Genética de Estilo</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-8">
                {/* Parent 1 */}
                <div className="w-full">
                    <label className="text-xs font-mono text-nexus-dim block mb-2">PARENTE A (CROMOSSOMO X)</label>
                    <select 
                        value={parent1} 
                        onChange={e => setParent1(e.target.value)}
                        className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-sm"
                        disabled={isProcessing}
                    >
                        {Object.keys(PRESET_DNA).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>

                <div className="text-2xl text-nexus-secondary">✖</div>

                {/* Parent 2 */}
                <div className="w-full">
                    <label className="text-xs font-mono text-nexus-dim block mb-2">PARENTE B (CROMOSSOMO Y)</label>
                    <select 
                        value={parent2} 
                        onChange={e => setParent2(e.target.value)}
                        className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-sm"
                        disabled={isProcessing}
                    >
                        {Object.keys(PRESET_DNA).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
            </div>

            <div className="mb-6">
                <label className="text-xs font-mono text-nexus-dim block mb-2">CONCEITO BASE</label>
                <input 
                    type="text" 
                    value={concept}
                    onChange={e => setConcept(e.target.value)}
                    className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-gray-200 focus:border-nexus-accent outline-none"
                    disabled={isProcessing}
                />
            </div>

            <button 
                onClick={handleEvolve}
                disabled={isProcessing}
                className="w-full py-4 bg-gradient-to-r from-nexus-secondary to-nexus-accent text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(112,0,255,0.4)] transition-all uppercase tracking-widest flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>SEQUÊNCIA EM EVOLUÇÃO...</span>
                    </>
                ) : (
                    <>
                        <span>🧬</span> INICIAR SEQUÊNCIA DE EVOLUÇÃO
                    </>
                )}
            </button>

            {offspring && (
                <div className="mt-8 p-4 bg-nexus-bg/50 rounded-xl border border-nexus-accent/30">
                    <h4 className="text-nexus-success text-xs font-bold mb-2 font-mono">EVOLUÇÃO BEM-SUCEDIDA (GEN {offspring.generation})</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-400 mb-4">
                        <div>Cor: <span className="text-white">{offspring.color}</span></div>
                        <div>Luz: <span className="text-white">{offspring.lighting}</span></div>
                        <div>Comp: <span className="text-white">{offspring.composition}</span></div>
                        <div>Tex: <span className="text-white">{offspring.texture}</span></div>
                    </div>
                    <div className="text-[10px] text-nexus-dim font-mono break-words">
                        {StyleDNAEngine.dnaToPrompt(offspring, concept)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EvolutionDashboard;
