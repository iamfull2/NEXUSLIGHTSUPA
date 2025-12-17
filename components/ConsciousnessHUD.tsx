
import React from 'react';
import { ConsciousnessState, Objective } from '../types';

interface ConsciousnessHUDProps {
    state: ConsciousnessState;
}

const ConsciousnessHUD: React.FC<ConsciousnessHUDProps> = ({ state }) => {
    if (!state.isActive || !state.context) return null;

    const { context, currentObjectives, logs } = state;

    return (
        <div className="bg-nexus-panel border border-nexus-secondary/30 rounded-xl p-4 mt-6 animate-in slide-in-from-top-4 relative overflow-hidden shadow-2xl shadow-nexus-secondary/10">
            {/* Brain Pulse Animation */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-secondary/10 blur-[60px] rounded-full animate-pulse pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-4 border-b border-nexus-border pb-2 relative z-10">
                <span className="text-2xl animate-pulse">🧠</span>
                <div>
                    <h3 className="text-nexus-text font-bold font-mono tracking-widest text-xs">NÚCLEO DE CONSCIÊNCIA V37</h3>
                    <p className="text-[10px] text-nexus-dim">Estado da Singularidade: ATIVO</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                
                {/* Context Column */}
                <div className="bg-nexus-bg/50 p-3 rounded border border-nexus-border">
                    <h4 className="text-[10px] font-mono text-nexus-dim uppercase mb-2">Consciência de Contexto</h4>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Modo</span>
                            <span className="text-nexus-accent">{context.temporal.timeOfDay}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Urgência</span>
                            <span className={`font-bold ${context.behavioral.urgency === 'high' ? 'text-red-400' : 'text-nexus-success'}`}>
                                {context.behavioral.urgency.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Experimento</span>
                            <span className="text-gray-200">{context.behavioral.experimentMode ? 'LIGADO' : 'DESLIGADO'}</span>
                        </div>
                    </div>
                </div>

                {/* Objectives Column */}
                <div className="bg-nexus-bg/50 p-3 rounded border border-nexus-border">
                    <h4 className="text-[10px] font-mono text-nexus-dim uppercase mb-2">Objetivos Ativos (Pareto)</h4>
                    {currentObjectives && Object.entries(currentObjectives).map(([key, obj]) => {
                        const objective = obj as Objective;
                        return objective.weight > 0.6 && (
                            <div key={key} className="mb-2">
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <span className="text-nexus-secondary">{(objective.weight * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-1 w-full bg-nexus-panel rounded-full overflow-hidden">
                                    <div className="h-full bg-nexus-secondary" style={{ width: `${objective.weight * 100}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Thought Log */}
                <div className="bg-nexus-bg/50 p-3 rounded border border-nexus-border flex flex-col">
                    <h4 className="text-[10px] font-mono text-nexus-dim uppercase mb-2">Fluxo Neural</h4>
                    <div className="flex-1 overflow-y-auto max-h-[80px] scrollbar-hide space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="text-[10px] font-mono text-gray-400 border-l-2 border-nexus-dim pl-2">
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsciousnessHUD;
