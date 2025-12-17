
import React, { useState, useEffect, useRef } from 'react';
import { LiveEditorService } from '../liveEditorService';
import { useImageGeneration } from '../hooks/useImageGeneration';

const COLORS = {
    primary: '#00f0ff',
    secondary: '#7000ff'
};

declare global {
    interface Window {
        fabric: any;
    }
}

const LiveEditor: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fabricCanvas, setFabricCanvas] = useState<any>(null);
    const [layers, setLayers] = useState<any[]>([]);
    const [activeModal, setActiveModal] = useState<'title' | 'logo' | 'asset' | null>(null);
    const [zoom, setZoom] = useState(1);
    
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [isGroupSelection, setIsGroupSelection] = useState(false);
    
    const [props, setProps] = useState({
        opacity: 1,
        fontSize: 40,
        fill: '#000000',
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'left',
        brightness: 0,
        contrast: 0,
        saturation: 0
    });

    const [history, setHistory] = useState<string[]>([]);
    const [historyStep, setHistoryStep] = useState(0);
    const [isHistoryLocked, setIsHistoryLocked] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [genResult, setGenResult] = useState<{url: string, prompt: string} | null>(null);

    // Hooks
    const { removeBackground, loading: bgLoading } = useImageGeneration();

    // Form States
    const [titleForm, setTitleForm] = useState({ text: '', style: 'luxury', size: 'large', bg: 'transparent', desc: '' });
    const [logoForm, setLogoForm] = useState({ brand: '', style: 'minimal', industry: '', color: '#6366f1' });
    const [assetForm, setAssetForm] = useState({ type: 'icon', desc: '', style: 'minimal' });

    // --- CANVAS INIT ---
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current || !window.fabric) return;

        const canvas = new window.fabric.Canvas(canvasRef.current, {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
            selection: true
        });

        setFabricCanvas(canvas);

        // Initial History State
        const initialJson = JSON.stringify(canvas.toJSON());
        setHistory([initialJson]);
        setHistoryStep(0);

        const handleResize = () => {
            if (containerRef.current) {
                canvas.setWidth(containerRef.current.clientWidth);
                canvas.setHeight(containerRef.current.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        // Event Listeners
        const update = () => {
            updateLayers(canvas);
            saveHistory(canvas);
        };

        canvas.on('object:added', update);
        canvas.on('object:removed', update);
        canvas.on('object:modified', update);
        
        canvas.on('selection:created', (e: any) => onSelect(e.selected));
        canvas.on('selection:updated', (e: any) => onSelect(e.selected));
        canvas.on('selection:cleared', onDeselect);

        // Zoom/Pan
        canvas.on('mouse:wheel', (opt: any) => {
            if (opt.e.ctrlKey) {
                opt.e.preventDefault();
                let delta = opt.e.deltaY;
                let z = canvas.getZoom();
                z *= 0.999 ** delta;
                if (z > 5) z = 5;
                if (z < 0.1) z = 0.1;
                canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, z);
                setZoom(z);
            }
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.dispose();
        };
    }, []);

    // --- HISTORY SYSTEM (Undo/Redo) ---

    const saveHistory = (canvas: any) => {
        if (isHistoryLocked) return;
        
        // Use a small timeout to debounce multiple rapid events
        setTimeout(() => {
            if (canvas) {
                const json = JSON.stringify(canvas.toJSON());
                setHistory(prev => {
                    const newHistory = prev.slice(0, historyStep + 1);
                    newHistory.push(json);
                    return newHistory;
                });
                setHistoryStep(prev => prev + 1);
            }
        }, 100);
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            setIsHistoryLocked(true);
            const prevJson = history[historyStep - 1];
            fabricCanvas.loadFromJSON(prevJson, () => {
                fabricCanvas.renderAll();
                setHistoryStep(historyStep - 1);
                updateLayers(fabricCanvas);
                setIsHistoryLocked(false);
            });
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            setIsHistoryLocked(true);
            const nextJson = history[historyStep + 1];
            fabricCanvas.loadFromJSON(nextJson, () => {
                fabricCanvas.renderAll();
                setHistoryStep(historyStep + 1);
                updateLayers(fabricCanvas);
                setIsHistoryLocked(false);
            });
        }
    };

    // --- PROJECT SAVE/LOAD ---

    const saveProject = () => {
        if (!fabricCanvas) return;
        const json = JSON.stringify(fabricCanvas.toJSON());
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexus-project-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !fabricCanvas) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const json = ev.target?.result as string;
            setIsHistoryLocked(true); // Don't record the load step itself as a modification
            fabricCanvas.loadFromJSON(json, () => {
                fabricCanvas.renderAll();
                updateLayers(fabricCanvas);
                // Reset history to this new state
                setHistory([json]);
                setHistoryStep(0);
                setIsHistoryLocked(false);
            });
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    // --- CORE LOGIC ---

    const updateLayers = (canvas: any) => {
        const objs = canvas.getObjects();
        setLayers(objs.map((o: any, i: number) => ({
            id: i,
            type: o.type,
            name: o.name || `${o.type} ${i+1}`,
            active: o === canvas.getActiveObject() || (canvas.getActiveObjects().includes(o))
        })).reverse());
    };

    const onSelect = (selected: any[]) => {
        if (!selected || selected.length === 0) return;

        const obj = selected[0];
        const isMulti = selected.length > 1;
        const isGroup = obj.type === 'group';

        setIsGroupSelection(isMulti || isGroup);
        setSelectedType(isMulti ? 'selection' : obj.type);

        // Extract properties from the first object
        let brightness = 0;
        let contrast = 0;
        let saturation = 0;

        if (obj.filters) {
            // @ts-ignore
            const bFilter = obj.filters.find(f => f.type === 'Brightness');
            if (bFilter) brightness = bFilter.brightness;
            // @ts-ignore
            const cFilter = obj.filters.find(f => f.type === 'Contrast');
            if (cFilter) contrast = cFilter.contrast;
            // @ts-ignore
            const sFilter = obj.filters.find(f => f.type === 'Saturation');
            if (sFilter) saturation = sFilter.saturation;
        }

        setProps({
            opacity: obj.opacity !== undefined ? obj.opacity : 1,
            fontSize: obj.fontSize || 40,
            fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
            fontFamily: obj.fontFamily || 'Inter',
            fontWeight: obj.fontWeight || 'normal',
            textAlign: obj.textAlign || 'left',
            brightness,
            contrast,
            saturation
        });
        
        if (fabricCanvas) updateLayers(fabricCanvas);
    };

    const onDeselect = () => {
        setSelectedType(null);
        setIsGroupSelection(false);
        if (fabricCanvas) updateLayers(fabricCanvas);
    };

    const selectLayer = (index: number) => {
        if (!fabricCanvas) return;
        const objs = fabricCanvas.getObjects();
        const activeObj = objs[objs.length - 1 - index]; // Because layers are reversed in UI
        if (activeObj) {
            fabricCanvas.setActiveObject(activeObj);
            fabricCanvas.renderAll();
        }
    };

    const updateProp = (key: string, value: any) => {
        if (!fabricCanvas) return;
        const obj = fabricCanvas.getActiveObject();
        if (obj) {
            obj.set(key, value);
            // Dirty fix for text rendering update
            if (key === 'fontFamily' || key === 'fontWeight' || key === 'fill') {
                fabricCanvas.requestRenderAll();
            } else {
                obj.setCoords();
                fabricCanvas.requestRenderAll();
            }
            // Trigger history
            saveHistory(fabricCanvas);
            setProps(prev => ({ ...prev, [key]: value }));
        }
    };

    const updateImageFilter = (type: 'Brightness' | 'Contrast' | 'Saturation', value: number) => {
        if (!fabricCanvas) return;
        const obj = fabricCanvas.getActiveObject();
        if (!obj || obj.type !== 'image') return;

        // Ensure filters array exists
        if (!obj.filters) obj.filters = [];

        // Find or create filter
        // @ts-ignore
        let filterIdx = obj.filters.findIndex(f => f.type === type);
        
        if (filterIdx === -1) {
            const filterClass = window.fabric.Image.filters[type];
            if (filterClass) {
                const newFilter = new filterClass({ [type.toLowerCase()]: value });
                obj.filters.push(newFilter);
            }
        } else {
            // Update existing
            obj.filters[filterIdx][type.toLowerCase()] = value;
        }

        obj.applyFilters();
        fabricCanvas.requestRenderAll();
        saveHistory(fabricCanvas); // Save state
        setProps(prev => ({ ...prev, [type.toLowerCase()]: value }));
    };

    // --- TOOL ACTIONS ---

    const addText = () => {
        const text = new window.fabric.IText('Double click to edit', {
            left: 100, top: 100, fontSize: 40, fontFamily: 'Inter', name: 'Text Layer'
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
    };

    const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (f) => {
                window.fabric.Image.fromURL(f.target?.result as string, (img: any) => {
                    img.scale(0.3);
                    img.set({ name: file.name });
                    fabricCanvas.add(img);
                    fabricCanvas.setActiveObject(img);
                });
            };
            reader.readAsDataURL(file);
        }
        // reset input
        e.target.value = '';
    };

    const addShape = (type: 'rect' | 'circle') => {
        let shape;
        if (type === 'rect') {
            shape = new window.fabric.Rect({ left: 100, top: 100, width: 100, height: 100, fill: COLORS.primary, name: 'Rectangle' });
        } else {
            shape = new window.fabric.Circle({ left: 100, top: 100, radius: 50, fill: COLORS.secondary, name: 'Circle' });
        }
        fabricCanvas.add(shape);
        fabricCanvas.setActiveObject(shape);
    };

    const handleGroup = () => {
        if (!fabricCanvas) return;
        const activeObj = fabricCanvas.getActiveObject();
        if (!activeObj) return;

        if (activeObj.type === 'activeSelection') {
            activeObj.toGroup();
            fabricCanvas.requestRenderAll();
            updateLayers(fabricCanvas);
            saveHistory(fabricCanvas);
            setIsGroupSelection(true); // Is now a single group object
            setSelectedType('group');
        } else if (activeObj.type === 'group') {
            activeObj.toActiveSelection();
            fabricCanvas.requestRenderAll();
            updateLayers(fabricCanvas);
            saveHistory(fabricCanvas);
            setIsGroupSelection(true); // Now multiple selected
            setSelectedType('selection');
        }
    };

    // --- AI ACTIONS ---

    const handleRemoveBg = async () => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (!active || active.type !== 'image') return;

        try {
            // @ts-ignore
            const src = active.getSrc();
            const cutout = await removeBackground(src);
            
            // @ts-ignore
            active.setSrc(cutout, () => {
                // @ts-ignore
                active.set('hasTransparentBg', true);
                fabricCanvas.renderAll();
                saveHistory(fabricCanvas);
            });
        } catch (e: any) {
            alert("Background Removal Failed: " + e.message);
        }
    };

    // --- AI GENERATION ---

    const handleGenerate = async (type: 'title' | 'logo' | 'asset') => {
        setIsGenerating(true);
        setGenResult(null);
        try {
            let url = '';
            let label = '';
            
            if (type === 'title') {
                url = await LiveEditorService.generateTitle(titleForm.text, titleForm.style, titleForm.size, titleForm.bg, titleForm.desc);
                label = `Title: ${titleForm.text}`;
            } else if (type === 'logo') {
                url = await LiveEditorService.generateLogo(logoForm.brand, logoForm.style, logoForm.industry, logoForm.color, '');
                label = `Logo: ${logoForm.brand}`;
            } else if (type === 'asset') {
                url = await LiveEditorService.generateAsset(assetForm.type, assetForm.desc, assetForm.style);
                label = `Asset: ${assetForm.desc}`;
            }

            setGenResult({ url, prompt: label });
        } catch (e: any) {
            alert("Generation Failed: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const addGeneratedToCanvas = () => {
        if (!genResult || !fabricCanvas) return;
        window.fabric.Image.fromURL(genResult.url, (img: any) => {
            img.scale(0.3);
            img.set({ left: 150, top: 150, name: genResult.prompt });
            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            setActiveModal(null);
            setGenResult(null);
        });
    };

    const downloadPNG = () => {
        if (!fabricCanvas) return;
        const dataURL = fabricCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `NEXUS-PROJECT-${Date.now()}.png`;
        a.click();
    };

    // --- UI COMPONENTS ---

    return (
        <div className="flex h-[calc(100vh-100px)] bg-nexus-bg-deep text-nexus-text font-sans overflow-hidden border border-nexus-border-light rounded-xl shadow-2xl">
            
            {/* SIDEBAR */}
            <div className="w-72 bg-nexus-panel border-r border-nexus-border-light flex flex-col">
                {/* Tools */}
                <div className="p-6 border-b border-nexus-border-light">
                    <h3 className="text-xs font-bold text-nexus-dim uppercase tracking-wider mb-4">Adicionar</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={addText} className="p-3 bg-nexus-bg-deep border border-nexus-border-light rounded hover:border-nexus-secondary flex flex-col items-center gap-1 transition-all">
                            <span className="text-xl">📝</span>
                            <span className="text-xs font-medium">Texto</span>
                        </button>
                        <label className="p-3 bg-nexus-bg-deep border border-nexus-border-light rounded hover:border-nexus-secondary flex flex-col items-center gap-1 transition-all cursor-pointer">
                            <span className="text-xl">🖼️</span>
                            <span className="text-xs font-medium">Imagem</span>
                            <input type="file" hidden accept="image/*" onChange={addImage} />
                        </label>
                        <button onClick={() => addShape('rect')} className="p-3 bg-nexus-bg-deep border border-nexus-border-light rounded hover:border-nexus-secondary flex flex-col items-center gap-1 transition-all">
                            <span className="text-xl">⬜</span>
                            <span className="text-xs font-medium">Retângulo</span>
                        </button>
                        <button onClick={() => addShape('circle')} className="p-3 bg-nexus-bg-deep border border-nexus-border-light rounded hover:border-nexus-secondary flex flex-col items-center gap-1 transition-all">
                            <span className="text-xl">⭕</span>
                            <span className="text-xs font-medium">Círculo</span>
                        </button>
                    </div>
                </div>

                {/* AI Generators */}
                <div className="p-6 border-b border-nexus-border-light">
                    <h3 className="text-xs font-bold text-nexus-secondary uppercase tracking-wider mb-4">Gerar com AI</h3>
                    <div className="space-y-2">
                        <button onClick={() => setActiveModal('title')} className="w-full py-3 bg-gradient-to-r from-nexus-secondary to-nexus-accent text-white rounded font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                            <span>📝</span> Título
                        </button>
                        <button onClick={() => setActiveModal('logo')} className="w-full py-3 bg-gradient-to-r from-nexus-secondary to-nexus-accent text-white rounded font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                            <span>🎨</span> Logo
                        </button>
                        <button onClick={() => setActiveModal('asset')} className="w-full py-3 bg-gradient-to-r from-nexus-secondary to-nexus-accent text-white rounded font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                            <span>⭐</span> Asset
                        </button>
                    </div>
                </div>

                {/* Layers */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <h3 className="text-xs font-bold text-nexus-dim uppercase tracking-wider mb-4">Camadas</h3>
                    <div className="space-y-1">
                        {layers.length === 0 && <div className="text-xs text-nexus-dim italic">Nenhuma camada</div>}
                        {layers.map((layer, i) => (
                            <div 
                                key={layer.id} 
                                onClick={() => selectLayer(i)}
                                className={`p-2 rounded text-xs font-medium cursor-pointer flex items-center gap-2 border transition-all ${
                                    layer.active ? 'bg-nexus-secondary/20 border-nexus-secondary text-nexus-secondary' : 'bg-nexus-bg-deep border-nexus-border-light hover:bg-nexus-surface text-nexus-dim'
                                }`}
                            >
                                <span>{layer.type === 'i-text' ? 'T' : layer.type === 'image' ? 'IMG' : 'OBJ'}</span>
                                <span className="truncate">{layer.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN CANVAS */}
            <div className="flex-1 relative bg-nexus-bg flex flex-col">
                {/* Toolbar */}
                <div className="h-14 bg-nexus-panel border-b border-nexus-border-light flex items-center justify-between px-6">
                    <div className="font-bold text-nexus-secondary flex items-center gap-4">
                        <span>🎨 NEXUS Editor</span>
                        <div className="h-4 w-px bg-nexus-border-light"></div>
                        <div className="flex gap-1">
                            <button onClick={handleUndo} disabled={historyStep <= 0} className="p-1.5 hover:bg-nexus-border-light rounded disabled:opacity-30" title="Undo">↩</button>
                            <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="p-1.5 hover:bg-nexus-border-light rounded disabled:opacity-30" title="Redo">↪</button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isGroupSelection && (
                            <button onClick={handleGroup} className="px-3 py-1.5 bg-nexus-border-light text-xs font-bold rounded hover:bg-nexus-secondary hover:text-white transition-colors mr-2">
                                {selectedType === 'group' ? 'UNGROUP' : 'GROUP'}
                            </button>
                        )}
                        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-nexus-border-light text-xs font-bold rounded hover:bg-nexus-secondary hover:text-white transition-colors">📂 LOAD</button>
                        <input type="file" ref={fileInputRef} onChange={loadProject} hidden accept=".json" />
                        
                        <button onClick={saveProject} className="px-3 py-1.5 bg-nexus-border-light text-xs font-bold rounded hover:bg-nexus-secondary hover:text-white transition-colors">💾 SAVE</button>
                        <button onClick={downloadPNG} className="px-3 py-1.5 bg-nexus-accent text-black text-xs font-bold rounded hover:bg-white transition-colors">EXPORT PNG</button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center" ref={containerRef}>
                    <div className="shadow-2xl">
                        <canvas ref={canvasRef} />
                    </div>
                    
                    {/* Zoom Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-nexus-panel border border-nexus-border-light rounded-full px-4 py-2 flex items-center gap-4 shadow-xl">
                        <button onClick={() => { setZoom(Math.max(0.1, zoom * 0.9)); fabricCanvas.setZoom(zoom * 0.9); }} className="hover:text-nexus-secondary font-bold text-lg">−</button>
                        <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => { setZoom(Math.min(5, zoom * 1.1)); fabricCanvas.setZoom(zoom * 1.1); }} className="hover:text-nexus-secondary font-bold text-lg">+</button>
                        <button onClick={() => { setZoom(1); fabricCanvas.setZoom(1); fabricCanvas.viewportTransform = [1,0,0,1,0,0]; }} className="hover:text-nexus-secondary text-xs font-bold">RESET</button>
                    </div>
                </div>
            </div>

            {/* PROPERTIES */}
            <div className="w-72 bg-nexus-panel border-l border-nexus-border-light p-6 overflow-y-auto">
                <h3 className="text-xs font-bold text-nexus-dim uppercase tracking-wider mb-6">Propriedades</h3>
                {selectedType ? (
                    <div className="space-y-6">
                        {/* Common Properties */}
                        <div>
                            <label className="block text-xs font-bold mb-2 flex justify-between">
                                <span>Opacidade</span>
                                <span className="font-mono text-nexus-dim">{Math.round(props.opacity * 100)}%</span>
                            </label>
                            <input 
                                type="range" min="0" max="1" step="0.01" 
                                value={props.opacity}
                                onChange={(e) => updateProp('opacity', parseFloat(e.target.value))}
                                className="w-full accent-nexus-secondary" 
                            />
                        </div>

                        {/* Image Specific */}
                        {selectedType === 'image' && (
                            <div className="space-y-4 pt-4 border-t border-nexus-border-light">
                                <h4 className="text-[10px] font-bold text-nexus-secondary uppercase tracking-wider">Ajustes de Imagem</h4>
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-nexus-dim">Brilho</label>
                                    <input 
                                        type="range" min="-1" max="1" step="0.05" 
                                        value={props.brightness}
                                        onChange={(e) => updateImageFilter('Brightness', parseFloat(e.target.value))}
                                        className="w-full accent-nexus-secondary" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-nexus-dim">Contraste</label>
                                    <input 
                                        type="range" min="-1" max="1" step="0.05" 
                                        value={props.contrast}
                                        onChange={(e) => updateImageFilter('Contrast', parseFloat(e.target.value))}
                                        className="w-full accent-nexus-secondary" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-nexus-dim">Saturação</label>
                                    <input 
                                        type="range" min="-1" max="1" step="0.05" 
                                        value={props.saturation}
                                        onChange={(e) => updateImageFilter('Saturation', parseFloat(e.target.value))}
                                        className="w-full accent-nexus-secondary" 
                                    />
                                </div>
                                <div className="pt-2">
                                    <button 
                                        onClick={handleRemoveBg}
                                        disabled={bgLoading}
                                        className="w-full py-2 bg-nexus-secondary/10 text-nexus-secondary border border-nexus-secondary rounded text-xs font-bold uppercase hover:bg-nexus-secondary hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {bgLoading ? (
                                            <>
                                                <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Processando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>✂️</span> Remover Fundo
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Text Specific */}
                        {selectedType === 'i-text' && (
                            <div className="space-y-4 pt-4 border-t border-nexus-border-light">
                                <h4 className="text-[10px] font-bold text-nexus-secondary uppercase tracking-wider">Tipografia</h4>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Fonte</label>
                                    <select 
                                        value={props.fontFamily}
                                        onChange={(e) => updateProp('fontFamily', e.target.value)}
                                        className="w-full bg-nexus-bg-deep border border-nexus-border-light rounded p-2 text-xs outline-none"
                                    >
                                        <option value="Inter">Inter</option>
                                        <option value="Arial">Arial</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Courier New">Courier New</option>
                                        <option value="Georgia">Georgia</option>
                                        <option value="Impact">Impact</option>
                                    </select>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold mb-1">Peso</label>
                                        <select 
                                            value={props.fontWeight}
                                            onChange={(e) => updateProp('fontWeight', e.target.value)}
                                            className="w-full bg-nexus-bg-deep border border-nexus-border-light rounded p-2 text-xs outline-none"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="bold">Bold</option>
                                            <option value="300">Light</option>
                                            <option value="800">Extra Bold</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold mb-1">Alinhamento</label>
                                        <select 
                                            value={props.textAlign}
                                            onChange={(e) => updateProp('textAlign', e.target.value)}
                                            className="w-full bg-nexus-bg-deep border border-nexus-border-light rounded p-2 text-xs outline-none"
                                        >
                                            <option value="left">Esq</option>
                                            <option value="center">Centro</option>
                                            <option value="right">Dir</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold mb-2">Tamanho</label>
                                    <input 
                                        type="number" 
                                        value={props.fontSize}
                                        onChange={(e) => updateProp('fontSize', parseInt(e.target.value))}
                                        className="w-full bg-nexus-bg-deep border border-nexus-border-light rounded p-2 text-xs text-nexus-text outline-none focus:border-nexus-secondary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold mb-2">Cor</label>
                                    <div className="flex gap-2 items-center bg-nexus-bg-deep p-2 rounded border border-nexus-border-light">
                                        <input 
                                            type="color" 
                                            value={props.fill}
                                            onChange={(e) => updateProp('fill', e.target.value)}
                                            className="w-8 h-8 bg-transparent border-none cursor-pointer"
                                        />
                                        <span className="text-xs font-mono text-nexus-dim">{props.fill}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Shape Properties */}
                        {(selectedType === 'rect' || selectedType === 'circle') && (
                            <div className="space-y-4 pt-4 border-t border-nexus-border-light">
                                <h4 className="text-[10px] font-bold text-nexus-secondary uppercase tracking-wider">Forma</h4>
                                <div>
                                    <label className="block text-xs font-bold mb-2">Cor de Preenchimento</label>
                                    <div className="flex gap-2 items-center bg-nexus-bg-deep p-2 rounded border border-nexus-border-light">
                                        <input 
                                            type="color" 
                                            value={props.fill}
                                            onChange={(e) => updateProp('fill', e.target.value)}
                                            className="w-8 h-8 bg-transparent border-none cursor-pointer"
                                        />
                                        <span className="text-xs font-mono text-nexus-dim">{props.fill}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-nexus-dim mt-10 text-sm flex flex-col items-center gap-2">
                        <span className="text-2xl opacity-30">👆</span>
                        <span>Selecione um elemento para editar</span>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-nexus-panel border border-nexus-border-light rounded-xl p-8 w-full max-w-lg shadow-2xl relative">
                        <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-nexus-dim hover:text-white">✕</button>
                        
                        {/* Title Generator */}
                        {activeModal === 'title' && (
                            <>
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">📝 Gerar Título</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-nexus-dim">TEXTO</label>
                                        <input className="w-full bg-nexus-bg-deep border border-nexus-border-light rounded p-3 text-white outline-none focus:border-nexus-secondary" value={titleForm.text} onChange={e => setTitleForm({...titleForm, text: e.target.value})} placeholder="Ex: Premium Design" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-nexus-dim">ESTILO</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['luxury', 'tech', 'bold', 'neon'].map(s => (
                                                <button key={s} onClick={() => setTitleForm({...titleForm, style: s})} className={`px-3 py-1 rounded text-xs border ${titleForm.style === s ? 'bg-nexus-secondary border-nexus-secondary text-white' : 'border-nexus-border-light text-nexus-dim'}`}>{s.toUpperCase()}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-nexus-dim">TAMANHO</label>
                                            <select 
                                                className="w-full bg-nexus-bg-deep border border-nexus-border-light rounded p-2 text-xs text-white outline-none"
                                                value={titleForm.size}
                                                onChange={e => setTitleForm({...titleForm, size: e.target.value})}
                                            >
                                                <option value="medium">Médio</option>
                                                <option value="large">Grande</option>
                                                <option value="huge">Enorme</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-nexus-dim">FUNDO</label>
                                            <select 
                                                className="w-full bg-nexus-bg-deep border border-nexus-border-light rounded p-2 text-xs text-white outline-none"
                                                value={titleForm.bg}
                                                onChange={e => setTitleForm({...titleForm, bg: e.target.value})}
                                            >
                                                <option value="transparent">Transparente</option>
                                                <option value="white">Branco</option>
                                                <option value="black">Preto</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-nexus-dim">EXTRAS (GEMINI)</label>
                                        <textarea className="w-full bg-nexus-bg-deep border border-nexus-border-light rounded p-3 text-white h-20 outline-none focus:border-nexus-secondary" value={titleForm.desc} onChange={e => setTitleForm({...titleForm, desc: e.target.value})} placeholder="Ex: Sombra dourada, efeito de vidro..." />
                                    </div>
                                    <button onClick={() => handleGenerate('title')} disabled={isGenerating} className="w-full py-3 bg-gradient-to-r from-nexus-secondary to-nexus-accent rounded font-bold hover:shadow-lg transition-all mt-2 flex justify-center items-center gap-2 disabled:opacity-50 text-white">
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>GERANDO...</span>
                                            </>
                                        ) : '✨ GERAR TÍTULO'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Logo Generator */}
                        {activeModal === 'logo' && (
                            <>
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">🎨 Gerar Logo</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-nexus-dim">MARCA</label>
                                        <input className="w-full bg-nexus-bg-deep border border-nexus-border-light rounded p-3 text-white outline-none focus:border-nexus-secondary" value={logoForm.brand} onChange={e => setLogoForm({...logoForm, brand: e.target.value})} placeholder="Ex: TechFlow" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-nexus-dim">ESTILO</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['minimal', 'corporate', 'creative', 'tech'].map(s => (
                                                <button key={s} onClick={() => setLogoForm({...logoForm, style: s})} className={`px-3 py-1 rounded text-xs border ${logoForm.style === s ? 'bg-nexus-secondary border-nexus-secondary text-white' : 'border-nexus-border-light text-nexus-dim'}`}>{s.toUpperCase()}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input className="bg-nexus-bg-deep border border-nexus-border-light rounded p-3 text-white text-sm outline-none" value={logoForm.industry} onChange={e => setLogoForm({...logoForm, industry: e.target.value})} placeholder="Indústria" />
                                        <input type="color" className="w-full h-12 bg-transparent cursor-pointer border border-nexus-border-light rounded" value={logoForm.color} onChange={e => setLogoForm({...logoForm, color: e.target.value})} />
                                    </div>
                                    <button onClick={() => handleGenerate('logo')} disabled={isGenerating} className="w-full py-3 bg-gradient-to-r from-nexus-secondary to-nexus-accent rounded font-bold hover:shadow-lg transition-all mt-2 flex justify-center items-center gap-2 disabled:opacity-50 text-white">
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>GERANDO...</span>
                                            </>
                                        ) : '✨ GERAR LOGO'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Asset Generator */}
                        {activeModal === 'asset' && (
                            <>
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">⭐ Gerar Asset</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-nexus-dim">TIPO</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['icon', 'shape', 'element', 'pattern'].map(t => (
                                                <button key={t} onClick={() => setAssetForm({...assetForm, type: t})} className={`px-3 py-1 rounded text-xs border ${assetForm.type === t ? 'bg-nexus-secondary border-nexus-secondary text-white' : 'border-nexus-border-light text-nexus-dim'}`}>{t.toUpperCase()}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-nexus-dim">DESCRIÇÃO</label>
                                        <textarea className="w-full bg-nexus-bg-deep border border-nexus-border-light rounded p-3 text-white h-24 outline-none focus:border-nexus-secondary" value={assetForm.desc} onChange={e => setAssetForm({...assetForm, desc: e.target.value})} placeholder="Ex: Ícone de foguete minimalista 3d..." />
                                    </div>
                                    <button onClick={() => handleGenerate('asset')} disabled={isGenerating} className="w-full py-3 bg-gradient-to-r from-nexus-secondary to-nexus-accent rounded font-bold hover:shadow-lg transition-all mt-2 flex justify-center items-center gap-2 disabled:opacity-50 text-white">
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>GERANDO...</span>
                                            </>
                                        ) : '✨ GERAR ASSET'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* RESULT PREVIEW */}
                        {isGenerating && (
                            <div className="mt-6 text-center">
                                <p className="text-xs text-nexus-dim animate-pulse">Criando com Gemini 2.0...</p>
                            </div>
                        )}

                        {genResult && !isGenerating && (
                            <div className="mt-6 pt-6 border-t border-nexus-border-light">
                                <h4 className="text-xs font-bold text-nexus-secondary mb-3 uppercase">Resultado Gerado</h4>
                                <div className="relative group cursor-pointer border border-nexus-border-light hover:border-nexus-secondary rounded-lg overflow-hidden transition-all" onClick={addGeneratedToCanvas}>
                                    <img src={genResult.url} alt="Result" className="w-full h-48 object-contain bg-nexus-bg-deep" />
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="font-bold text-white text-sm">➕ CLIQUE PARA ADICIONAR</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveEditor;
