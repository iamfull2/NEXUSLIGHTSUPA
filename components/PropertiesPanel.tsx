
import React from 'react';
import { CanvasLayer } from '../types';
import { useImageGeneration } from '../hooks/useImageGeneration';

interface PropertiesPanelProps {
    selectedLayers: CanvasLayer[];
    onChange: (key: string, value: any) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedLayers, onChange }) => {
    const { removeBackground, loading } = useImageGeneration();

    if (selectedLayers.length === 0) {
        return (
            <div className="h-full bg-nexus-panel border-l border-nexus-border p-6 flex flex-col items-center justify-center text-center">
                <div className="text-4xl opacity-20 mb-4 animate-pulse">⚡</div>
                <p className="text-xs text-nexus-dim uppercase tracking-widest">Nenhuma Seleção</p>
                <p className="text-[10px] text-nexus-dim mt-2">Selecione uma camada para acessar suas propriedades quânticas.</p>
            </div>
        );
    }

    const layer = selectedLayers[0]; // Multi-edit simplified to single for V2

    const handleRemoveBg = async () => {
        if (layer.type !== 'image' || !layer.src) return;
        try {
            const newSrc = await removeBackground(layer.src);
            onChange('src', newSrc);
        } catch (e) {
            console.error("BG Removal Failed", e);
        }
    };

    return (
        <div className="h-full bg-nexus-panel border-l border-nexus-border flex flex-col">
            <div className="p-4 border-b border-nexus-border">
                <h3 className="text-xs font-bold text-nexus-accent uppercase tracking-widest mb-1">PROPRIEDADES</h3>
                <div className="text-[10px] text-nexus-dim truncate">{layer.name}</div>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
                {/* Transform */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-mono text-nexus-dim uppercase">Transformação</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-nexus-surface rounded p-2 flex justify-between items-center">
                            <span className="text-xs text-nexus-dim">X</span>
                            <span className="text-xs text-nexus-text font-mono">{Math.round(layer.left || 0)}</span>
                        </div>
                        <div className="bg-nexus-surface rounded p-2 flex justify-between items-center">
                            <span className="text-xs text-nexus-dim">Y</span>
                            <span className="text-xs text-nexus-text font-mono">{Math.round(layer.top || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-mono text-nexus-dim uppercase">Aparência</h4>
                    <div>
                        <div className="flex justify-between mb-1 text-[10px] text-nexus-dim">
                            <span>Opacidade</span>
                            <span>{Math.round((layer.opacity || 1) * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="1" step="0.01"
                            value={layer.opacity || 1}
                            onChange={(e) => onChange('opacity', parseFloat(e.target.value))}
                            className="w-full accent-nexus-accent h-1 bg-nexus-surface rounded-full appearance-none"
                        />
                    </div>
                    
                    {/* Fill Color (if applicable) */}
                    {(layer.type === 'rect' || layer.type === 'circle' || layer.type === 'text') && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-nexus-dim">Preenchimento</span>
                            <div className="flex items-center gap-2 bg-nexus-surface p-1 rounded border border-nexus-border-light">
                                <input 
                                    type="color" 
                                    value={layer.fill || '#000000'}
                                    onChange={(e) => onChange('fill', e.target.value)}
                                    className="w-4 h-4 bg-transparent border-none cursor-pointer"
                                />
                                <span className="text-[10px] font-mono text-nexus-text w-12">{layer.fill}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Image Actions */}
                {layer.type === 'image' && layer.src && (
                    <div className="space-y-3 pt-4 border-t border-nexus-border/30">
                        <h4 className="text-[10px] font-mono text-nexus-dim uppercase">IA Tools</h4>
                        <button 
                            onClick={handleRemoveBg}
                            disabled={loading}
                            className="w-full py-2 bg-nexus-bg border border-nexus-border text-white hover:border-nexus-accent rounded text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="animate-pulse">Processando...</span>
                            ) : (
                                <>
                                    <span>✂️</span> Remover Fundo
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* AI Metadata (If Generated) */}
                {layer.aiGenerated && (
                    <div className="bg-nexus-accent/5 border border-nexus-accent/20 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">✨</span>
                            <span className="text-[10px] font-bold text-nexus-accent">GERADO POR IA</span>
                        </div>
                        {layer.prompt && (
                            <div className="text-[10px] text-nexus-dim font-mono italic leading-relaxed border-l-2 border-nexus-accent pl-2">
                                "{layer.prompt.substring(0, 80)}..."
                            </div>
                        )}
                        <button 
                            onClick={() => alert("Re-gerando...")}
                            className="w-full py-2 bg-nexus-accent/10 hover:bg-nexus-accent/20 text-nexus-accent text-[10px] font-bold rounded transition-colors"
                        >
                            VARIAÇÃO
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertiesPanel;
