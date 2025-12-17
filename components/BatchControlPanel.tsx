import React, { useState, useRef, useEffect } from 'react';
import { BatchConfig, FlowExecutionRequest, WorkflowNode, WorkflowEdge, WorkflowNodeType, WorkflowNodeData } from '../types';
import { executeNexusSwarm, generateNexusVideo, runNexusRequest } from '../geminiService';
import { generateWithFreepik } from '../freepikService';
import { LiveEditorService } from '../liveEditorService';
import { SemanticEngine } from '../semanticEngine';
import { HyperRealismEngine } from '../hyperRealismEngine';

interface BatchControlPanelProps {
    config: BatchConfig;
    setConfig: React.Dispatch<React.SetStateAction<BatchConfig>>;
    onProcessNode: (request: FlowExecutionRequest) => void;
    onTemplateSet: () => void;
    isProcessing: boolean;
    resultsMap: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════
// BLUEPRINT CONFIGURATION MATRIX (V3.0 REAL)
// ═══════════════════════════════════════════════════════════

const IMAGE_MODELS = [
    { id: 'flux1', label: 'Flux 1.1 Pro (Ultra Real)', icon: '💠' },
    { id: 'mystic25', label: 'Mystic 2.5 (Artístico)', icon: '🎨' },
    { id: 'seedream', label: 'SeaDream (Cinemático)', icon: '🎬' },
    { id: 'gemini', label: 'Gemini 2.5 (Google)', icon: '⚡' },
    { id: 'imagen3', label: 'Imagen 3 (Google)', icon: '📸' }
];

const VIDEO_MODELS = [
    { id: 'veo-fast', label: 'Veo Fast (Preview)', icon: '🐇' },
    { id: 'veo-hq', label: 'Veo HQ (Preview)', icon: '🐢' }
];

const ASPECT_RATIOS = [
    { id: '16:9', label: '16:9 (Youtube)', icon: '▭' },
    { id: '9:16', label: '9:16 (Stories/Reels)', icon: '▯' },
    { id: '1:1', label: '1:1 (Square)', icon: '□' },
    { id: '4:3', label: '4:3 (Classic)', icon: '📺' },
    { id: '3:4', label: '3:4 (Portrait)', icon: '📱' }
];

const NODE_TYPES: Record<WorkflowNodeType, { label: string, color: string, icon: string, inputs: string[], outputs: string[] }> = {
    'text_input': { label: 'Input de Texto', color: 'border-green-500', icon: '📝', inputs: [], outputs: ['text'] },
    'media_input': { label: 'Input de Mídia', color: 'border-pink-500', icon: '📂', inputs: [], outputs: ['image'] },
    'ai_assistant': { label: 'AI Refiner (LLM)', color: 'border-cyan-500', icon: '✨', inputs: ['text', 'image'], outputs: ['text'] },
    'image_generator': { label: 'Gerador IMG (Real)', color: 'border-blue-500', icon: '🖼️', inputs: ['prompt', 'image'], outputs: ['image'] },
    'video_generator': { label: 'Gerador VID', color: 'border-purple-500', icon: '📹', inputs: ['image', 'prompt'], outputs: ['video'] },
    'image_upscaler': { label: 'Upscaler 4K', color: 'border-yellow-500', icon: '🔍', inputs: ['image'], outputs: ['image'] },
    'gallery_output': { label: 'Output Final', color: 'border-gray-500', icon: '👁️', inputs: ['image', 'video'], outputs: [] },
    'sticky_note': { label: 'Nota', color: 'border-yellow-200', icon: '📌', inputs: [], outputs: [] }
};

const WORKFLOW_TEMPLATES = [
    {
        id: 'viral-n8n',
        name: '🎥 Viral Video Factory',
        description: 'Texto -> Roteiro -> Imagem Flux -> Vídeo',
        nodes: [
            { id: 'trigger', type: 'text_input', x: 50, y: 300, data: { text: 'Um carro esportivo vermelho correndo em Marte' } },
            { id: 'prompt_vis', type: 'ai_assistant', x: 400, y: 300, data: { text: 'Prompt Engineer: Melhore este conceito visualmente para Flux 1.1' } },
            { id: 'img_flux', type: 'image_generator', x: 800, y: 300, data: { model: 'flux1', aspectRatio: '16:9', status: 'idle' } },
            { id: 'final', type: 'gallery_output', x: 1200, y: 300, data: {} }
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'prompt_vis' },
            { id: 'e2', source: 'prompt_vis', target: 'img_flux' },
            { id: 'e3', source: 'img_flux', target: 'final' }
        ]
    }
];

const BatchControlPanel: React.FC<BatchControlPanelProps> = () => {
    // --- STATE ---
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    
    // Initial Graph State
    const [nodes, setNodes] = useState<WorkflowNode[]>(WORKFLOW_TEMPLATES[0].nodes as any);
    const [edges, setEdges] = useState<WorkflowEdge[]>(WORKFLOW_TEMPLATES[0].edges);

    // Interaction
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

    // --- EXECUTION ENGINE ---

    const getNodeInput = (nodeId: string, inputType: 'text' | 'image' | 'video'): any => {
        const incomingEdges = edges.filter(e => e.target === nodeId);
        for (const edge of incomingEdges) {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (!sourceNode) continue;

            if (inputType === 'text' && sourceNode.type === 'text_input') return sourceNode.data.text;
            if (inputType === 'text' && sourceNode.type === 'ai_assistant') return sourceNode.data.text;
            if (inputType === 'text' && sourceNode.data.prompt) return sourceNode.data.prompt;
            
            if (inputType === 'image' && sourceNode.data.outputImage) return sourceNode.data.outputImage;
            
            if (inputType === 'image' && sourceNode.type === 'image_upscaler') return sourceNode.data.outputImage;
            if (inputType === 'image' && sourceNode.type === 'media_input') return sourceNode.data.outputImage;
        }
        return null;
    };

    const updateNodeStatus = (id: string, status: WorkflowNodeData['status'], errorMessage?: string) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, status, errorMessage } } : n));
    };

    const updateNodeOutput = (id: string, outputKey: 'outputImage' | 'outputVideo' | 'text', value: string) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, [outputKey]: value } } : n));
    };

    const runNode = async (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        updateNodeStatus(nodeId, 'running');

        try {
            // ═══════════════════════════════════════════════════════════
            // AI ASSISTANT (LLM REAL)
            // ═══════════════════════════════════════════════════════════
            if (node.type === 'ai_assistant') {
                const inputTxt = getNodeInput(nodeId, 'text');
                const roleDescription = node.data.text || "AI Assistant";
                
                if (!inputTxt) throw new Error("Sem texto de entrada para o Agente.");

                // Fixed: runNexusRequest requires 3 arguments. Used gemini-3-flash-preview as recommended.
                const response = await runNexusRequest("generateContent", 'gemini-3-flash-preview', {
                    contents: { parts: [{ text: `
                        [SYSTEM: ${roleDescription}]
                        [INPUT: "${inputTxt}"]
                        
                        TAREFA: Processar o input seguindo rigorosamente a persona do sistema. 
                        Crie um prompt visual rico em detalhes, em inglês, otimizado para Flux/Midjourney.
                        
                        OUTPUT (Apenas o resultado final):
                    ` }] }
                });

                const processedText = response.text || "Erro no processamento LLM.";
                updateNodeOutput(nodeId, 'text', processedText);
                setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, text: `[RESULTADO]:\n${processedText.substring(0, 100)}...` } } : n));
            }

            // ═══════════════════════════════════════════════════════════
            // IMAGE GENERATOR (GOD MODE + FREEPIK)
            // ═══════════════════════════════════════════════════════════
            else if (node.type === 'image_generator') {
                let prompt = getNodeInput(nodeId, 'text');
                const imgInput = getNodeInput(nodeId, 'image'); 
                
                if (!prompt && !node.data.text) throw new Error("Sem prompt conectado!");
                if (!prompt) prompt = node.data.text; // Fallback to internal text

                // 1. Semantic Analysis (Layer 7)
                const semantic = SemanticEngine.analyze(prompt);
                prompt = semantic.enrichedConcept;

                // 2. Hyper-Realism Injection
                const realismMod = HyperRealismEngine.getPromptModifier('cinematic-raw');
                prompt = `${prompt}, ${realismMod}`;

                // 3. Technical Polish
                prompt = `${prompt}, 8k resolution, masterpiece, sharp focus, professional lighting`;

                let imageUrl = '';

                // Verifica se é Freepik (Flux/Mystic) ou Google
                if (['flux1', 'mystic25', 'seedream'].includes(node.data.model || 'flux1')) {
                    imageUrl = await generateWithFreepik({
                        prompt: prompt,
                        model: (node.data.model as any) || 'flux1',
                        aspectRatio: node.data.aspectRatio || '16:9'
                    });
                } else {
                    // Gemini/Imagen Nexus Fallback
                    const res = await executeNexusSwarm({
                        concept: prompt,
                        style: 'cinematic',
                        mood: 'MOODDOPAMINEFLOOD',
                        aspectRatio: (node.data.aspectRatio as any) || '16:9',
                        referenceImage: imgInput || null, 
                        quality: 10,
                        useSemantic: false,
                        useHyperRealism: false
                    });
                    imageUrl = res.imageUrl;
                }
                updateNodeOutput(nodeId, 'outputImage', imageUrl);
            } 
            
            // --- VIDEO GENERATOR ---
            else if (node.type === 'video_generator') {
                const imageInput = getNodeInput(nodeId, 'image');
                let promptInput = getNodeInput(nodeId, 'text') || "Cinematic motion";
                
                if (!imageInput && !promptInput) throw new Error("Requer imagem ou texto de entrada!");

                const videoUrl = await generateNexusVideo(
                    promptInput, 
                    imageInput || undefined, 
                    node.data.model || 'veo-fast', 
                    node.data.duration || '5s', 
                    (node.data.resolution as any) || '720p'
                );
                updateNodeOutput(nodeId, 'outputVideo', videoUrl);
            }
            
            // --- UPSCALER ---
            else if (node.type === 'image_upscaler') {
                const imageInput = getNodeInput(nodeId, 'image');
                if (!imageInput) throw new Error("Sem imagem para upscale!");
                
                const upscaled = await LiveEditorService.upscaleImage(imageInput, node.data.scale || '2x', 'fidelity');
                updateNodeOutput(nodeId, 'outputImage', upscaled);
            }

            updateNodeStatus(nodeId, 'completed');
        } catch (e: any) {
            console.error(e);
            updateNodeStatus(nodeId, 'error', e.message);
        }
    };

    const runAllNodes = async () => {
        // Simple sequence
        for (const node of nodes) {
            if (['image_generator', 'video_generator', 'image_upscaler', 'ai_assistant'].includes(node.type)) {
                await runNode(node.id);
            }
        }
    };

    // --- UI HELPER: DOWNLOAD IMAGE ---
    const downloadImage = (url: string, prefix: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `NEXUS-${prefix}-${Date.now()}.png`;
        a.click();
    };

    // --- NODE RENDERER (GLASSMORPHISM STYLE) ---

    const renderNodeContent = (node: WorkflowNode) => {
        const typeConfig = NODE_TYPES[node.type];
        const isSelected = selectedNodes.includes(node.id);
        const statusColor = node.data.status === 'running' ? 'border-nexus-accent shadow-[0_0_20px_rgba(0,240,255,0.3)]' 
                          : node.data.status === 'error' ? 'border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.3)]' 
                          : node.data.status === 'completed' ? 'border-nexus-success shadow-[0_0_20px_rgba(0,255,157,0.3)]' 
                          : 'border-white/10 hover:border-white/30';

        return (
            <div 
                className={`w-[320px] bg-nexus-panel/90 backdrop-blur-xl rounded-2xl border ${statusColor} transition-all duration-200 overflow-hidden flex flex-col ${isSelected ? 'ring-2 ring-white/50 scale-[1.02]' : ''}`}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingId(node.id);
                    setLastMouse({ x: e.clientX, y: e.clientY });
                    setSelectedNodes([node.id]);
                }}
                onTouchStart={(e) => {
                    e.stopPropagation();
                    setDraggingId(node.id);
                    setLastMouse({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                    setSelectedNodes([node.id]);
                }}
            >
                {/* Header */}
                <div className={`h-10 px-4 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent`}>
                    <div className="flex items-center gap-2">
                        <span className="text-lg filter drop-shadow-md">{typeConfig.icon}</span>
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{typeConfig.label}</span>
                    </div>
                    
                    {['image_generator', 'video_generator', 'image_upscaler', 'ai_assistant'].includes(node.type) && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); runNode(node.id); }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${node.data.status === 'running' ? 'bg-white/10 cursor-not-allowed animate-spin' : 'bg-nexus-success text-black hover:bg-white'}`}
                        >
                            {node.data.status === 'running' ? '⚡' : '▶'}
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-4 space-y-3" onMouseDown={e => e.stopPropagation()}>
                    
                    {/* Error Display */}
                    {node.data.status === 'error' && (
                        <div className="bg-red-500/20 border border-red-500/50 p-3 rounded text-[10px] text-white font-bold break-words animate-pulse">
                            ❌ {node.data.errorMessage}
                        </div>
                    )}

                    {/* Text Inputs */}
                    {(node.type === 'text_input' || node.type === 'ai_assistant' || node.type === 'sticky_note') && (
                        <textarea 
                            className={`w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white resize-none focus:border-nexus-accent outline-none placeholder:text-white/20 ${node.type === 'sticky_note' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-100' : ''}`}
                            placeholder={node.type === 'ai_assistant' ? "Ex: Aja como um diretor de arte..." : "Digite o prompt..."}
                            value={node.data.text || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, text: val } } : n));
                            }}
                        />
                    )}

                    {/* Generator Controls */}
                    {['image_generator', 'video_generator'].includes(node.type) && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <select 
                                    className="bg-black/40 border border-white/10 rounded-lg text-[10px] p-2 text-white outline-none focus:border-nexus-accent cursor-pointer"
                                    value={node.data.model}
                                    onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, model: e.target.value } } : n))}
                                >
                                    {node.type === 'image_generator' ? IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>) : VIDEO_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                </select>
                                <select 
                                    className="bg-black/40 border border-white/10 rounded-lg text-[10px] p-2 text-white outline-none focus:border-nexus-accent cursor-pointer"
                                    value={node.type === 'image_generator' ? node.data.aspectRatio : node.data.resolution}
                                    onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, [node.type === 'image_generator' ? 'aspectRatio' : 'resolution']: e.target.value } } : n))}
                                >
                                    {node.type === 'image_generator' ? ASPECT_RATIOS.map(ar => <option key={ar.id} value={ar.id}>{ar.label}</option>) : <><option value="720p">720p</option><option value="1080p">1080p</option></>}
                                </select>
                            </div>
                            
                            {/* RESULTADO VISUAL COM DOWNLOAD */}
                            <div className="aspect-video bg-black/40 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative group">
                                {node.data.outputImage || node.data.outputVideo ? (
                                    <>
                                        {node.data.outputImage ? (
                                            <img src={node.data.outputImage} className="w-full h-full object-cover" /> 
                                        ) : (
                                            <video src={node.data.outputVideo} autoPlay loop muted className="w-full h-full object-cover" />
                                        )}
                                        
                                        {/* OVERLAY ACTIONS */}
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                            {node.data.outputImage && (
                                                <button 
                                                    onClick={() => downloadImage(node.data.outputImage!, `NODE-${node.id}`)}
                                                    className="bg-nexus-accent text-black text-xs font-bold px-4 py-2 rounded hover:bg-white transition-colors flex items-center gap-1"
                                                >
                                                    ⬇ BAIXAR
                                                </button>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-2xl opacity-20">{typeConfig.icon}</span>
                                        <span className="text-[10px] text-white/30">
                                            {node.data.status === 'running' ? 'GERANDO...' : 'AGUARDANDO'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {node.type === 'gallery_output' && (
                        <div className="relative group">
                            <div className="h-48 bg-black/40 border border-white/10 rounded-lg p-2 flex items-center justify-center text-white/30 text-xs overflow-hidden">
                                {getNodeInput(node.id, 'image') ? (
                                    <img src={getNodeInput(node.id, 'image')} className="w-full h-full object-cover rounded" />
                                ) : 'Aguardando Imagem Final'}
                            </div>
                            {getNodeInput(node.id, 'image') && (
                                <button 
                                    onClick={() => downloadImage(getNodeInput(node.id, 'image'), 'FINAL')}
                                    className="absolute bottom-4 right-4 bg-nexus-success text-black text-xs font-bold px-4 py-2 rounded shadow-lg hover:bg-white transition-colors"
                                >
                                    ⬇ SALVAR FINAL
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Ports */}
                {typeConfig.inputs.length > 0 && (
                    <div 
                        className="absolute left-0 top-1/2 -translate-x-1/2 w-4 h-4 bg-nexus-panel border-2 border-white/50 rounded-full hover:scale-125 transition-transform z-50 cursor-crosshair shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                        onMouseUp={(e) => {
                            e.stopPropagation();
                            if (connectingNodeId && connectingNodeId !== node.id) {
                                setEdges(prev => [...prev, { id: `e-${Date.now()}`, source: connectingNodeId, target: node.id }]);
                                setConnectingNodeId(null);
                            }
                        }}
                    ></div>
                )}

                {typeConfig.outputs.length > 0 && (
                    <div 
                        className="absolute right-0 top-1/2 translate-x-1/2 w-4 h-4 bg-nexus-panel border-2 border-nexus-accent rounded-full hover:scale-125 transition-transform z-50 cursor-crosshair shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            setConnectingNodeId(node.id);
                        }}
                    ></div>
                )}
            </div>
        );
    };

    // --- SVG CURVES (Bezier) ---
    const getPath = (x1: number, y1: number, x2: number, y2: number) => {
        const dist = Math.abs(x2 - x1);
        const cp1x = x1 + dist * 0.5;
        const cp2x = x2 - dist * 0.5;
        return `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
    };

    // --- BOILERPLATE HANDLERS (Same as before) ---
    const addNode = (type: WorkflowNodeType) => {
        const id = `n-${Date.now()}`;
        const centerX = (-pan.x + (containerRef.current?.clientWidth || 1000) / 2) / zoom;
        const centerY = (-pan.y + (containerRef.current?.clientHeight || 800) / 2) / zoom;
        setNodes(prev => [...prev, {
            id, type, x: centerX - 160, y: centerY - 100,
            data: { status: 'idle', aspectRatio: '16:9', model: 'flux1', resolution: '720p', scale: '2x', text: type === 'ai_assistant' ? 'Prompt Engineer' : '' }
        }]);
    };
    const deleteSelection = () => {
        setNodes(prev => prev.filter(n => !selectedNodes.includes(n.id)));
        setEdges(prev => prev.filter(e => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)));
        setSelectedNodes([]);
    };
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeNodeId) {
            const reader = new FileReader();
            reader.onload = (ev) => { updateNodeOutput(activeNodeId, 'outputImage', ev.target?.result as string); };
            reader.readAsDataURL(file);
        }
        setActiveNodeId(null);
    };
    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) return;
        if (e.button === 0 || e.button === 1 || e.shiftKey) {
            setIsPanning(true);
            setLastMouse({ x: e.clientX, y: e.clientY });
            setSelectedNodes([]);
        }
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (connectingNodeId) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                setMousePos({ x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom });
            }
        }
        if (isPanning) {
            const dx = e.movementX ?? (e.clientX - lastMouse.x);
            const dy = e.movementY ?? (e.clientY - lastMouse.y);
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMouse({ x: e.clientX, y: e.clientY });
        } else if (draggingId) {
            const dx = (e.movementX ?? (e.clientX - lastMouse.x)) / zoom;
            const dy = (e.movementY ?? (e.clientY - lastMouse.y)) / zoom;
            setNodes(prev => prev.map(n => n.id === draggingId ? { ...n, x: n.x + dx, y: n.y + dy } : n));
            setLastMouse({ x: e.clientX, y: e.clientY });
        }
    };
    const handleMouseUp = () => { setIsPanning(false); setDraggingId(null); setConnectingNodeId(null); };
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            const newZoom = Math.min(Math.max(zoom + delta, 0.1), 3);
            setZoom(newZoom);
        } else {
            setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    return (
        <div className="flex h-full w-full gap-0 bg-[#050505] relative overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            
            {/* PALETTE */}
            <div className="w-20 lg:w-64 flex flex-col bg-nexus-panel/50 backdrop-blur-md border-r border-white/5 z-20 shadow-2xl transition-all">
                <div className="p-4 border-b border-white/5 flex items-center justify-center lg:justify-start gap-3">
                    <span className="text-xl">💠</span>
                    <span className="hidden lg:inline text-xs font-bold text-white uppercase tracking-widest">Fluxo Pro</span>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                    <button onClick={runAllNodes} className="w-full p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20 transition-all group flex items-center justify-center lg:justify-start gap-3 mb-4 animate-pulse">
                        <span className="text-lg">⚡</span>
                        <span className="hidden lg:inline text-[10px] font-bold uppercase">ATIVAR SISTEMA</span>
                    </button>
                    <div className="border-t border-white/5 my-2"></div>
                    {Object.entries(NODE_TYPES).map(([type, config]) => (
                        <button key={type} onClick={() => addNode(type as any)} className="w-full p-3 rounded-xl border border-white/5 hover:bg-white/5 hover:border-nexus-accent/30 transition-all group flex items-center justify-center lg:justify-start gap-3">
                            <span className="text-lg group-hover:scale-110 transition-transform">{config.icon}</span>
                            <span className="hidden lg:inline text-[10px] font-bold text-gray-300 group-hover:text-white uppercase">{config.label}</span>
                        </button>
                    ))}
                </div>
                <div className="mt-auto p-4 border-t border-white/5">
                    <button onClick={deleteSelection} disabled={selectedNodes.length === 0} className="w-full py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 flex items-center justify-center">
                        <span className="lg:hidden">✕</span>
                        <span className="hidden lg:inline">Deletar</span>
                    </button>
                </div>
            </div>

            {/* CANVAS */}
            <div 
                ref={containerRef}
                className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-[#020204]"
                style={{ touchAction: 'none' }}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}
            >
                {/* Background Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, backgroundSize: `${40 * zoom}px ${40 * zoom}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }} />

                {/* Transform Layer */}
                <div className="absolute inset-0 transform-gpu origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                    {/* Edges */}
                    <svg className="absolute overflow-visible w-full h-full pointer-events-none z-0">
                        <defs><linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#00f0ff" /></linearGradient></defs>
                        {edges.map(edge => {
                            const source = nodes.find(n => n.id === edge.source);
                            const target = nodes.find(n => n.id === edge.target);
                            if (!source || !target) return null;
                            const x1 = source.x + 320; const y1 = source.y + 20; const x2 = target.x; const y2 = target.y + 20;
                            return ( <g key={edge.id}><path d={getPath(x1, y1, x2, y2)} fill="none" stroke="#1e293b" strokeWidth="4" /><path d={getPath(x1, y1, x2, y2)} fill="none" stroke="url(#edgeGradient)" strokeWidth="2" className="flow-line" /></g> );
                        })}
                        {connectingNodeId && ( <path d={getPath((nodes.find(n => n.id === connectingNodeId)?.x || 0) + 320, (nodes.find(n => n.id === connectingNodeId)?.y || 0) + 20, mousePos.x, mousePos.y)} fill="none" stroke="#00f0ff" strokeWidth="2" strokeDasharray="5,5" className="opacity-70" /> )}
                    </svg>
                    {/* Nodes */}
                    {nodes.map(node => ( <div key={node.id} style={{ position: 'absolute', left: node.x, top: node.y, zIndex: selectedNodes.includes(node.id) ? 50 : 10 }}>{renderNodeContent(node)}</div> ))}
                </div>

                {/* Toolbar */}
                <div className="absolute bottom-8 right-8 bg-nexus-panel/90 backdrop-blur border border-white/10 rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl z-30">
                    <button onClick={() => setZoom(Math.max(0.2, zoom - 0.1))} className="hover:text-white text-nexus-dim text-lg font-bold">-</button>
                    <span className="text-xs text-white font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="hover:text-white text-nexus-dim text-lg font-bold">+</button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="hover:text-white text-nexus-dim text-xs font-mono uppercase">Reset</button>
                </div>
            </div>
        </div>
    );
};

export default BatchControlPanel;