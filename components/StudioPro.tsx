
import React, { useState } from 'react';
import { generateWithFreepik } from '../freepikService';
import { NEXUS } from '../nexusKernel'; // Integração direta com Kernel v32

const StudioPro: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [genStyle, setGenStyle] = useState('Photorealistic');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [selectedModel, setSelectedModel] = useState('flux1');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    // Cálculo dinâmico de custo baseado no modelo selecionado
    const getModelTier = () => {
        if (selectedModel === 'flux1') return 'image-generation-ultra';
        if (selectedModel === 'mystic25') return 'image-generation-maximum';
        return 'image-generation-standard';
    };

    const currentCost = NEXUS.costOptimizer.estimateCredits(getModelTier());

    const handleImageGenerate = async () => {
        if (!prompt) return alert("Por favor insira um prompt.");
        
        // Simulação de verificação de monetização
        // Em produção, isso verificaria 'profiles.credits' no Supabase
        if (currentCost > 100) { 
             alert("Créditos insuficientes para esta operação de nível OMEGA.");
             return;
        }

        setIsGenerating(true);
        try {
            const url = await generateWithFreepik({
                prompt: `${prompt}, ${genStyle} style, high quality, 8k`,
                model: selectedModel as any,
                aspectRatio
            });
            setGeneratedImage(url);
        } catch (error: any) {
            console.error(error);
            alert("Falha na Geração: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] animate-in fade-in">
            {/* Sidebar Controls */}
            <div className="lg:col-span-3 bg-nexus-panel border border-nexus-border rounded-xl p-6 flex flex-col gap-6 overflow-y-auto shadow-2xl">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">STUDIO PRO <span className="text-nexus-accent text-[10px] align-top border border-nexus-accent px-1 rounded">OMEGA</span></h2>
                    <p className="text-xs text-nexus-dim font-mono">FLUX.1 / MYSTIC / GEMINI ULTRA</p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-nexus-dim mb-2 uppercase tracking-widest">Motor de Render</label>
                    <div className="space-y-2">
                        {[
                            { id: 'flux1', name: 'FLUX.1 Pro', desc: 'Realismo Extremo & Texto' },
                            { id: 'mystic25', name: 'Mystic 2.5', desc: 'Arte & Fantasia' },
                            { id: 'seedream', name: 'SeaDream', desc: 'Composição Cinemática' },
                            { id: 'gemini', name: 'Gemini 2.5', desc: 'Velocidade & Criatividade' }
                        ].map(m => (
                            <div 
                                key={m.id}
                                onClick={() => setSelectedModel(m.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedModel === m.id 
                                    ? 'bg-nexus-accent/10 border-nexus-accent text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                                    : 'bg-nexus-bg border-nexus-border text-nexus-dim hover:border-nexus-dim hover:bg-white/5'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="text-sm font-bold">{m.name}</div>
                                    {selectedModel === m.id && <div className="w-2 h-2 bg-nexus-accent rounded-full animate-pulse"></div>}
                                </div>
                                <div className="text-[10px] opacity-70">{m.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-nexus-dim mb-2 uppercase tracking-widest">Prompt Mestre</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-sm text-white h-32 resize-none focus:border-nexus-accent outline-none placeholder:text-nexus-dim/30 font-mono leading-relaxed"
                        placeholder="Descreva sua obra-prima..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-nexus-dim mb-2 uppercase tracking-widest">Estilo</label>
                        <select 
                            value={genStyle} 
                            onChange={e => setGenStyle(e.target.value)}
                            className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-xs text-white outline-none focus:border-nexus-accent"
                        >
                            <option>Photorealistic</option>
                            <option>Cinematic</option>
                            <option>3D Render</option>
                            <option>Anime</option>
                            <option>Cyberpunk</option>
                            <option>Analog Film</option>
                            <option>Oil Painting</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-nexus-dim mb-2 uppercase tracking-widest">Ratio</label>
                        <select 
                            value={aspectRatio} 
                            onChange={e => setAspectRatio(e.target.value)}
                            className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-xs text-white outline-none focus:border-nexus-accent"
                        >
                            <option value="1:1">1:1 (Quadrado)</option>
                            <option value="16:9">16:9 (Cinema)</option>
                            <option value="9:16">9:16 (Story)</option>
                            <option value="4:3">4:3 (Clássico)</option>
                            <option value="21:9">21:9 (Ultrawide)</option>
                        </select>
                    </div>
                </div>

                <div className="mt-auto relative group w-full bg-nexus-bg/50 p-4 rounded-xl border border-nexus-border">
                    <div className="flex justify-between text-xs text-nexus-dim mb-3 px-1 border-b border-white/5 pb-2">
                        <span>Custo Estimado:</span>
                        <span className="text-nexus-accent font-bold font-mono">{currentCost} CRÉDITOS</span>
                    </div>
                    <button 
                        onClick={handleImageGenerate}
                        disabled={isGenerating || !prompt}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white font-bold tracking-widest hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>RENDERIZANDO...</span>
                            </>
                        ) : (
                            <>
                                <span>✨</span> GERAR 8K
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Preview Area */}
            <div className="lg:col-span-9 bg-nexus-panel border border-nexus-border rounded-xl p-2 relative overflow-hidden flex items-center justify-center shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                
                {generatedImage ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-black/40 rounded-lg">
                        <img 
                            src={generatedImage} 
                            alt="Generated" 
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in duration-500"
                        />
                         <div className="absolute bottom-6 right-6 flex gap-4">
                             <button 
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = generatedImage;
                                    a.download = `STUDIO-PRO-${Date.now()}.png`;
                                    a.click();
                                }}
                                className="bg-nexus-accent text-black px-6 py-3 rounded-lg font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] transform hover:-translate-y-1"
                             >
                                 BAIXAR ASSET
                             </button>
                         </div>
                    </div>
                ) : (
                    <div className="text-center opacity-30 select-none pointer-events-none">
                        <div className="text-8xl mb-4 animate-pulse">💠</div>
                        <h1 className="text-4xl font-black tracking-tighter text-white">STUDIO PRO</h1>
                        <p className="font-mono mt-2 text-nexus-dim uppercase tracking-[0.5em]">Aguardando Input Neural</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudioPro;
