
import React, { useState, useEffect } from 'react';
import { GENE_POOL, StyleDNAEngine } from '../styleDNA';
import { StyleDNAProfile } from '../types';

interface StyleDNABuilderProps {
    onApply: (promptSuffix: string) => void;
}

const StyleDNABuilder: React.FC<StyleDNABuilderProps> = ({ onApply }) => {
    const [dna, setDna] = useState<StyleDNAProfile>({
        color: 'neonCyberpunk',
        lighting: 'volumetricDramatic',
        composition: 'ruleOfThirds',
        texture: 'hyperRealistic',
        generation: 0
    });
    const [presetName, setPresetName] = useState('');
    const [savedPresets, setSavedPresets] = useState<(StyleDNAProfile & { name: string })[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('nexus_style_presets');
        if (saved) {
            try {
                setSavedPresets(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load presets", e);
            }
        }
    }, []);

    const handleSavePreset = () => {
        if (!presetName.trim()) return alert("Por favor insira um nome para o preset");
        const newPreset = { ...dna, name: presetName };
        const updated = [...savedPresets, newPreset];
        setSavedPresets(updated);
        localStorage.setItem('nexus_style_presets', JSON.stringify(updated));
        setPresetName('');
    };

    const handleDeletePreset = (index: number) => {
        const updated = savedPresets.filter((_, i) => i !== index);
        setSavedPresets(updated);
        localStorage.setItem('nexus_style_presets', JSON.stringify(updated));
    };

    const loadPreset = (preset: StyleDNAProfile) => {
        setDna({
            color: preset.color,
            lighting: preset.lighting,
            composition: preset.composition,
            texture: preset.texture,
            generation: 0
        });
    };

    const generatedPrompt = StyleDNAEngine.dnaToPrompt(dna, "").replace(/^, /, "");

    const categories = [
        { key: 'color', label: 'Paleta de Cores', icon: '🎨' },
        { key: 'lighting', label: 'Modelo de Iluminação', icon: '💡' },
        { key: 'composition', label: 'Composição', icon: '📐' },
        { key: 'texture', label: 'Textura / Render', icon: '👁️' }
    ];

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Builder Column */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-nexus-panel border border-nexus-border rounded-2xl p-6 shadow-2xl shadow-nexus-accent/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {categories.map((cat) => (
                                <div key={cat.key} className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-mono font-bold text-nexus-dim uppercase tracking-widest">
                                        <span>{cat.icon}</span> {cat.label}
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {/* @ts-ignore */}
                                        {Object.keys(GENE_POOL[cat.key]).map((optionKey) => {
                                            // @ts-ignore
                                            const isSelected = dna[cat.key] === optionKey;
                                            return (
                                                <button
                                                    key={optionKey}
                                                    // @ts-ignore
                                                    onClick={() => setDna({ ...dna, [cat.key]: optionKey })}
                                                    className={`
                                                        text-left px-4 py-3 rounded-lg border text-xs font-mono transition-all flex justify-between items-center group
                                                        ${isSelected 
                                                            ? 'bg-nexus-accent/10 border-nexus-accent text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                                                            : 'bg-nexus-bg border-nexus-border text-nexus-dim hover:border-nexus-dim hover:text-gray-300'
                                                        }
                                                    `}
                                                >
                                                    <span className="capitalize">{optionKey.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    {isSelected && <span className="text-nexus-accent">●</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview & Action */}
                    <div className="bg-nexus-panel border border-nexus-border rounded-2xl p-6">
                        <label className="block text-xs font-mono text-nexus-dim uppercase mb-2">Prévia da Assinatura de DNA</label>
                        <div className="bg-nexus-bg p-4 rounded-xl border border-nexus-border text-sm text-nexus-text font-mono leading-relaxed mb-6">
                            {generatedPrompt || "Selecione parâmetros para gerar DNA..."}
                        </div>
                        <button 
                            onClick={() => onApply(generatedPrompt)}
                            className="w-full py-4 bg-gradient-to-r from-nexus-secondary to-nexus-accent text-white font-bold rounded-xl hover:shadow-lg transition-all uppercase tracking-widest flex justify-center items-center gap-2"
                        >
                            <span>🚀</span> Inicializar Gerador com este DNA
                        </button>
                    </div>
                </div>

                {/* Presets Column */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-nexus-panel border border-nexus-border rounded-2xl p-6 h-full flex flex-col">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span>💾</span> Genótipos Salvos
                        </h3>
                        
                        <div className="flex gap-2 mb-6">
                            <input 
                                type="text" 
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                placeholder="Nome do Preset..."
                                className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 text-xs text-white focus:border-nexus-accent outline-none"
                            />
                            <button 
                                onClick={handleSavePreset}
                                className="px-4 py-2 bg-nexus-surface border border-nexus-border hover:border-nexus-accent text-white rounded-lg text-xs font-bold transition-colors"
                            >
                                SALVAR
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide min-h-[300px]">
                            {savedPresets.length === 0 && (
                                <div className="text-center text-nexus-dim text-xs italic py-8">
                                    Nenhum preset salvo.
                                </div>
                            )}
                            {savedPresets.map((preset, idx) => (
                                <div key={idx} className="group bg-nexus-bg border border-nexus-border rounded-lg p-3 hover:border-nexus-dim transition-colors relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-xs font-bold text-white">{preset.name}</h4>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => loadPreset(preset)}
                                                className="p-1 hover:text-nexus-accent text-nexus-dim"
                                                title="Carregar"
                                            >
                                                📥
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePreset(idx)}
                                                className="p-1 hover:text-red-500 text-nexus-dim"
                                                title="Deletar"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-[10px] text-nexus-dim font-mono">
                                        <span className="truncate" title={preset.color}>C: {preset.color}</span>
                                        <span className="truncate" title={preset.lighting}>L: {preset.lighting}</span>
                                        <span className="truncate" title={preset.composition}>Comp: {preset.composition}</span>
                                        <span className="truncate" title={preset.texture}>Tex: {preset.texture}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StyleDNABuilder;
