
import React, { useState } from 'react';
import { QuantumState } from '../types';

interface QuantumLabProps {
    state: QuantumState;
    standalone?: boolean;
    onRun?: (prompt: string) => void;
}

const QuantumLab: React.FC<QuantumLabProps> = ({ state, standalone, onRun }) => {
    const [localPrompt, setLocalPrompt] = useState('A futuristic city with neon lights and flying cars, 8k render');

    if (state.status === 'idle' && !standalone) return null;

    return (
        <div className={`bg-nexus-panel border border-nexus-accent/30 rounded-xl p-6 mt-6 animate-in slide-in-from-bottom-4 shadow-2xl shadow-nexus-accent/10 relative overflow-hidden ${standalone ? 'min-h-[400px]' : ''}`}>
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-nexus-accent/20 blur-[50px] rounded-full animate-pulse"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <span className={`text-2xl ${state.status === 'annealing' ? 'animate-spin-slow' : ''}`}>⚛️</span>
                    <div>
                        <h3 className="text-nexus-accent font-bold font-mono tracking-widest text-sm">CAMADA 10: RECOZIMENTO QUÂNTICO</h3>
                        <p className="text-[10px] text-nexus-dim">
                            {state.status === 'annealing' ? 'Minimizando Estado de Energia do Prompt...' : 'Sistema Pronto'}
                        </p>
                    </div>
                </div>
                <div className="text-right font-mono">
                    <div className="text-xs text-nexus-dim">TEMPERATURA</div>
                    <div className="text-nexus-secondary font-bold">{state.temperature.toFixed(4)} K</div>
                </div>
            </div>

            {standalone && (
                <div className="mb-8 relative z-10">
                    <label className="text-xs font-mono text-nexus-dim mb-2 block uppercase">Prompt de Injeção</label>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={localPrompt}
                            onChange={(e) => setLocalPrompt(e.target.value)}
                            className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-4 py-3 text-sm text-nexus-text focus:border-nexus-accent outline-none font-mono placeholder:text-nexus-dim/50"
                            placeholder="Insira conceito base..."
                            disabled={state.status === 'annealing'}
                        />
                        <button 
                            onClick={() => onRun && onRun(localPrompt)}
                            disabled={state.status === 'annealing'}
                            className="bg-nexus-accent hover:bg-white text-black font-bold px-6 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs tracking-wider uppercase"
                        >
                            {state.status === 'annealing' ? 'Processando...' : 'Inicializar'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div className="bg-nexus-bg/50 p-4 rounded-lg border border-nexus-border">
                    <div className="text-[10px] text-nexus-dim font-mono mb-1">ENERGIA ATUAL</div>
                    <div className="text-xl font-bold text-nexus-text transition-all duration-100" style={{ color: `hsl(${120 - state.currentEnergy}, 100%, 50%)` }}>
                        {state.currentEnergy.toFixed(1)} eV
                    </div>
                    <div className="w-full h-1 bg-nexus-surface mt-2 rounded-full overflow-hidden">
                        <div className="h-full bg-current transition-all duration-100" style={{ width: `${Math.min(100, state.currentEnergy)}%` }}></div>
                    </div>
                </div>
                <div className="bg-nexus-bg/50 p-4 rounded-lg border border-nexus-border">
                    <div className="text-[10px] text-nexus-dim font-mono mb-1">ENTROPIA OTIMIZADA</div>
                    <div className="text-xl font-bold text-nexus-success">
                        {state.bestEnergy.toFixed(1)} eV
                    </div>
                     <div className="w-full h-1 bg-nexus-surface mt-2 rounded-full overflow-hidden">
                        <div className="h-full bg-nexus-success transition-all duration-100" style={{ width: `${Math.min(100, state.bestEnergy)}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between text-xs text-nexus-dim mb-2 font-mono">
                    <span>ESTADO ATUAL DE SUPERPOSIÇÃO</span>
                    <span>ITERAÇÃO {state.iteration}</span>
                </div>
                <div className="p-4 bg-nexus-surface rounded-lg border border-nexus-border font-mono text-xs text-nexus-accent break-words h-32 overflow-y-auto relative border-l-2 border-l-nexus-accent shadow-inner">
                    {state.currentPrompt || "Aguardando entrada..."}
                </div>
            </div>
        </div>
    );
};

export default QuantumLab;
