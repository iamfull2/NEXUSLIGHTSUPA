
import React, { useState, useEffect } from 'react';
import { AISuggestion } from '../types';
import { LiveEditorService } from '../liveEditorService';

interface FloatingAIAssistantProps {
    onGenerate: (url: string, prompt: string) => void;
    context: any; // Simplified context object
}

const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({ onGenerate, context }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

    useEffect(() => {
        // Mock context-aware suggestions logic
        const newSuggestions: AISuggestion[] = [];
        
        newSuggestions.push({
            icon: '✨',
            title: 'Melhorar Resolução',
            description: 'Upscale na seleção para 4K',
            action: () => alert("Upscaling...")
        });

        if (context?.timeOfDay === 'late_night') {
            newSuggestions.push({
                icon: '🌙',
                title: 'Paleta Modo Escuro',
                description: 'Gerar elementos de interface escuros',
                action: () => setPrompt("Dark mode UI interface elements, neon accents")
            });
        }

        setSuggestions(newSuggestions);
    }, [context]);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsProcessing(true);
        try {
            // Use V37 Live Service
            const url = await LiveEditorService.generateAsset('element', prompt, 'high quality');
            onGenerate(url, prompt);
            setPrompt('');
            setIsOpen(false);
        } catch (e) {
            console.error(e);
            alert("Geração de IA Falhou");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            {/* Floating Button (FAB) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full flex items-center justify-center
                    bg-gradient-to-r from-nexus-secondary to-nexus-accent shadow-[0_0_30px_rgba(0,240,255,0.4)]
                    hover:scale-110 active:scale-95 transition-all duration-300
                    ${isProcessing ? 'animate-spin' : 'animate-bounce-slow'}
                `}
            >
                <span className="text-2xl">{isProcessing ? '⏳' : '✨'}</span>
            </button>

            {/* AI Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-8 z-50 w-80 bg-nexus-panel/90 backdrop-blur-xl border border-nexus-border rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-nexus-accent rounded-full animate-pulse"></span>
                            <h3 className="font-bold text-nexus-text tracking-wide text-sm">NEXUS IA V2.0</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-nexus-dim hover:text-white">✕</button>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-2 mb-4">
                        {suggestions.map((sug, i) => (
                            <button
                                key={i}
                                onClick={sug.action}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left transition-colors group"
                            >
                                <span className="text-xl group-hover:scale-110 transition-transform">{sug.icon}</span>
                                <div>
                                    <div className="text-xs font-bold text-nexus-text">{sug.title}</div>
                                    <div className="text-[10px] text-nexus-dim">{sug.description}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Prompt Input */}
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }}}
                            placeholder="Descreva o que conjurar..."
                            className="w-full bg-nexus-surface border border-nexus-border rounded-xl p-3 text-sm text-nexus-text placeholder:text-nexus-dim focus:border-nexus-accent outline-none resize-none h-24"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isProcessing || !prompt}
                            className="absolute bottom-2 right-2 p-2 bg-nexus-accent text-black rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ➞
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingAIAssistant;
