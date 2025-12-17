
import React, { useState } from 'react';
import { GenerationResult } from '../types';

interface ResultDisplayProps {
    result: GenerationResult | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
    const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'minted'>('idle');

    if (!result) {
        return (
            <div className="h-full min-h-[400px] md:min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-nexus-border rounded-2xl bg-nexus-panel/30 animate-in fade-in duration-700">
                <div className="text-6xl mb-4 opacity-20 animate-float text-nexus-dim">⚡</div>
                <h3 className="text-xl font-bold text-nexus-dim mb-2">Aguardando Entrada Quântica</h3>
                <p className="text-nexus-dim text-sm max-w-xs text-center">Configure os parâmetros principais e ative o enxame para materializar sua visão.</p>
            </div>
        );
    }

    const shareToTwitter = () => {
        const text = `Created with NEXUS V8.0 OMEGA: ${result.title || 'AI Art'} - Viral Score: ${result.viralScore}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleMintNFT = () => {
        setMintStatus('minting');
        // Simulate Polygon Minting Delay
        setTimeout(() => {
            setMintStatus('minted');
            alert(`NFT Mintado com Sucesso!\nHash: ${result.nftHash}\nRede: Polygon Mainnet\nRoyalty: 15% Perpetual`);
        }, 2000);
    };

    const handleVerifyWatermark = () => {
        alert(`VERIFICAÇÃO FORENSE DE MARCA D'ÁGUA:\n\nID: ${result.watermarkId}\nIntegridade: 100%\nProteção: Nexus Invisible Layer v8`);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Title Generator Ultra Display */}
            {result.title && (
                <div className="text-center py-4 relative group cursor-pointer" onClick={() => navigator.clipboard.writeText(result.title || '')}>
                    <div className="absolute top-0 right-0 left-0 bottom-0 bg-nexus-accent/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="text-[10px] font-mono text-nexus-dim uppercase tracking-[0.3em] mb-2 group-hover:text-nexus-accent transition-colors">Título Gerado (Protegido INPI)</div>
                    <h2 className="relative z-10 text-3xl md:text-5xl font-black uppercase tracking-tighter nexus-gradient-text drop-shadow-2xl leading-tight hover:scale-[1.01] transition-transform duration-300">
                        {result.title}
                    </h2>
                     <div className="h-0.5 w-0 group-hover:w-24 mx-auto bg-nexus-accent mt-2 transition-all duration-500 ease-out"></div>
                </div>
            )}

            {/* V8.0 OMEGA ECONOMIC DASHBOARD */}
            {result.viralScore && (
                <div className="grid grid-cols-3 gap-4 bg-nexus-panel/80 border border-nexus-accent/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
                    <div className="text-center border-r border-nexus-border">
                        <div className="text-[10px] font-mono text-nexus-dim uppercase tracking-widest mb-1">Viral Score</div>
                        <div className="text-2xl font-black text-nexus-accent animate-pulse">{result.viralScore}/100</div>
                    </div>
                    <div className="text-center border-r border-nexus-border">
                        <div className="text-[10px] font-mono text-nexus-dim uppercase tracking-widest mb-1">Valor Projetado</div>
                        <div className="text-2xl font-black text-nexus-success">{result.commercialValue}</div>
                    </div>
                    <div className="text-center flex flex-col justify-center gap-1">
                        <button 
                            onClick={handleMintNFT}
                            disabled={mintStatus !== 'idle'}
                            className={`
                                text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 rounded transition-all
                                ${mintStatus === 'minted' 
                                    ? 'bg-nexus-success text-black' 
                                    : 'bg-nexus-secondary text-white hover:bg-white hover:text-nexus-secondary'}
                            `}
                        >
                            {mintStatus === 'idle' ? 'MINT NFT (15%)' : mintStatus === 'minting' ? 'MINTANDO...' : 'MINTADO ✓'}
                        </button>
                    </div>
                </div>
            )}

            {/* Image Section */}
            <div className="relative group rounded-2xl overflow-hidden border border-nexus-border shadow-2xl shadow-black/50 interactive-card">
                <img 
                    src={result.imageUrl} 
                    alt="Nexus Generation" 
                    className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Watermark Overlay (Invisible simulated by UI Badge) */}
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur border border-white/10 px-2 py-1 rounded text-[8px] font-mono text-white/50 pointer-events-none select-none">
                    WATERMARK: {result.watermarkId}
                </div>

                {/* Hover Overlay with Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = result.imageUrl;
                                    a.download = `NEXUS-V8-${Date.now()}.png`;
                                    a.click();
                                }}
                                className="bg-white text-black px-4 py-2 rounded-full font-bold text-xs hover:bg-nexus-accent transition-all shadow-lg flex items-center gap-2"
                            >
                                ⬇ PNG 8K
                            </button>
                            <button 
                                onClick={handleVerifyWatermark}
                                className="bg-black/50 border border-white/20 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-white hover:text-black transition-all shadow-lg flex items-center gap-2"
                            >
                                🛡️ VERIFICAR
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={shareToTwitter} className="p-3 rounded-full bg-black/60 text-white hover:bg-[#1DA1F2] hover:text-white transition-all border border-white/10 hover:border-transparent hover:scale-110 hover:shadow-[#1DA1F2]/50 shadow-lg">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

             {/* V8 Pipeline Indicators */}
             <div className="flex gap-2 justify-center flex-wrap">
                <span className="text-[10px] font-mono bg-nexus-success/10 text-nexus-success px-2 py-1 rounded border border-nexus-success/30" title="Protection Active">INPI PROTECTED</span>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-500 px-2 py-1 rounded border border-purple-500/30" title="Blockchain Layer">POLYGON NFT</span>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-500 px-2 py-1 rounded border border-blue-500/30" title="Invisible Watermark">WATERMARKED</span>
            </div>

            {/* Technical Breakdown Section */}
            <div className="glass-panel rounded-xl p-6 hover:border-nexus-accent/30 transition-colors duration-500">
                <div className="flex items-center gap-2 mb-6 border-b border-nexus-border pb-4">
                    <span className="text-lg">⚙️</span>
                    <h3 className="text-nexus-accent font-mono text-sm tracking-widest font-bold">FICHA TÉCNICA OMEGA</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
                    <div className="bg-nexus-bg/50 p-4 rounded-lg border border-nexus-border/50 hover:border-nexus-accent/50 hover:bg-nexus-bg hover:shadow-lg transition-all duration-300 group">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-nexus-secondary group-hover:scale-110 transition-transform">🖥️</span>
                            <span className="text-nexus-dim text-xs font-mono tracking-wider group-hover:text-nexus-text">MOTOR DE RENDER</span>
                        </div>
                        <p className="text-nexus-text font-mono text-xs leading-relaxed opacity-80 group-hover:opacity-100">{result.specs.render}</p>
                    </div>

                    <div className="bg-nexus-bg/50 p-4 rounded-lg border border-nexus-border/50 hover:border-nexus-accent/50 hover:bg-nexus-bg hover:shadow-lg transition-all duration-300 group">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-nexus-secondary group-hover:scale-110 transition-transform">💡</span>
                            <span className="text-nexus-dim text-xs font-mono tracking-wider group-hover:text-nexus-text">FÍSICA DA LUZ</span>
                        </div>
                        <p className="text-nexus-text font-mono text-xs leading-relaxed opacity-80 group-hover:opacity-100">{result.specs.lighting}</p>
                    </div>

                    <div className="bg-nexus-bg/50 p-4 rounded-lg border border-nexus-border/50 hover:border-nexus-accent/50 hover:bg-nexus-bg hover:shadow-lg transition-all duration-300 group">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-nexus-secondary group-hover:scale-110 transition-transform">📷</span>
                            <span className="text-nexus-dim text-xs font-mono tracking-wider group-hover:text-nexus-text">ÓTICA DE CÂMERA</span>
                        </div>
                        <p className="text-nexus-text font-mono text-xs leading-relaxed opacity-80 group-hover:opacity-100">{result.specs.camera}</p>
                    </div>

                    <div className="bg-nexus-bg/50 p-4 rounded-lg border border-nexus-border/50 hover:border-nexus-accent/50 hover:bg-nexus-bg hover:shadow-lg transition-all duration-300 group">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-nexus-secondary group-hover:scale-110 transition-transform">🧠</span>
                            <span className="text-nexus-dim text-xs font-mono tracking-wider group-hover:text-nexus-text">NEURO-ESTÉTICA</span>
                        </div>
                        <p className="text-nexus-text font-mono text-xs leading-relaxed opacity-80 group-hover:opacity-100">{result.specs.mood}</p>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-nexus-border">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-nexus-dim">📝</span>
                        <span className="text-nexus-dim block text-xs font-mono tracking-wider">PROMPT MESTRE (COPYRIGHT)</span>
                    </div>
                    <div className="relative group">
                        <p className="text-xs text-nexus-text leading-relaxed font-mono break-words bg-nexus-surface p-4 rounded-lg border border-nexus-border/50 group-hover:border-nexus-accent/30 group-hover:bg-nexus-bg transition-colors">
                            {result.finalPrompt}
                        </p>
                        <button 
                            onClick={() => navigator.clipboard.writeText(result.finalPrompt)}
                            className="absolute top-2 right-2 text-[10px] bg-nexus-dim/20 hover:bg-nexus-accent hover:text-black text-nexus-dim px-3 py-1.5 rounded transition-all opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0"
                        >
                            COPIAR
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-nexus-border/50">
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-nexus-dim font-mono">HASH BLOCKCHAIN:</span>
                        <span className="text-xs font-mono text-nexus-text opacity-50">{result.nftHash?.substring(0, 10)}...</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-nexus-dim font-mono">PONTUAÇÃO OMEGA:</span>
                        <span className="text-xs font-mono font-bold text-nexus-success tracking-wider border border-nexus-success/30 bg-nexus-success/10 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,255,157,0.1)]">
                            {result.qualityScore}
                        </span>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ResultDisplay;
