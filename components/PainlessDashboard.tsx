
import React, { useState } from 'react';
import { ThumbnailConfig } from '../types';
import { ThumbnailComposer } from '../thumbnailComposer';
import { PerfectCutoutEngine } from '../perfectCutout';
import { FloatingElementsAI, ELEMENT_PRESETS } from '../floatingElements';
import { BG_PRESETS, BG_CATEGORIES } from '../epicBackgrounds';
import { MOCKUP_TEMPLATES, MockupEngine } from '../mockupEngine';
import { ExportEngine, SOCIAL_DIMENSIONS } from '../exportEngine';
import { runNexusRequest } from '../geminiService';

interface PainlessDashboardProps {
    onImageGenerated: (url: string) => void;
}

const PainlessDashboard: React.FC<PainlessDashboardProps> = ({ onImageGenerated }) => {
    const [activeTab, setActiveTab] = useState<'thumbnail' | 'cutout' | 'floating' | 'background' | 'mockup' | 'export'>('thumbnail');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Thumbnail State
    const [thumbConfig, setThumbConfig] = useState<ThumbnailConfig>({
        template: 'youtube-classic',
        title: 'TÍTULO ÉPICO',
        floatingElements: []
    });
    const [mainImageFile, setMainImageFile] = useState<string | null>(null);

    // Floating State
    const [selectedElement, setSelectedElement] = useState<keyof typeof ELEMENT_PRESETS>('coins');

    // Background State
    const [selectedBg, setSelectedBg] = useState<keyof typeof BG_PRESETS>('cyberpunk-city');

    // Mockup State
    const [selectedMockup, setSelectedMockup] = useState<string>('iphone-15');
    const [mockupUpload, setMockupUpload] = useState<string | null>(null);

    // Export State
    const [exportUpload, setExportUpload] = useState<string | null>(null);
    const [exportPlatform, setExportPlatform] = useState<string>('instagram-story');

    // --- HANDLERS ---

    const handleThumbnailGen = async () => {
        setIsProcessing(true);
        try {
            // 1. Generate Background
            const bgRes = await runNexusRequest(async (client) => client.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: "Epic dark abstract background, youtube thumbnail style, 8k --no text" }] },
                config: { imageConfig: { aspectRatio: '16:9' } }
            }));
            let bgUrl = '';
             // @ts-ignore
            if (bgRes.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                 // @ts-ignore
                bgUrl = `data:image/png;base64,${bgRes.candidates[0].content.parts[0].inlineData.data}`;
            }

            // 2. Main Image
            let mainUrl = mainImageFile;
            if (!mainUrl) {
                const charRes = await runNexusRequest(async (client) => client.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: "Surprised youtuber face, studio lighting, isolated on white" }] },
                    config: { imageConfig: { aspectRatio: '1:1' } }
                }));
                 // @ts-ignore
                 if (charRes.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                    // @ts-ignore
                   const rawChar = `data:image/png;base64,${charRes.candidates[0].content.parts[0].inlineData.data}`;
                   mainUrl = await PerfectCutoutEngine.process(rawChar, 20); 
               }
            } else {
                mainUrl = await PerfectCutoutEngine.process(mainUrl, 20);
            }

            // 3. Floating Element
            const elPrompt = ELEMENT_PRESETS['fire'];
            const elRes = await runNexusRequest(async (client) => client.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: elPrompt }] },
                config: { imageConfig: { aspectRatio: '1:1' } }
            }));
            let elUrl = '';
             // @ts-ignore
             if (elRes.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                // @ts-ignore
               const rawEl = `data:image/png;base64,${elRes.candidates[0].content.parts[0].inlineData.data}`;
               elUrl = await PerfectCutoutEngine.process(rawEl, 20);
           }

            if (bgUrl && mainUrl && elUrl) {
                const finalUrl = await ThumbnailComposer.compose(thumbConfig, {
                    bgUrl,
                    mainUrl,
                    elementUrls: [elUrl, elUrl] 
                });
                onImageGenerated(finalUrl);
            }

        } catch (e) {
            console.error(e);
            alert("Geração de Thumbnail Falhou");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCutoutUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                setIsProcessing(true);
                const raw = event.target?.result as string;
                const cut = await PerfectCutoutEngine.process(raw, 30);
                const shadowed = await PerfectCutoutEngine.addShadow(cut);
                onImageGenerated(shadowed);
                setIsProcessing(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFloatingGen = async () => {
        setIsProcessing(true);
        try {
            const prompt = ELEMENT_PRESETS[selectedElement];
            const res = await runNexusRequest(async (client) => client.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { imageConfig: { aspectRatio: '1:1' } }
            }));
             // @ts-ignore
             if (res.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                 // @ts-ignore
                const raw = `data:image/png;base64,${res.candidates[0].content.parts[0].inlineData.data}`;
                const cut = await PerfectCutoutEngine.process(raw, 20);
                onImageGenerated(cut);
            }
        } catch(e) { console.error(e); } finally { setIsProcessing(false); }
    };

    const handleBgGen = async () => {
        setIsProcessing(true);
        try {
            const prompt = BG_PRESETS[selectedBg];
            const res = await runNexusRequest(async (client) => client.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { imageConfig: { aspectRatio: '16:9' } }
            }));
             // @ts-ignore
             if (res.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                 // @ts-ignore
                const url = `data:image/png;base64,${res.candidates[0].content.parts[0].inlineData.data}`;
                onImageGenerated(url);
            }
        } catch(e) { console.error(e); } finally { setIsProcessing(false); }
    };

    const handleMockupGen = async () => {
        if (!mockupUpload) return alert("Envie uma imagem primeiro");
        setIsProcessing(true);
        try {
            const result = await MockupEngine.generate(mockupUpload, selectedMockup);
            onImageGenerated(result);
        } catch(e) { console.error(e); } finally { setIsProcessing(false); }
    };

    const handleExport = async () => {
        if (!exportUpload) return alert("Envie uma imagem primeiro");
        setIsProcessing(true);
        try {
            const blob = await ExportEngine.process(exportUpload, {
                format: 'jpeg',
                quality: 0.9,
                platform: exportPlatform
            });
            const url = URL.createObjectURL(blob as unknown as Blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nexus_export_${exportPlatform}.jpg`;
            a.click();
        } catch(e) { console.error(e); } finally { setIsProcessing(false); }
    };

    return (
        <div className="bg-nexus-panel border border-nexus-border rounded-xl p-6 mt-6 animate-in fade-in shadow-2xl shadow-nexus-accent/5">
            <div className="flex items-center gap-2 mb-6 border-b border-nexus-border pb-4">
                <span className="text-2xl">💊</span>
                <div>
                    <h3 className="text-white font-bold font-mono tracking-widest text-sm">SUÍTE REMOVEDORA DE DOR V36.0</h3>
                    <p className="text-[10px] text-nexus-dim">100% dos Problemas Resolvidos.</p>
                </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {['thumbnail', 'cutout', 'floating', 'background', 'mockup', 'export'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded text-[10px] font-bold font-mono whitespace-nowrap transition-all uppercase ${activeTab === tab ? 'bg-nexus-secondary text-white' : 'bg-nexus-bg text-gray-400 border border-nexus-border'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="min-h-[300px]">
                {/* THUMBNAIL */}
                {activeTab === 'thumbnail' && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-nexus-dim font-mono block mb-1">TÍTULO DO VÍDEO (IMPACTO MÁXIMO)</label>
                            <input 
                                type="text" 
                                value={thumbConfig.title}
                                onChange={(e) => setThumbConfig({...thumbConfig, title: e.target.value})}
                                className="w-full bg-nexus-bg border border-nexus-border rounded p-3 text-white font-black text-xl"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-nexus-dim font-mono block mb-1">SUJEITO PRINCIPAL</label>
                            <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onload = (ev) => setMainImageFile(ev.target?.result as string); r.readAsDataURL(f); } }} className="block w-full text-xs text-gray-400" />
                        </div>
                        <button onClick={handleThumbnailGen} disabled={isProcessing} className="w-full py-3 bg-nexus-secondary text-white font-bold rounded-lg hover:shadow-lg transition-all flex justify-center items-center gap-2">
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>COMPONDO...</span>
                                </>
                            ) : 'GERAR THUMBNAIL'}
                        </button>
                    </div>
                )}

                {/* CUTOUT */}
                {activeTab === 'cutout' && (
                    <div className="text-center py-10 border-2 border-dashed border-nexus-border rounded-lg">
                        <div className="text-4xl mb-4">✂️</div>
                        <h4 className="text-white font-bold mb-2">Solte a Imagem para Remover o Fundo</h4>
                        <input type="file" accept="image/*" onChange={handleCutoutUpload} className="hidden" id="cutout-upload" />
                        <label htmlFor="cutout-upload" className="cursor-pointer bg-nexus-accent text-black px-6 py-2 rounded-full font-bold hover:bg-white transition-all flex justify-center items-center gap-2 w-fit mx-auto">
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>PROCESSANDO...</span>
                                </>
                            ) : 'ENVIAR IMAGEM'}
                        </label>
                    </div>
                )}

                {/* FLOATING */}
                {activeTab === 'floating' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            {Object.keys(ELEMENT_PRESETS).map((key) => (
                                <div key={key} onClick={() => setSelectedElement(key as any)} className={`cursor-pointer p-3 rounded border text-center transition-all ${selectedElement === key ? 'border-nexus-success bg-nexus-success/10 text-nexus-success' : 'border-nexus-border bg-nexus-bg text-gray-400'}`}>
                                    <div className="text-[10px] font-bold uppercase">{key}</div>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleFloatingGen} disabled={isProcessing} className="w-full py-3 bg-nexus-success text-black font-bold rounded-lg flex justify-center items-center gap-2">
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>GERANDO...</span>
                                </>
                            ) : `GERAR ${selectedElement.toUpperCase()}`}
                        </button>
                    </div>
                )}

                {/* BACKGROUND */}
                {activeTab === 'background' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {Object.keys(BG_PRESETS).map((key) => (
                                <div key={key} onClick={() => setSelectedBg(key as any)} className={`cursor-pointer p-3 rounded border text-center transition-all ${selectedBg === key ? 'border-nexus-accent bg-nexus-accent/10 text-nexus-accent' : 'border-nexus-border bg-nexus-bg text-gray-400'}`}>
                                    <div className="text-[10px] font-bold uppercase">{key}</div>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleBgGen} disabled={isProcessing} className="w-full py-3 bg-nexus-accent text-black font-bold rounded-lg flex justify-center items-center gap-2">
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>GERANDO...</span>
                                </>
                            ) : 'GERAR BACKGROUND ÉPICO'}
                        </button>
                    </div>
                )}

                {/* MOCKUP */}
                {activeTab === 'mockup' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            {Object.keys(MOCKUP_TEMPLATES).map((key) => (
                                <div key={key} onClick={() => setSelectedMockup(key)} className={`cursor-pointer p-3 rounded border text-center transition-all ${selectedMockup === key ? 'border-purple-500 bg-purple-500/10 text-purple-500' : 'border-nexus-border bg-nexus-bg text-gray-400'}`}>
                                    <div className="text-[10px] font-bold uppercase">{MOCKUP_TEMPLATES[key].name}</div>
                                </div>
                            ))}
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onload = (ev) => setMockupUpload(ev.target?.result as string); r.readAsDataURL(f); } }} className="block w-full text-xs text-gray-400" />
                        <button onClick={handleMockupGen} disabled={isProcessing} className="w-full py-3 bg-purple-500 text-white font-bold rounded-lg flex justify-center items-center gap-2">
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>MOCKANDO...</span>
                                </>
                            ) : 'GERAR MOCKUP'}
                        </button>
                    </div>
                )}

                {/* EXPORT */}
                {activeTab === 'export' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 max-h-32 overflow-y-auto">
                            {Object.keys(SOCIAL_DIMENSIONS).map((key) => (
                                <div key={key} onClick={() => setExportPlatform(key)} className={`cursor-pointer p-3 rounded border text-center transition-all ${exportPlatform === key ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-nexus-border bg-nexus-bg text-gray-400'}`}>
                                    <div className="text-[10px] font-bold uppercase">{key}</div>
                                </div>
                            ))}
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onload = (ev) => setExportUpload(ev.target?.result as string); r.readAsDataURL(f); } }} className="block w-full text-xs text-gray-400" />
                        <button onClick={handleExport} disabled={isProcessing} className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg flex justify-center items-center gap-2">
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>PROCESSANDO...</span>
                                </>
                            ) : 'EXPORTAR & BAIXAR'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PainlessDashboard;
