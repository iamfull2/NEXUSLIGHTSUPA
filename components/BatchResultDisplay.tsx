
import React from 'react';
import { BatchResultItem } from '../types';

interface BatchResultDisplayProps {
    results: BatchResultItem[];
}

const BatchResultDisplay: React.FC<BatchResultDisplayProps> = ({ results }) => {
    if (results.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {results.map((item) => (
                <div key={item.id} className="group relative bg-nexus-panel border border-nexus-border rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1 hover:shadow-nexus-accent/20">
                    <div className="aspect-video w-full bg-nexus-bg relative overflow-hidden">
                        {item.imageUrl ? (
                            <img 
                                src={item.imageUrl} 
                                alt={item.dimensionLabel} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-nexus-dim">
                                {item.status === 'error' ? 'Falhou' : 'Carregando...'}
                            </div>
                        )}
                        
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <button 
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = item.imageUrl;
                                    a.download = `NEXUS-${item.dimensionLabel.replace(/\s/g, '-')}-${Date.now()}.png`;
                                    a.click();
                                }}
                                className="bg-nexus-accent text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-white transition-colors"
                            >
                                ⬇ Salvar
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-3 border-t border-nexus-border bg-nexus-panel">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-nexus-text">{item.dimensionLabel}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.status === 'success' ? 'bg-nexus-success/10 text-nexus-success' : 'bg-red-500/10 text-red-500'}`}>
                                {item.aspectRatio}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-nexus-dim font-mono">
                                {item.status === 'success' ? 'PRONTO' : item.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BatchResultDisplay;
