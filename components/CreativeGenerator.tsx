
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveEditorService } from '../liveEditorService';
import { SceneLayer } from '../types';
import { PerfectCutoutEngine } from '../perfectCutout';

// Ensure Fabric is available globally
declare global {
    interface Window {
        fabric: any;
    }
}

// Simple throttle function for UI updates
const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
};

const CreativeGenerator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<any>(null);
    
    const [activeTool, setActiveTool] = useState<'title' | 'logo' | 'asset' | 'mascot' | 'layers' | 'text'>('asset');
    const [loading, setLoading] = useState(false);
    const [zoom, setZoom] = useState(1);
    
    // Mobile View States - Drawers
    const [showTools, setShowTools] = useState(false);
    const [showProps, setShowProps] = useState(false);

    // Right Sidebar Tabs
    const [activeRightTab, setActiveRightTab] = useState<'props' | 'layers'>('props');
    const [layers, setLayers] = useState<any[]>([]);

    // Drag & Drop State
    const [draggedLayerIndex, setDraggedLayerIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [dragPosition, setDragPosition] = useState<'top' | 'bottom' | 'center' | null>(null);

    // Initial state check for desktop
    useEffect(() => {
        if (window.innerWidth >= 1024) {
            setShowTools(true);
            setShowProps(true);
        }
    }, []);

    // Forms
    const [forms, setForms] = useState({
        title: { text: 'Nexus', style: 'Neon', size: 'Large', bg: 'transparent', desc: '' },
        logo: { brand: 'Tech', style: 'Minimal', industry: 'AI', color: '#00f0ff', inspiration: '' },
        asset: { type: 'Icon', desc: 'Cyberpunk sword', style: '3D Render', transparent: true },
        mascot: { role: 'Assistant', archetype: 'Friendly', expression: 'Happy' },
        scene: { prompt: 'Cyberpunk city street at night', style: 'Realistic' },
        text: { content: 'Novo Texto', fontFamily: 'Inter', color: '#ffffff', fontSize: 60 }
    });

    // Selection State for Properties Panel
    const [selectedObj, setSelectedObj] = useState<any>(null);

    // Throttled Zoom State Update to prevent UI lag during scroll
    const updateZoomState = useCallback(throttle((val: number) => {
        setZoom(val);
    }, 100), []);

    // Helper to update layers list from canvas
    const updateLayers = useCallback(() => {
        if (!fabricCanvas) return;
        const objs = fabricCanvas.getObjects();
        // Fabric renders from index 0 (bottom) to N (top). 
        // We want to list them Top (N) to Bottom (0).
        setLayers([...objs].reverse().map(o => ({
            type: o.type,
            name: o.name || o.type,
            ref: o
        })));
    }, [fabricCanvas]);

    // ═══════════════════════════════════════════════════════════
    // CANVAS INITIALIZATION (FIGMA STYLE)
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current || !window.fabric) return;

        const canvas = new window.fabric.Canvas(canvasRef.current, {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
            backgroundColor: '#0a0a10', // Nexus Panel Color
            preserveObjectStacking: true,
            selection: true,
            renderOnAddRemove: false, // OPTIMIZATION
            enableRetinaScaling: true // High Quality
        });

        // Infinite Grid Background
        const gridSize = 40;
        const gridCanvas = document.createElement('canvas');
        gridCanvas.width = gridSize;
        gridCanvas.height = gridSize;
        const gridCtx = gridCanvas.getContext('2d');
        if (gridCtx) {
            gridCtx.fillStyle = '#0a0a10';
            gridCtx.fillRect(0, 0, gridSize, gridSize);
            gridCtx.fillStyle = '#151b2e'; // Dot color
            gridCtx.fillRect(gridSize / 1.5 - 1, gridSize / 1.5 - 1, 2, 2);
        }
        canvas.setBackgroundColor(new window.fabric.Pattern({ source: gridCanvas, repeat: 'repeat' }), () => canvas.requestRenderAll());

        setFabricCanvas(canvas);

        // Events
        const handleSelection = () => {
            const active = canvas.getActiveObject();
            if (active) {
                // Clone attributes for UI state to avoid reference issues
                setSelectedObj({ ...active });
                if (window.innerWidth < 1024) {
                    setShowProps(true); // Auto-open props on mobile when selected
                    setShowTools(false);
                }
            } else {
                setSelectedObj(null);
            }
        };

        const handleUpdateLayers = () => {
            const objs = canvas.getObjects();
            setLayers([...objs].reverse().map(o => ({
                type: o.type,
                name: o.name || o.type,
                ref: o
            })));
        };

        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', () => {
            setSelectedObj(null);
        });
        
        // Layer Sync Events
        canvas.on('object:added', handleUpdateLayers);
        canvas.on('object:removed', handleUpdateLayers);
        canvas.on('object:modified', handleUpdateLayers);

        // Zoom/Pan
        canvas.on('mouse:wheel', (opt: any) => {
            if (opt.e.ctrlKey || opt.e.metaKey) {
                opt.e.preventDefault();
                opt.e.stopPropagation();
                let delta = opt.e.deltaY;
                let z = canvas.getZoom();
                z *= 0.999 ** delta;
                if (z > 10) z = 10;
                if (z < 0.1) z = 0.1;
                canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, z);
                updateZoomState(z);
            }
        });

        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current) {
                canvas.setWidth(containerRef.current.clientWidth);
                canvas.setHeight(containerRef.current.clientHeight);
                canvas.requestRenderAll();
            }
        });
        resizeObserver.observe(containerRef.current);

        return () => {
            canvas.dispose();
            resizeObserver.disconnect();
        };
    }, []);

    // ═══════════════════════════════════════════════════════════
    // ZOOM CONTROLS
    // ═══════════════════════════════════════════════════════════

    const handleZoomIn = () => {
        if (!fabricCanvas) return;
        let z = fabricCanvas.getZoom();
        z *= 1.2;
        if (z > 10) z = 10;
        const center = { x: fabricCanvas.width / 2, y: fabricCanvas.height / 2 };
        fabricCanvas.zoomToPoint(center, z);
        setZoom(z);
        fabricCanvas.requestRenderAll();
    };

    const handleZoomOut = () => {
        if (!fabricCanvas) return;
        let z = fabricCanvas.getZoom();
        z /= 1.2;
        if (z < 0.1) z = 0.1;
        const center = { x: fabricCanvas.width / 2, y: fabricCanvas.height / 2 };
        fabricCanvas.zoomToPoint(center, z);
        setZoom(z);
        fabricCanvas.requestRenderAll();
    };

    const handleResetZoom = () => {
        if (!fabricCanvas) return;
        fabricCanvas.setZoom(1);
        fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        setZoom(1);
        fabricCanvas.requestRenderAll();
    };

    // ═══════════════════════════════════════════════════════════
    // LAYER MANAGEMENT & DND
    // ═══════════════════════════════════════════════════════════

    const handleGroup = () => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (!active) return;

        if (active.type === 'activeSelection') {
            active.toGroup();
            fabricCanvas.requestRenderAll();
            updateLayers();
            setSelectedObj(fabricCanvas.getActiveObject());
        } else if (active.type === 'group') {
            active.toActiveSelection();
            fabricCanvas.requestRenderAll();
            updateLayers();
            setSelectedObj(fabricCanvas.getActiveObject());
        }
    };

    const handleLayerOrder = (action: 'front' | 'back' | 'forward' | 'backward') => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (!active) return;
        
        switch(action) {
            case 'front': active.bringToFront(); break;
            case 'back': active.sendToBack(); break;
            case 'forward': active.bringForward(); break;
            case 'backward': active.sendBackwards(); break;
        }
        
        fabricCanvas.requestRenderAll();
        updateLayers();
    };

    const handleSelectLayer = (obj: any) => {
        if (!fabricCanvas) return;
        fabricCanvas.setActiveObject(obj);
        fabricCanvas.requestRenderAll();
    };

    // Drag and Drop Logic
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedLayerIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Optional: Set custom drag image or styling
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); // Allow dropping
        if (draggedLayerIndex === null || draggedLayerIndex === index) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;

        // Zones: Top 25%, Center 50% (Group), Bottom 25%
        if (y < height * 0.25) setDragPosition('top');
        else if (y > height * 0.75) setDragPosition('bottom');
        else setDragPosition('center');

        setDragOverIndex(index);
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
        setDragPosition(null);
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        
        if (draggedLayerIndex === null || !fabricCanvas) {
            setDragOverIndex(null);
            setDragPosition(null);
            return;
        }

        const draggedItem = layers[draggedLayerIndex];
        const targetItem = layers[targetIndex];
        const draggedObj = draggedItem.ref;
        const targetObj = targetItem.ref;

        // 1. Grouping Logic (Drop on Center)
        if (dragPosition === 'center') {
            // Unselect everything first
            fabricCanvas.discardActiveObject();
            
            // Create selection with both objects
            const sel = new window.fabric.ActiveSelection([targetObj, draggedObj], {
                canvas: fabricCanvas
            });
            fabricCanvas.setActiveObject(sel);
            
            // Convert to group
            sel.toGroup();
            
            // Clean up
            fabricCanvas.requestRenderAll();
            updateLayers();
        } 
        // 2. Reordering Logic
        else {
            // Create a new visual list order
            const newOrder = [...layers];
            const [removed] = newOrder.splice(draggedLayerIndex, 1);
            
            // Determine where to insert based on "target layer's new index"
            // Note: targetIndex in `layers` (visual list) matches the index in `newOrder` 
            // if draggedIndex > targetIndex (moved up). If moved down, target shifted.
            
            // Simplest way: Find targetItem in new list and insert before/after
            const newTargetIdx = newOrder.indexOf(targetItem);
            
            if (dragPosition === 'top') {
                newOrder.splice(newTargetIdx, 0, removed);
            } else {
                newOrder.splice(newTargetIdx + 1, 0, removed);
            }

            // Sync Fabric Z-Indices to match new Visual Order
            // Visual Order: [Top (N), ..., Bottom (0)]
            // Fabric Order: [Bottom (0), ..., Top (N)]
            
            const total = newOrder.length;
            newOrder.forEach((layer, visualIdx) => {
                // Fabric Z-Index corresponding to Visual Index
                const fabricZ = total - 1 - visualIdx;
                layer.ref.moveTo(fabricZ);
            });
            
            fabricCanvas.requestRenderAll();
            updateLayers();
        }

        setDraggedLayerIndex(null);
        setDragOverIndex(null);
        setDragPosition(null);
    };

    // ═══════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════

    const addText = () => {
        if (!fabricCanvas) return;
        const iText = new window.fabric.IText(forms.text.content, {
            left: fabricCanvas.width / 2,
            top: fabricCanvas.height / 2,
            fontFamily: forms.text.fontFamily,
            fill: forms.text.color,
            fontSize: forms.text.fontSize,
            originX: 'center',
            originY: 'center',
            name: forms.text.content
        });
        fabricCanvas.add(iText);
        fabricCanvas.setActiveObject(iText);
        fabricCanvas.requestRenderAll();
        updateLayers();
    };

    const addToCanvas = (url: string, name: string = 'AI Asset') => {
        if (!fabricCanvas) return;
        
        window.fabric.Image.fromURL(url, (img: any) => {
            const maxSize = 400;
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            
            img.set({
                left: fabricCanvas.width / 2 - (img.width * scale) / 2,
                top: fabricCanvas.height / 2 - (img.height * scale) / 2,
                scaleX: scale,
                scaleY: scale,
                cornerStyle: 'circle',
                cornerColor: '#00f0ff',
                borderColor: '#00f0ff',
                transparentCorners: false,
                name: name
            });
            
            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.requestRenderAll();
        });
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            let url = '';
            let label = '';

            if (activeTool === 'title') {
                url = await LiveEditorService.generateTitle(forms.title.text, forms.title.style, forms.title.size, forms.title.bg, forms.title.desc);
                label = `Title: ${forms.title.text}`;
            } else if (activeTool === 'logo') {
                url = await LiveEditorService.generateLogo(forms.logo.brand, forms.logo.style, forms.logo.industry, forms.logo.color, forms.logo.inspiration);
                label = `Logo: ${forms.logo.brand}`;
            } else if (activeTool === 'asset') {
                url = await LiveEditorService.generateAsset(forms.asset.type, forms.asset.desc, forms.asset.style);
                label = `Asset: ${forms.asset.desc}`;
            } else if (activeTool === 'mascot') {
                url = await LiveEditorService.generateMascot(forms.mascot.role, forms.mascot.archetype, forms.mascot.expression);
                label = `Mascot: ${forms.mascot.role}`;
            } else if (activeTool === 'layers') {
                const layers = await LiveEditorService.generateLayeredScene(forms.scene.prompt, forms.scene.style);
                layers.forEach((layer, index) => {
                    setTimeout(() => addToCanvas(layer.url, layer.name), index * 100);
                });
                setLoading(false);
                return;
            }

            if (url) addToCanvas(url, label);

        } catch (e: any) {
            alert(`Erro no Gerador: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const updateProperty = (prop: string, value: any) => {
        if (!fabricCanvas || !selectedObj) return;
        
        selectedObj.set(prop, value);
        
        if (prop === 'fontFamily' || prop === 'text') {
             fabricCanvas.requestRenderAll();
        } else {
             selectedObj.setCoords();
             fabricCanvas.requestRenderAll();
        }
        
        // Update UI state
        setSelectedObj({ ...selectedObj });
    };

    const deleteSelected = () => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (!active) return;

        if (active.type === 'activeSelection') {
            active.forEachObject((obj: any) => fabricCanvas.remove(obj));
            fabricCanvas.discardActiveObject();
        } else {
            fabricCanvas.remove(active);
        }
        fabricCanvas.requestRenderAll();
        setSelectedObj(null);
    };

    const downloadCanvas = () => {
        if (!fabricCanvas) return;
        const dataURL = fabricCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
        const link = document.createElement('a');
        link.download = `NEXUS-STUDIO-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRemoveBackground = async () => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (!active || active.type !== 'image') return;

        setLoading(true);
        try {
            // @ts-ignore
            const src = active.getSrc();
            const cutout = await PerfectCutoutEngine.process(src);
            
            // @ts-ignore
            active.setSrc(cutout, () => {
                // @ts-ignore
                active.set('hasTransparentBg', true);
                fabricCanvas.renderAll();
                updateLayers();
                setSelectedObj({ ...active.toObject(), hasTransparentBg: true, type: active.type });
                setLoading(false);
            });
        } catch (e: any) {
            console.error(e);
            alert("Erro ao remover fundo: " + e.message);
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════

    return (
        <div className="flex flex-col lg:flex-row h-full w-full border border-nexus-border rounded-xl overflow-hidden bg-nexus-bg-deep shadow-2xl animate-in fade-in duration-500 relative">
            
            {/* 1. LEFT SIDEBAR: GENERATOR TOOLS */}
            <div className={`
                fixed inset-y-0 left-0 z-30 w-80 bg-nexus-panel border-r border-nexus-border transform transition-transform duration-300 ease-out shadow-2xl lg:shadow-none lg:relative lg:transform-none
                ${showTools ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 border-b border-nexus-border flex justify-between items-center bg-nexus-panel sticky top-0 z-10">
                    <h2 className="text-sm font-black text-nexus-accent tracking-widest uppercase flex items-center gap-2">
                        <span>⚡</span> Gerador Neural
                    </h2>
                    <button onClick={() => setShowTools(false)} className="lg:hidden text-nexus-dim hover:text-white p-2">✕</button>
                </div>

                <div className="flex p-2 gap-1 overflow-x-auto scrollbar-hide border-b border-nexus-border bg-nexus-bg/50">
                    {[{ id: 'asset', icon: '⭐', label: 'Asset' }, { id: 'title', icon: '✨', label: 'AI Title' }, { id: 'text', icon: 'T', label: 'Texto' }, { id: 'logo', icon: '🎨', label: 'Logo' }, { id: 'mascot', icon: '🤖', label: 'Mascot' }, { id: 'layers', icon: '🥞', label: 'Cenário' }].map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id as any)}
                            className={`flex-shrink-0 px-3 py-2 rounded text-[10px] font-bold uppercase transition-all ${activeTool === tool.id ? 'bg-nexus-accent text-black' : 'text-nexus-dim hover:text-white hover:bg-white/5'}`}
                        >
                            {tool.icon} {tool.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-100px)]">
                    
                    {/* --- TEXT TOOL --- */}
                    {activeTool === 'text' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-nexus-dim font-mono uppercase block mb-1">Conteúdo</label>
                                <textarea 
                                    className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white h-24 outline-none resize-none focus:border-nexus-accent" 
                                    value={forms.text.content}
                                    onChange={e => setForms({...forms, text: {...forms.text, content: e.target.value}})}
                                    placeholder="Digite seu texto..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-nexus-dim font-mono uppercase block mb-1">Fonte</label>
                                    <select 
                                        className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white outline-none"
                                        value={forms.text.fontFamily}
                                        onChange={e => setForms({...forms, text: {...forms.text, fontFamily: e.target.value}})}
                                    >
                                        <option value="Inter">Inter</option>
                                        <option value="Arial">Arial</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Courier New">Courier New</option>
                                        <option value="Impact">Impact</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-nexus-dim font-mono uppercase block mb-1">Cor</label>
                                    <div className="flex items-center gap-2 bg-nexus-bg border border-nexus-border rounded p-1">
                                        <input 
                                            type="color" 
                                            className="w-full h-6 bg-transparent border-none cursor-pointer"
                                            value={forms.text.color}
                                            onChange={e => setForms({...forms, text: {...forms.text, color: e.target.value}})}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={addText} 
                                className="w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest bg-white text-black hover:bg-nexus-accent transition-all mt-2"
                            >
                                + Adicionar Texto
                            </button>
                        </div>
                    )}

                    {/* Tool Forms */}
                    {activeTool === 'asset' && (
                        <>
                            <div>
                                <label className="text-[10px] text-nexus-dim font-mono uppercase">Tipo</label>
                                <select className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white outline-none" value={forms.asset.type} onChange={e => setForms({...forms, asset: {...forms.asset, type: e.target.value}})}>
                                    <option>Icon</option>
                                    <option>Shape</option>
                                    <option>Texture</option>
                                    <option>UI Element</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-nexus-dim font-mono uppercase">Descrição</label>
                                <textarea className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white h-24 outline-none resize-none" value={forms.asset.desc} onChange={e => setForms({...forms, asset: {...forms.asset, desc: e.target.value}})} placeholder="Ex: Espada de plasma azul brilhante..." />
                            </div>
                            <div>
                                <label className="text-[10px] text-nexus-dim font-mono uppercase">Estilo</label>
                                <select className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white outline-none" value={forms.asset.style} onChange={e => setForms({...forms, asset: {...forms.asset, style: e.target.value}})}>
                                    <option>3D Render</option>
                                    <option>Flat Design</option>
                                    <option>Neon Glow</option>
                                    <option>Realistic</option>
                                </select>
                            </div>
                        </>
                    )}
                    {/* (Other forms preserved) */}
                    {activeTool === 'title' && (
                        <div>
                            <label className="text-[10px] text-nexus-dim font-mono uppercase">Texto</label>
                            <input className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white outline-none mb-2" value={forms.title.text} onChange={e => setForms({...forms, title: {...forms.title, text: e.target.value}})} />
                            <label className="text-[10px] text-nexus-dim font-mono uppercase">Estilo</label>
                            <select className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white outline-none" value={forms.title.style} onChange={e => setForms({...forms, title: {...forms.title, style: e.target.value}})}>
                                <option>Neon</option><option>Metal</option><option>Liquid</option>
                            </select>
                        </div>
                    )}

                    {activeTool !== 'text' && (
                        <button 
                            onClick={() => { handleGenerate(); if(window.innerWidth < 1024) setShowTools(false); }} 
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all mt-4 flex justify-center items-center gap-2
                                ${loading ? 'bg-nexus-bg border border-nexus-border text-nexus-dim cursor-not-allowed' : 'bg-gradient-to-r from-nexus-secondary to-nexus-accent text-white hover:shadow-glow'}
                            `}
                        >
                            {loading ? 'SINTETIZANDO...' : '✨ GERAR & COLOCAR'}
                        </button>
                    )}
                </div>
            </div>

            {/* Backdrop for Tools Mobile */}
            {showTools && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setShowTools(false)}></div>}

            {/* 2. CENTER: INFINITE CANVAS */}
            <div className="flex-1 relative bg-[#0a0a10] flex flex-col min-w-0 h-full">
                {/* Mobile Header Bar */}
                <div className="h-12 border-b border-nexus-border flex items-center justify-between px-4 bg-nexus-panel z-10 lg:hidden">
                    <button onClick={() => setShowTools(true)} className="p-2 text-nexus-accent border border-nexus-accent/30 rounded bg-nexus-accent/10">⚡ TOOLS</button>
                    <div className="text-xs font-bold text-white">NEXUS CANVAS</div>
                    <button onClick={() => setShowProps(true)} className={`p-2 text-white border border-white/20 rounded ${!selectedObj ? 'opacity-50' : 'bg-white/10'}`}>
                        {activeRightTab === 'props' ? '⚙️' : '🥞'}
                    </button>
                </div>

                {/* Desktop Header */}
                <div className="hidden lg:flex h-10 border-b border-nexus-border items-center justify-between px-4 bg-nexus-panel z-10">
                    <div className="text-xs text-nexus-dim font-mono">ESTÚDIO VIVO v2.0</div>
                    <div className="flex items-center gap-2 ml-auto">
                        <button onClick={downloadCanvas} className="text-[10px] bg-nexus-accent text-black px-3 py-1 rounded font-bold hover:bg-white transition-colors">SALVAR PNG</button>
                    </div>
                </div>
                
                <div ref={containerRef} className="flex-1 relative overflow-hidden touch-none">
                    <canvas ref={canvasRef} />
                    
                    {/* FLOATING ZOOM CONTROLS (Mobile Optimized) */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-nexus-panel/90 backdrop-blur border border-nexus-border rounded-full px-4 py-2 shadow-2xl z-10 pointer-events-auto">
                        <button onClick={handleResetZoom} className="text-nexus-dim hover:text-white text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</button>
                        <div className="w-px h-4 bg-nexus-border mx-1"></div>
                        <button onClick={handleZoomOut} className="text-nexus-dim hover:text-white p-2">➖</button>
                        <button onClick={handleZoomIn} className="text-nexus-dim hover:text-white p-2">➕</button>
                    </div>
                </div>
            </div>

            {/* 3. RIGHT SIDEBAR: PROPERTIES & LAYERS */}
            <div className={`
                fixed inset-y-0 right-0 z-30 w-72 bg-nexus-panel border-l border-nexus-border transform transition-transform duration-300 ease-out shadow-2xl lg:shadow-none lg:relative lg:transform-none flex flex-col
                ${showProps ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {/* Header with Tabs */}
                <div className="h-12 border-b border-nexus-border flex bg-nexus-bg/50">
                    <button 
                        onClick={() => setActiveRightTab('props')} 
                        className={`flex-1 text-[10px] font-bold uppercase tracking-wider transition-all ${activeRightTab === 'props' ? 'bg-nexus-panel text-nexus-accent border-b-2 border-nexus-accent' : 'text-nexus-dim hover:text-white'}`}
                    >
                        Propriedades
                    </button>
                    <button 
                        onClick={() => setActiveRightTab('layers')} 
                        className={`flex-1 text-[10px] font-bold uppercase tracking-wider transition-all ${activeRightTab === 'layers' ? 'bg-nexus-panel text-nexus-secondary border-b-2 border-nexus-secondary' : 'text-nexus-dim hover:text-white'}`}
                    >
                        Camadas ({layers.length})
                    </button>
                    <button onClick={() => setShowProps(false)} className="lg:hidden w-10 text-nexus-dim hover:text-white border-l border-nexus-border">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    
                    {/* PROPERTIES TAB */}
                    {activeRightTab === 'props' && (
                        <>
                            {selectedObj ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-white font-bold truncate max-w-[100px]">{selectedObj.type}</span>
                                        <button onClick={deleteSelected} className="text-xs text-red-500 hover:text-red-400 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/10">Excluir</button>
                                    </div>

                                    {/* Opacity */}
                                    <div className="bg-nexus-bg p-3 rounded border border-nexus-border">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] text-nexus-dim font-bold uppercase">Opacidade</label>
                                            <div className="flex items-center gap-1">
                                                <input 
                                                    type="number" 
                                                    min="0" max="100" 
                                                    value={Math.round((selectedObj.opacity ?? 1) * 100)}
                                                    onChange={e => updateProperty('opacity', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100)}
                                                    className="w-10 bg-transparent text-right text-xs text-white font-mono outline-none border-b border-transparent focus:border-nexus-accent"
                                                />
                                                <span className="text-[10px] text-nexus-dim">%</span>
                                            </div>
                                        </div>
                                        <input 
                                            type="range" min="0" max="1" step="0.01" 
                                            value={selectedObj.opacity ?? 1} 
                                            onChange={e => updateProperty('opacity', parseFloat(e.target.value))}
                                            className="w-full accent-nexus-accent h-2 bg-nexus-panel rounded-full appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Scale */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-nexus-bg p-2 rounded border border-nexus-border">
                                            <label className="text-[9px] text-nexus-dim block">W</label>
                                            <div className="text-xs text-white font-mono">{Math.round(selectedObj.width * selectedObj.scaleX)}</div>
                                        </div>
                                        <div className="bg-nexus-bg p-2 rounded border border-nexus-border">
                                            <label className="text-[9px] text-nexus-dim block">H</label>
                                            <div className="text-xs text-white font-mono">{Math.round(selectedObj.height * selectedObj.scaleY)}</div>
                                        </div>
                                    </div>

                                    {/* IMAGE SPECIFIC PROPERTIES */}
                                    {selectedObj.type === 'image' && (
                                        <div className="space-y-4 pt-4 border-t border-nexus-border">
                                            <h4 className="text-[10px] font-bold text-nexus-accent uppercase">Imagem</h4>
                                            
                                            <button 
                                                onClick={handleRemoveBackground}
                                                disabled={loading}
                                                className="w-full py-2 bg-nexus-bg border border-nexus-border text-white hover:border-nexus-accent rounded text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2"
                                            >
                                                {loading ? 'Processando...' : (
                                                    <>
                                                        <span>✂️</span> Remover Fundo
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* TEXT SPECIFIC PROPERTIES */}
                                    {selectedObj.type === 'i-text' && (
                                        <div className="space-y-4 pt-4 border-t border-nexus-border">
                                            <h4 className="text-[10px] font-bold text-nexus-accent uppercase">Texto</h4>
                                            
                                            {/* Content */}
                                            <div>
                                                <label className="text-[9px] text-nexus-dim block mb-1">Conteúdo</label>
                                                <textarea 
                                                    value={selectedObj.text} 
                                                    onChange={(e) => updateProperty('text', e.target.value)}
                                                    className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white focus:border-nexus-accent outline-none"
                                                />
                                            </div>

                                            {/* Font Family */}
                                            <div>
                                                <label className="text-[9px] text-nexus-dim block mb-1">Fonte</label>
                                                <select 
                                                    value={selectedObj.fontFamily}
                                                    onChange={(e) => updateProperty('fontFamily', e.target.value)}
                                                    className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white focus:border-nexus-accent outline-none"
                                                >
                                                    <option value="Inter">Inter</option>
                                                    <option value="Arial">Arial</option>
                                                    <option value="Times New Roman">Times New Roman</option>
                                                    <option value="Courier New">Courier New</option>
                                                    <option value="Impact">Impact</option>
                                                </select>
                                            </div>

                                            {/* Size & Color */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[9px] text-nexus-dim block mb-1">Tamanho</label>
                                                    <input 
                                                        type="number" 
                                                        value={selectedObj.fontSize}
                                                        onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
                                                        className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white focus:border-nexus-accent outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-nexus-dim block mb-1">Cor</label>
                                                    <div className="flex items-center gap-2 bg-nexus-bg border border-nexus-border rounded p-1">
                                                        <input 
                                                            type="color" 
                                                            value={selectedObj.fill}
                                                            onChange={(e) => updateProperty('fill', e.target.value)}
                                                            className="w-6 h-6 bg-transparent border-none cursor-pointer"
                                                        />
                                                        <span className="text-[9px] font-mono text-nexus-dim">{selectedObj.fill}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Group/Ungroup Button (Quick Access) */}
                                    {(selectedObj.type === 'activeSelection' || selectedObj.type === 'group') && (
                                        <button 
                                            onClick={handleGroup}
                                            className="w-full py-2 bg-nexus-bg border border-nexus-border text-nexus-dim hover:text-white hover:border-nexus-accent rounded text-xs font-bold uppercase transition-colors"
                                        >
                                            {selectedObj.type === 'group' ? 'Desagrupar' : 'Agrupar'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center mt-10">
                                    <span className="text-2xl opacity-20 block mb-2">👆</span>
                                    <p className="text-xs text-nexus-dim">Selecione um objeto no palco.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* LAYERS TAB */}
                    {activeRightTab === 'layers' && (
                        <div className="space-y-4">
                            {/* Layer Actions */}
                            <div className="grid grid-cols-4 gap-1 mb-4">
                                <button onClick={() => handleLayerOrder('front')} className="p-2 bg-nexus-bg border border-nexus-border rounded hover:bg-white/5 text-[10px]" title="Trazer para frente">🔝</button>
                                <button onClick={() => handleLayerOrder('forward')} className="p-2 bg-nexus-bg border border-nexus-border rounded hover:bg-white/5 text-[10px]" title="Avançar">⬆</button>
                                <button onClick={() => handleLayerOrder('backward')} className="p-2 bg-nexus-bg border border-nexus-border rounded hover:bg-white/5 text-[10px]" title="Recuar">⬇</button>
                                <button onClick={() => handleLayerOrder('back')} className="p-2 bg-nexus-bg border border-nexus-border rounded hover:bg-white/5 text-[10px]" title="Enviar para trás">🔚</button>
                            </div>

                            {/* Grouping Actions */}
                            <div className="flex gap-2 mb-4">
                                <button 
                                    onClick={handleGroup}
                                    disabled={!selectedObj || (selectedObj.type !== 'activeSelection' && selectedObj.type !== 'group')}
                                    className="flex-1 py-2 bg-nexus-bg border border-nexus-border rounded text-xs font-bold text-nexus-dim hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {selectedObj?.type === 'group' ? 'UNGROUP' : 'GROUP'}
                                </button>
                            </div>

                            {/* Layer List */}
                            <div className="space-y-1">
                                {layers.length === 0 && <p className="text-xs text-nexus-dim text-center py-4">Canvas vazio</p>}
                                {layers.map((layer, idx) => (
                                    <div 
                                        key={idx}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        onClick={() => handleSelectLayer(layer.ref)}
                                        className={`
                                            p-2 rounded border cursor-pointer flex items-center gap-2 text-xs transition-all relative
                                            ${selectedObj && selectedObj.name === layer.name 
                                                ? 'bg-nexus-secondary/20 border-nexus-secondary text-white' 
                                                : 'bg-nexus-bg/50 border-nexus-border text-nexus-dim hover:bg-nexus-bg hover:text-gray-300'}
                                            ${dragOverIndex === idx && dragPosition === 'center' ? 'bg-nexus-accent/20 border-nexus-accent' : ''}
                                        `}
                                    >
                                        {/* Drop Indicators */}
                                        {dragOverIndex === idx && dragPosition === 'top' && (
                                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-nexus-accent shadow-[0_0_5px_cyan] z-10"></div>
                                        )}
                                        {dragOverIndex === idx && dragPosition === 'bottom' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-nexus-accent shadow-[0_0_5px_cyan] z-10"></div>
                                        )}

                                        <span className="text-base">
                                            {layer.type === 'image' ? '🖼️' : layer.type === 'i-text' ? 'T' : layer.type === 'group' ? '🗂️' : '🟦'}
                                        </span>
                                        
                                        {/* Transparency Icon */}
                                        {layer.ref.hasTransparentBg && (
                                            <span className="text-[10px] bg-white/10 p-0.5 rounded ml-1" title="Fundo Transparente">
                                                🏁
                                            </span>
                                        )}

                                        <span className="truncate flex-1">{layer.name}</span>
                                        {layer.type === 'group' && <span className="text-[9px] opacity-50 border px-1 rounded">GRP</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Backdrop for Props Mobile */}
            {showProps && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setShowProps(false)}></div>}

        </div>
    );
};

export default CreativeGenerator;
