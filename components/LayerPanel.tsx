
import React from 'react';
import { CanvasLayer } from '../types';

interface LayerPanelProps {
    layers: CanvasLayer[];
    selectedIds: string[];
    onSelect: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onDelete: (id: string) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ 
    layers, 
    selectedIds, 
    onSelect, 
    onToggleVisibility, 
    onToggleLock,
    onDelete
}) => {
    // Reverse layers for display (Top layer first)
    const displayLayers = [...layers].reverse();

    return (
        <div className="flex flex-col h-full bg-nexus-panel border-r border-nexus-border">
            <div className="p-4 border-b border-nexus-border flex justify-between items-center">
                <h3 className="text-xs font-bold text-nexus-dim uppercase tracking-widest">CAMADAS</h3>
                <span className="text-[10px] bg-nexus-surface text-nexus-dim px-2 py-0.5 rounded-full">{layers.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                {displayLayers.length === 0 && (
                    <div className="text-center mt-10 text-nexus-dim text-xs italic">
                        Canvas Vazio
                    </div>
                )}
                {displayLayers.map(layer => {
                    const isSelected = selectedIds.includes(layer.id);
                    return (
                        <div 
                            key={layer.id}
                            onClick={() => onSelect(layer.id)}
                            className={`
                                group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border
                                ${isSelected 
                                    ? 'bg-nexus-accent/10 border-nexus-accent/50 shadow-[0_0_10px_rgba(0,240,255,0.1)]' 
                                    : 'bg-transparent border-transparent hover:bg-white/5'}
                            `}
                        >
                            {/* Visibility Toggle */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                                className={`text-xs ${layer.visible ? 'text-nexus-dim hover:text-nexus-text' : 'text-gray-600'}`}
                            >
                                {layer.visible ? '👁️' : '----'}
                            </button>

                            {/* Icon */}
                            <div className="text-lg text-nexus-text">
                                {layer.type === 'ai-generated' && '✨'}
                                {layer.type === 'image' && '🖼️'}
                                {layer.type === 'text' && 'T'}
                                {layer.type === 'rect' && '⬜'}
                                {layer.type === 'circle' && '⭕'}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <div className={`text-xs font-medium truncate ${isSelected ? 'text-nexus-text' : 'text-nexus-dim group-hover:text-nexus-text'}`}>
                                    {layer.name}
                                </div>
                                {layer.aiGenerated && (
                                    <div className="text-[9px] text-nexus-accent opacity-70 truncate">
                                        Gerado por IA
                                    </div>
                                )}
                            </div>

                            {/* Lock Toggle */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                                className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${layer.locked ? 'opacity-100 text-red-400' : 'text-nexus-dim hover:text-nexus-text'}`}
                            >
                                {layer.locked ? '🔒' : '🔓'}
                            </button>
                            
                            {/* Delete (Hover only) */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}
                                className="text-xs opacity-0 group-hover:opacity-100 transition-opacity text-nexus-dim hover:text-red-500"
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LayerPanel;
