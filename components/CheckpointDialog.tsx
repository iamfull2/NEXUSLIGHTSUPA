
import React from 'react';
import { CheckpointData } from '../types';

interface CheckpointDialogProps {
    data: CheckpointData;
    onResolve: (action: string) => void;
}

const CheckpointDialog: React.FC<CheckpointDialogProps> = ({ data, onResolve }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-nexus-panel border border-nexus-accent rounded-2xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(0,240,255,0.2)] animate-in slide-in-from-bottom-8">
                
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-[10px] font-mono text-nexus-accent uppercase tracking-widest mb-1">Refinamento Colaborativo</div>
                        <h3 className="text-xl font-bold text-white">{data.title}</h3>
                    </div>
                    <div className="text-2xl animate-pulse">🛑</div>
                </div>

                <div className="bg-nexus-bg/50 p-4 rounded-lg border border-nexus-border mb-6">
                    <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-300">
                        {Object.entries(data.proposal).map(([k, v]) => (
                            <React.Fragment key={k}>
                                <span className="text-nexus-dim font-mono capitalize">{k}:</span>
                                <span className="text-right font-medium text-white">{String(v)}</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    {data.options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onResolve(opt.value)}
                            className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                                opt.value === 'approve' 
                                ? 'bg-nexus-accent text-black hover:bg-white hover:shadow-glow' 
                                : 'bg-nexus-bg border border-nexus-border text-gray-400 hover:border-nexus-dim hover:text-white'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                
                <div className="mt-4 text-center">
                    <span className="text-[10px] text-nexus-dim">Aprovando automaticamente em 20s...</span>
                </div>
            </div>
        </div>
    );
};

export default CheckpointDialog;
