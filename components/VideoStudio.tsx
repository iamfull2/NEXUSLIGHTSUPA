
import React, { useState, useRef } from 'react';
import { generateNexusVideo } from '../geminiService';

const VideoStudio: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [imageInput, setImageInput] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [model, setModel] = useState('veo-fast');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!prompt && !imageInput) return alert("Por favor forneça um prompt ou uma imagem.");
        
        setIsGenerating(true);
        setVideoUrl(null);

        try {
            const url = await generateNexusVideo(prompt, imageInput || undefined, model, '5s', resolution);
            setVideoUrl(url);
        } catch (error: any) {
            alert(`Geração de Vídeo Falhou: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setImageInput(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Controls */}
            <div className="lg:w-1/3 flex flex-col gap-6">
                <div className="bg-nexus-panel border border-nexus-border rounded-2xl p-6 shadow-2xl shadow-nexus-accent/5">
                    <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                        <span className="text-nexus-accent">🎬</span> ESTÚDIO VEO
                    </h2>

                    {/* Prompt */}
                    <div className="mb-6">
                        <label className="block text-xs font-mono text-nexus-dim mb-2 uppercase tracking-widest">Prompt de Movimento</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Descreva o movimento da câmera, ação do sujeito e atmosfera..."
                            className="w-full bg-nexus-bg border border-nexus-border rounded-xl p-4 text-white focus:border-nexus-accent outline-none h-32 resize-none text-sm placeholder:text-nexus-dim/50"
                        />
                    </div>

                    {/* Image Input */}
                    <div className="mb-6">
                        <label className="flex justify-between items-center mb-2">
                            <span className="text-xs font-mono text-nexus-dim uppercase tracking-widest">Frame Inicial (Opcional)</span>
                            {imageInput && <span className="text-[10px] text-nexus-accent cursor-pointer hover:underline" onClick={() => setImageInput(null)}>LIMPAR</span>}
                        </label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                relative border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group
                                ${imageInput ? 'border-nexus-accent bg-nexus-accent/5' : 'border-nexus-border hover:border-nexus-dim hover:bg-nexus-bg/50'}
                            `}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            {imageInput ? (
                                <img src={imageInput} alt="Start Frame" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-4">
                                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🖼️</div>
                                    <div className="text-xs text-nexus-dim font-mono">Clique para Enviar Imagem</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div>
                            <label className="block text-[10px] font-mono text-nexus-dim mb-2 uppercase">Modelo</label>
                            <select 
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-xs text-white focus:border-nexus-accent outline-none"
                            >
                                <option value="veo-fast">Veo 3.1 Fast</option>
                                <option value="veo-hq">Veo 3.1 HQ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono text-nexus-dim mb-2 uppercase">Resolução</label>
                            <select 
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value as any)}
                                className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-xs text-white focus:border-nexus-accent outline-none"
                            >
                                <option value="720p">720p HD</option>
                                <option value="1080p">1080p FHD</option>
                            </select>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || (!prompt && !imageInput)}
                        className={`
                            w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex justify-center items-center gap-2 transition-all
                            ${isGenerating 
                                ? 'bg-nexus-panel border border-nexus-border text-nexus-dim cursor-not-allowed' 
                                : 'bg-gradient-to-r from-nexus-secondary to-nexus-accent text-white hover:shadow-glow hover:-translate-y-0.5'}
                        `}
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                                <span>SINTETIZANDO...</span>
                            </>
                        ) : (
                            <>
                                <span>⚡</span> GERAR VÍDEO
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Output */}
            <div className="lg:w-2/3">
                <div className="h-full min-h-[500px] bg-nexus-panel border border-nexus-border rounded-2xl p-2 relative overflow-hidden flex items-center justify-center shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                    
                    {videoUrl ? (
                        <div className="relative w-full h-full rounded-xl overflow-hidden bg-black flex items-center justify-center group">
                            <video 
                                src={videoUrl} 
                                controls 
                                autoPlay 
                                loop 
                                className="max-w-full max-h-full shadow-2xl"
                            />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a 
                                    href={videoUrl} 
                                    download={`nexus-veo-${Date.now()}.mp4`}
                                    className="bg-nexus-accent text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-white transition-colors flex items-center gap-2"
                                >
                                    ⬇ BAIXAR
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-30">
                            <div className="text-6xl mb-4 animate-pulse">📼</div>
                            <h3 className="text-xl font-bold font-mono">MOTOR DE CINEMA VEO</h3>
                            <p className="text-sm max-w-md mx-auto mt-2">Gere vídeos cinemáticos a partir de texto ou imagens usando o modelo Veo 3.1 do Google.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default VideoStudio;
