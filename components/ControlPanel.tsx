
import React, { useRef, useState, useEffect } from 'react';
import { NexusConfig } from '../types';
import { HYPER_REALISM_PRESETS } from '../hyperRealismEngine';
import { BRAZIL_DIMENSIONS } from '../nexusCore';
import { supabase } from '../supabaseClient';

interface ControlPanelProps {
    config: NexusConfig;
    setConfig: React.Dispatch<React.SetStateAction<NexusConfig>>;
    onGenerate: () => void;
    isProcessing: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ config, setConfig, onGenerate, isProcessing }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    
    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const env = (import.meta as any).env || {};
            const adminEmail = env.VITE_ADMIN_EMAIL || 'mathias2matheus2@gmail.com';
            if (user?.email?.toLowerCase() === adminEmail.toLowerCase()) {
                setIsAdmin(true);
            }
        };
        checkAdmin();
    }, []);
    
    const handleChange = (key: keyof NexusConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => handleChange('referenceImage', event.target?.result as string);
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const ModuleToggle = ({ active, label, onClick, colorClass, icon }: any) => (
        <button 
            onClick={!isProcessing ? onClick : undefined}
            className={`
                relative p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95
                ${active 
                    ? `bg-${colorClass}-500/10 border-${colorClass}-500` 
                    : `bg-nexus-panel border-nexus-border hover:border-${colorClass}-500/50`}
                ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
        >
            <span className={`text-xl ${active ? 'scale-110' : 'grayscale'}`}>{icon}</span>
            <span className={`text-[10px] font-bold uppercase ${active ? `text-${colorClass}-400` : 'text-nexus-dim'}`}>
                {label}
            </span>
        </button>
    );

    return (
        <div className={`glass-panel rounded-2xl flex flex-col relative overflow-hidden transition-all duration-500 ${isProcessing ? 'border-nexus-accent/30' : ''}`}>
            {isProcessing && (
                <div className="absolute inset-0 bg-gradient-to-b from-nexus-accent/5 to-transparent pointer-events-none animate-pulse z-0"></div>
            )}

            <div className="p-4 sm:p-6 flex flex-col gap-6 relative z-10 flex-1">
                <div className="space-y-3">
                    <label className="flex justify-between items-baseline">
                        <span className="text-xs font-mono text-nexus-accent tracking-widest uppercase font-bold">Injetor de Conceito</span>
                    </label>
                    <textarea
                        value={config.concept}
                        onChange={(e) => handleChange('concept', e.target.value)}
                        placeholder="Descreva sua visão..."
                        className="w-full bg-nexus-bg/50 border border-nexus-border rounded-xl p-4 text-nexus-text focus:border-nexus-accent outline-none transition-all resize-none h-32 text-sm"
                        disabled={isProcessing}
                    />
                </div>

                 <div>
                    <label className="block text-xs font-mono text-nexus-dim mb-3 uppercase tracking-widest">Módulos</label>
                    <div className="grid grid-cols-4 gap-2">
                        <ModuleToggle label="Clone" active={config.useClone} onClick={() => handleChange('useClone', !config.useClone)} colorClass="pink" icon="📸" />
                        <ModuleToggle label="Real" active={config.useHyperRealism} onClick={() => handleChange('useHyperRealism', !config.useHyperRealism)} colorClass="orange" icon="👁️" />
                        <ModuleToggle label="Mind" active={config.useConsciousness} onClick={() => handleChange('useConsciousness', !config.useConsciousness)} colorClass="red" icon="🧠" />
                        <ModuleToggle label="Quantum" active={config.useQuantum} onClick={() => handleChange('useQuantum', !config.useQuantum)} colorClass="green" icon="⚛️" />
                    </div>
                </div>

                {config.useHyperRealism && (
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
                        <select
                            value={config.hyperRealismPreset || 'photo-studio'}
                            onChange={(e) => handleChange('hyperRealismPreset', e.target.value)}
                            className="w-full bg-nexus-bg border border-orange-500/30 rounded-lg p-2 text-xs text-nexus-text"
                            disabled={isProcessing}
                        >
                            {Object.values(HYPER_REALISM_PRESETS).map(preset => (
                                <option key={preset.id} value={preset.id}>{preset.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-mono text-nexus-dim mb-3 uppercase tracking-widest">Formato</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto scrollbar-hide">
                        {Object.entries(BRAZIL_DIMENSIONS).map(([label, ratio]) => (
                            <button
                                key={label}
                                onClick={() => { handleChange('aspectRatio', ratio); handleChange('format', label); }}
                                className={`p-2 rounded-lg text-left border flex flex-col gap-1 ${config.format === label ? 'bg-nexus-accent/10 border-nexus-accent' : 'bg-nexus-panel border-nexus-border'}`}
                                disabled={isProcessing}
                            >
                                <span className={`text-[10px] font-bold uppercase truncate ${config.format === label ? 'text-nexus-accent' : 'text-nexus-text'}`}>{label}</span>
                                <span className="text-[9px] font-mono text-nexus-dim">{ratio}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div 
                        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer ${config.referenceImage ? 'border-nexus-accent bg-nexus-accent/5' : 'border-nexus-border'}`}
                        onClick={() => !isProcessing && fileInputRef.current?.click()}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        {config.referenceImage ? (
                            <div className="flex items-center gap-4">
                                <img src={config.referenceImage} alt="Ref" className="w-12 h-12 rounded-lg object-cover" />
                                <div className="text-left flex-1"><div className="text-xs font-bold text-nexus-accent">Imagem Ativa</div></div>
                                <button onClick={(e) => { e.stopPropagation(); handleChange('referenceImage', null); }} className="text-nexus-dim">✕</button>
                            </div>
                        ) : (
                            <div className="text-xs font-bold text-nexus-dim">📸 Carregar Referência</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-nexus-border bg-nexus-panel/50">
                <button
                    onClick={onGenerate}
                    disabled={isProcessing || !config.concept}
                    className={`
                        w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm transition-all
                        ${isProcessing 
                            ? 'text-white border border-nexus-accent/50 cursor-wait' 
                            : 'bg-gradient-to-r from-nexus-secondary to-nexus-accent text-white hover:shadow-glow'}
                    `}
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {isProcessing ? 'SINTETIZANDO...' : '⚡ MATERIALIZAR'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default ControlPanel;
