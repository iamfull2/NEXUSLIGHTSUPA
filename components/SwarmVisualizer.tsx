
import React from 'react';
import { NexusAgent } from '../types';

interface SwarmVisualizerProps {
    agents: NexusAgent[];
    progress: number;
}

const SwarmVisualizer: React.FC<SwarmVisualizerProps> = ({ agents, progress }) => {
    return (
        <div className="w-full bg-nexus-panel border border-nexus-border rounded-xl p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-nexus-accent animate-pulse-fast"></div>
                    <h3 className="font-mono font-bold text-nexus-accent tracking-widest text-sm">INTELIGÊNCIA DE ENXAME</h3>
                </div>
                <span className="font-mono text-nexus-success font-bold">{progress}%</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center gap-3 p-2 rounded bg-nexus-bg/50 border border-nexus-border/30 transition-all duration-300">
                        <div className={`w-2 h-2 rounded-full ${agent.status === 'COMPLETE' ? 'bg-nexus-success' : agent.status === 'ACTIVE' ? 'bg-nexus-accent animate-ping' : 'bg-nexus-dim'}`}></div>
                        <div className="flex-1 flex justify-between items-baseline">
                            <span className={`font-mono text-xs ${agent.status === 'IDLE' ? 'text-nexus-dim' : 'text-nexus-text'}`}>{agent.name}</span>
                            <span className="font-mono text-[10px] text-nexus-accent opacity-70">{agent.role}</span>
                        </div>
                        {agent.status === 'COMPLETE' && <span className="text-nexus-success text-xs">✓</span>}
                    </div>
                ))}
            </div>
            
            <div className="mt-4 h-1 w-full bg-nexus-bg rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-nexus-accent to-nexus-secondary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

export default SwarmVisualizer;
