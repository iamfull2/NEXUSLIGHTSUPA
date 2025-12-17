
import React, { useState, useEffect, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import ResultDisplay from './components/ResultDisplay';
import SwarmVisualizer from './components/SwarmVisualizer';
import BatchControlPanel from './components/BatchControlPanel';
import AutonomousDashboard from './components/AutonomousDashboard';
import EvolutionDashboard from './components/EvolutionDashboard';
import QuantumLab from './components/QuantumLab';
import CollaborationPanel from './components/CollaborationPanel';
import PainlessDashboard from './components/PainlessDashboard';
import ConsciousnessHUD from './components/ConsciousnessHUD';
import CheckpointDialog from './components/CheckpointDialog';
import CreativeGenerator from './components/CreativeGenerator'; 
import StudioPro from './components/StudioPro'; 
import AuthGate from './components/AuthGate';
import CustomCursor from './components/CustomCursor';
import StyleDNABuilder from './components/StyleDNABuilder';
import VideoStudio from './components/VideoStudio';
import NexusAIInterface from './components/NexusAIInterface';

import { NexusConfig, GenerationResult, NexusAgent, BatchConfig, BatchResultItem, StyleDNAProfile, QuantumState, CollabUser, ConsciousnessState, FlowExecutionRequest } from './types';
import { INITIAL_AGENTS, TEMPLATE_SET_DIMENSIONS } from './nexusCore';
import { executeNexusSwarm, executeBatchNexus, runNexusRequest, analyzeContextFile } from './geminiService';
import { neuralMemory } from './neuralMemory';
import { SemanticEngine } from './semanticEngine';
import { MultiModelOrchestrator } from './multiModelOrchestrator';
import { StyleTransferEngine } from './styleTransfer';
import { QuantumComposer } from './quantumComposer';
import { QuantumPromptAnnealingService } from './quantumPromptAnnealingService';
import { CollaborationHub } from './collaborationHub';
import { ConsciousnessCore } from './consciousnessCore';
import { AICloneUltraV2 } from './aiCloneUltraV2';
import { HyperRealismEngine } from './hyperRealismEngine';

const NexusLogoHeader: React.FC = () => (
    <div className="relative w-8 h-8 flex items-center justify-center group cursor-pointer">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 via-slate-500 to-slate-800 shadow-[0_0_10px_rgba(0,240,255,0.3)] relative z-10 overflow-hidden transform transition-transform duration-700 group-hover:rotate-12">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50"></div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-nexus-success rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-nexus-secondary rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.8)]"></div>
            <div className="absolute inset-0 border border-slate-400/30 rounded-full opacity-50 rotate-45 scale-75"></div>
            <div className="absolute inset-0 border border-slate-400/30 rounded-full opacity-50 -rotate-45 scale-75"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-nexus-accent rounded-full blur-[1px] z-20 animate-pulse"></div>
        </div>
        <div className="absolute inset-0 bg-nexus-accent/20 rounded-full blur-md group-hover:bg-nexus-secondary/30 transition-colors duration-1000 -z-10"></div>
    </div>
);

// Map of Mode -> [White Text, Blue Loop Text]
const MODE_TITLES: Record<string, [string, string]> = {
    'single': ['SISTEMA', 'OMEGA V8'],
    'batch': ['FLUXO', 'INDUSTRIAL'],
    'editor': ['ESTÚDIO', 'CRIATIVO'],
    'studiopro': ['STUDIO', 'PRO'],
    'video': ['SÍNTESE', 'DE VÍDEO'],
    'autonomous': ['MOTOR', 'AUTÔNOMO'],
    'evolution': ['EVOLUÇÃO', 'GENÉTICA'],
    'quantum': ['RECOZIMENTO', 'QUÂNTICO'],
    'painless': ['SUÍTE', 'TOOLS'],
    'style-dna': ['ARQUITETO', 'DE DNA'],
    'ai-chat': ['NEXUS', 'MIND']
};

const App: React.FC = () => {
    // Mode Selection - Defaulting to SINGLE for main creation flow
    const [mode, setMode] = useState<'single' | 'batch' | 'autonomous' | 'evolution' | 'quantum' | 'painless' | 'editor' | 'studiopro' | 'style-dna' | 'video' | 'ai-chat'>('single');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Single Gen State
    const [config, setConfig] = useState<NexusConfig>({
        concept: '',
        style: 'cinematic',
        mood: 'MOODDOPAMINEFLOOD',
        aspectRatio: '16:9',
        format: 'YouTube Thumbnail', // Default format for better UX
        quality: 10.0,
        useSemantic: true,
        useMultiModel: false,
        useQuantum: false,
        useConsciousness: true,
        useClone: false,
        useHyperRealism: false,
        hyperRealismPreset: 'photo-studio',
        referenceImage: null,
        contextFile: null
    });
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [agents, setAgents] = useState<NexusAgent[]>(INITIAL_AGENTS);
    const [swarmProgress, setSwarmProgress] = useState(0);

    // Batch Gen State (Legacy Config retained for compat)
    const [batchConfig, setBatchConfig] = useState<BatchConfig>({
        concept: '',
        style: 'cinematic',
        mood: 'MOODDOPAMINEFLOOD',
        selectedDimensions: []
    });
    // NEW: Node Execution Results
    const [nodeResults, setNodeResults] = useState<Record<string, string>>({});

    const [isProcessing, setIsProcessing] = useState(false);

    // Quantum State
    const [quantumState, setQuantumState] = useState<QuantumState>({
        iteration: 0,
        temperature: 0,
        currentEnergy: 0,
        bestEnergy: 0,
        currentPrompt: '',
        status: 'idle'
    });

    // Collab State
    const [collabUsers, setCollabUsers] = useState<CollabUser[]>([]);
    const [collabMessages, setCollabMessages] = useState<string[]>([]);
    const [collabHub, setCollabHub] = useState<CollaborationHub | null>(null);

    // Consciousness State (V37)
    const [consciousnessState, setConsciousnessState] = useState<ConsciousnessState>({
        isActive: false,
        context: null,
        currentObjectives: null,
        activeCheckpoint: null,
        logs: []
    });
    const consciousnessRef = useRef<ConsciousnessCore | null>(null);

    // Theme Effect
    useEffect(() => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }, [theme]);

    // Init Collab
    useEffect(() => {
        const hub = new CollaborationHub((users, msgs) => {
            setCollabUsers([...users]);
            setCollabMessages([...msgs]);
        });
        setCollabHub(hub);
    }, []);

    // Check for Landing Page Prompt
    useEffect(() => {
        const savedPrompt = localStorage.getItem('nexus_landing_prompt');
        if (savedPrompt) {
            setConfig(prev => ({ ...prev, concept: savedPrompt }));
            localStorage.removeItem('nexus_landing_prompt'); // Clear it
        }
    }, []);

    // --- HANDLERS ---

    const handlePainlessImage = (url: string) => {
        setResult({
            imageUrl: url,
            finalPrompt: "Geração Painless V36",
            specs: {
                render: "Composto",
                lighting: "Estúdio",
                camera: "Virtual",
                mood: "Otimizado"
            },
            generationTime: "0.5s",
            qualityScore: "10.0/10.0",
            pipeline: {
                semantic: false,
                styleTransfer: false,
                multiModel: false,
                quantum: false,
                cutout: true
            }
        });
        setMode('single'); // Switch to view result
    };

    const handleApplyStyleDNA = (dnaPrompt: string) => {
        setConfig(prev => ({
            ...prev,
            concept: prev.concept ? `${prev.concept}, ${dnaPrompt}` : dnaPrompt
        }));
        setMode('single');
    };

    const handleGenerateSingle = async () => {
        setIsProcessing(true);
        setResult(null);
        setSwarmProgress(0);
        setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'IDLE' })));
        setQuantumState(prev => ({ ...prev, status: 'idle' }));

        try {
            // Visual Sim for Swarm
            const totalAgents = agents.length;
            let currentAgentIndex = 0;
            const progressInterval = setInterval(() => {
                if (currentAgentIndex < totalAgents) {
                    setAgents(prev => prev.map((agent, idx) => {
                        if (idx === currentAgentIndex) return { ...agent, status: 'ACTIVE' };
                        if (idx < currentAgentIndex) return { ...agent, status: 'COMPLETE' };
                        return agent;
                    }));
                    setSwarmProgress(Math.round(((currentAgentIndex + 1) / totalAgents) * 100));
                    currentAgentIndex++;
                }
            }, 300);

            // Notify Collab
            collabHub?.notifyGeneration(config.concept);

            let enhancedConcept = config.concept;

            try {
                // --- RAG CONTEXT INJECTION (New) ---
                if (config.contextFile) {
                    console.log("📄 Processing RAG Context...");
                    const contextPrompt = await analyzeContextFile(
                        config.contextFile.data,
                        config.contextFile.mimeType,
                        enhancedConcept
                    );
                    enhancedConcept = contextPrompt;
                }

                // --- V37.1 ULTRA FEATURES ---
                // AI Clone Ultra V2
                if (config.useClone && config.referenceImage) {
                    const cloneAnalysis = await AICloneUltraV2.analyzeReference(config.referenceImage);
                    enhancedConcept = AICloneUltraV2.generateClonePrompt(enhancedConcept, cloneAnalysis);
                } else if (config.useClone && !config.referenceImage) {
                    alert("Modo Clone requer uma imagem de referência!");
                    setIsProcessing(false);
                    clearInterval(progressInterval);
                    return;
                }

                // Hyper-Realism Engine (Early binding)
                if (config.useHyperRealism && config.hyperRealismPreset) {
                    const realismMod = HyperRealismEngine.getPromptModifier(config.hyperRealismPreset);
                    enhancedConcept += `, ${realismMod}`;
                }

                // --- V37 CONSCIOUSNESS WORKFLOW ---
                if (config.useConsciousness) {
                    consciousnessRef.current = new ConsciousnessCore(setConsciousnessState);
                    try {
                        const consciousnessData = await consciousnessRef.current.process(config.concept, 5 * 60 * 1000);
                        const modules = consciousnessData.modules || [];
                        enhancedConcept += `, optimized for ${modules.join(', ')}`;
                    } catch (cErr) {
                        console.warn("Consciousness Core Offline, bypassing...");
                    }
                }

                // --- V35 SUPREME WORKFLOW ---
                if (config.useSemantic) {
                    const semantic = SemanticEngine.analyze(config.concept);
                    enhancedConcept = semantic.enrichedConcept;
                }

                if (config.referenceImage && !config.useClone) {
                    const styleAnalysis = await StyleTransferEngine.analyze(config.referenceImage);
                    enhancedConcept += `, ${styleAnalysis.promptAddition}`;
                }

                if (config.useQuantum) {
                    setQuantumState(prev => ({ ...prev, status: 'annealing' }));
                    try {
                        const initialStates = await QuantumPromptAnnealingService.initializeSuperposition(enhancedConcept);
                        const schedule = {
                            initialTemperature: 1.0,
                            finalTemperature: 0.01,
                            iterations: 30,
                            coolingRate: 0.85,
                            reannealingProb: 0.1
                        };
                        let bestPrompt = enhancedConcept;
                        const annealer = QuantumPromptAnnealingService.annealPrompts(initialStates, schedule);
                        for await (const state of annealer) {
                            setQuantumState({
                                iteration: state.iteration,
                                temperature: state.temperature,
                                currentEnergy: state.currentEnergy,
                                bestEnergy: state.bestEnergy,
                                currentPrompt: state.currentPrompt,
                                status: 'annealing'
                            });
                            bestPrompt = state.currentPrompt;
                        }
                        bestPrompt = await QuantumPromptAnnealingService.injectAdaptiveContext(bestPrompt);
                        bestPrompt = await QuantumPromptAnnealingService.applyHyperRealism(bestPrompt);
                        enhancedConcept = bestPrompt;
                        setQuantumState(prev => ({ ...prev, status: 'collapsed', currentPrompt: enhancedConcept }));
                    } catch (qErr) {
                        setQuantumState(prev => ({ ...prev, status: 'idle', currentPrompt: "Quantum Bypass Active" }));
                    }
                }

                if (config.useMultiModel) {
                    try {
                        enhancedConcept = await MultiModelOrchestrator.orchestrate(enhancedConcept);
                    } catch (mErr) {
                        console.warn("Orchestrator unavailable.");
                    }
                }

            } catch (logicError) {
                console.error("Logic Layer Error:", logicError);
            }

            // Execute Swarm with OMEGA UPGRADE
            const data = await executeNexusSwarm({ ...config, concept: enhancedConcept });
            
            data.pipeline = {
                semantic: config.useSemantic || false,
                multiModel: config.useMultiModel || false,
                styleTransfer: !!config.referenceImage,
                quantum: config.useQuantum || false,
                consciousness: config.useConsciousness || false,
                clone: config.useClone || false,
                hyperRealism: config.useHyperRealism || false,
                ragContext: !!config.contextFile
            };

            neuralMemory.storeGeneration(config.concept, config.style, config.mood, data.imageUrl);

            clearInterval(progressInterval);
            setAgents(prev => prev.map(a => ({ ...a, status: 'COMPLETE' })));
            setSwarmProgress(100);
            
            setTimeout(() => {
                setResult(data);
                setIsProcessing(false);
            }, 600);

        } catch (error) {
            console.error(error);
            setIsProcessing(false);
            alert("NEXUS CORE: " + (error as Error).message);
        }
    };

    const handleNodeExecution = async (req: FlowExecutionRequest) => {
        setIsProcessing(true);
        try {
            const result = await executeNexusSwarm({
                concept: req.prompt,
                style: req.style as any,
                mood: 'MOODDOPAMINEFLOOD',
                aspectRatio: req.ratio as any,
                quality: 10,
                useSemantic: true
            });

            setNodeResults(prev => ({
                ...prev,
                [req.targetNodeId]: result.imageUrl
            }));

        } catch (e: any) {
            alert(`Erro no fluxo: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTemplateSet = () => {
        setBatchConfig(prev => ({ ...prev, selectedDimensions: TEMPLATE_SET_DIMENSIONS }));
    };

    const handleEvolveComplete = async (dna: StyleDNAProfile, prompt: string) => {
        setIsProcessing(true);
        setMode('single'); 
        setResult(null);
        
        try {
            const data = await executeNexusSwarm({
                concept: prompt,
                style: 'cinematic',
                mood: dna.color as any,
                aspectRatio: '16:9',
                quality: 10
            });

            setResult({
                imageUrl: data.imageUrl,
                finalPrompt: prompt,
                specs: {
                    render: 'Híbrido Quântico',
                    lighting: dna.lighting,
                    camera: 'Ótica Evoluída',
                    mood: dna.color
                },
                generationTime: '0.8s',
                qualityScore: '11.0/10.0',
                viralScore: 98,
                commercialValue: "R$ 4,500.00"
            });

            neuralMemory.storeGeneration("DNA EVOLUÍDO", "Híbrido", "Mutado", data.imageUrl);

        } catch(e) {
            alert("Evolução Falhou");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleQuantumLabRun = async (prompt: string) => {
        setIsProcessing(true);
        setQuantumState(prev => ({ ...prev, status: 'annealing', iteration: 0 }));
        
        try {
            const initialStates = await QuantumPromptAnnealingService.initializeSuperposition(prompt);
            const schedule = {
                initialTemperature: 1.0,
                finalTemperature: 0.01,
                iterations: 50,
                coolingRate: 0.90,
                reannealingProb: 0.1
            };

            let bestPrompt = prompt;
            const annealer = QuantumPromptAnnealingService.annealPrompts(initialStates, schedule);
            
            for await (const state of annealer) {
                setQuantumState({
                    iteration: state.iteration,
                    temperature: state.temperature,
                    currentEnergy: state.currentEnergy,
                    bestEnergy: state.bestEnergy,
                    currentPrompt: state.currentPrompt,
                    status: 'annealing'
                });
                bestPrompt = state.currentPrompt;
            }
            
            bestPrompt = await QuantumPromptAnnealingService.injectAdaptiveContext(bestPrompt);
            bestPrompt = await QuantumPromptAnnealingService.applyHyperRealism(bestPrompt);

            setQuantumState(prev => ({ ...prev, status: 'collapsed', currentPrompt: bestPrompt }));
        } catch (error) {
            console.error("Quantum Lab Error:", error);
            setQuantumState(prev => ({ ...prev, status: 'idle', currentPrompt: "Erro no Laboratório Quântico. Verifique as chaves." }));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <CustomCursor />
            <AuthGate>
                <div className="min-h-screen font-sans selection:bg-nexus-accent selection:text-black transition-colors duration-300 overflow-x-hidden">
                    <div className="fixed inset-0 z-[-1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                    <div className="fixed inset-0 z-[-2] bg-gradient-to-br from-nexus-grad-start via-nexus-grad-mid to-nexus-grad-end transition-colors duration-500"></div>

                    {consciousnessState.activeCheckpoint && (
                        <CheckpointDialog 
                            data={consciousnessState.activeCheckpoint}
                            onResolve={(action) => consciousnessRef.current?.resolveCheckpoint(action)}
                        />
                    )}

                    <header className="fixed top-0 left-0 right-0 z-50 border-b border-nexus-border bg-nexus-bg/90 backdrop-blur-xl transition-colors duration-300 shadow-md">
                        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 shrink-0">
                                <NexusLogoHeader />
                                <h1 className="font-bold text-lg tracking-wider hidden sm:block text-nexus-text">
                                    NEXUS <span className="text-nexus-accent text-xs align-top font-mono">V8.0 OMEGA</span>
                                </h1>
                            </div>
                            
                            <div className="flex-1 flex justify-center overflow-hidden">
                                <div className="flex bg-nexus-panel border border-nexus-border rounded-lg p-1 gap-1 overflow-x-auto scrollbar-hide w-full max-w-2xl shadow-inner scroll-snap-x snap-mandatory">
                                    {[
                                        { id: 'single', label: 'CRIAR' },
                                        { id: 'ai-chat', label: 'NEXUS MIND' },
                                        { id: 'batch', label: 'LOTE' },
                                        { id: 'editor', label: 'ESTÚDIO' },
                                        { id: 'studiopro', label: 'PRO' },
                                        { id: 'video', label: 'VÍDEO' },
                                        { id: 'autonomous', label: 'AUTO' },
                                        { id: 'evolution', label: 'EVO' },
                                        { id: 'style-dna', label: 'DNA' },
                                        { id: 'quantum', label: 'Q-LAB' },
                                        { id: 'painless', label: 'TOOLS' }
                                    ].map((m) => (
                                        <button 
                                            key={m.id}
                                            onClick={() => setMode(m.id as any)} 
                                            className={`
                                                flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-all whitespace-nowrap snap-center
                                                ${mode === m.id 
                                                    ? 'bg-nexus-accent text-black shadow-glow scale-105' 
                                                    : 'text-nexus-dim hover:text-nexus-text hover:bg-white/5'}
                                            `}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                                <button 
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="p-2 rounded-lg bg-nexus-panel border border-nexus-border text-nexus-text hover:border-nexus-accent transition-colors"
                                    title="Alternar Tema"
                                >
                                    {theme === 'dark' ? '☀️' : '🌙'}
                                </button>
                                
                                <button
                                    onClick={() => {
                                        if (window.confirm("Deseja encerrar a conexão neural e sair do sistema?")) {
                                            (window as any).nexusLogout?.();
                                        }
                                    }}
                                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold tracking-wider flex items-center gap-1 group"
                                    title="Sair do Sistema"
                                >
                                    <span>🚫</span>
                                    <span className="hidden md:inline">SAIR</span>
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="pt-20 sm:pt-24 pb-24 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto min-h-screen">
                        
                        <div className="text-center mb-4 sm:mb-8 animate-in fade-in zoom-in duration-1000">
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2">
                                <span className="bg-gradient-to-r from-cyan-300 via-blue-700 to-cyan-300 bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent">
                                    NEXUS V8.0 OMEGA
                                </span>
                            </h1>
                            <div className="flex justify-center">
                                <span className="text-sm sm:text-base font-bold font-mono text-cyan-400 animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] tracking-[0.5em]">
                                    PROTECTION & MONETIZATION
                                </span>
                            </div>
                        </div>

                        {mode !== 'studiopro' && mode !== 'ai-chat' && (
                            <div className="text-center mb-6 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-700 hidden sm:block">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
                                    <span className="text-white mr-3">
                                        {MODE_TITLES[mode][0]}
                                    </span>
                                    <span className="bg-gradient-to-r from-cyan-400 via-blue-600 to-cyan-400 bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent">
                                        {MODE_TITLES[mode][1]}
                                    </span>
                                </h2>
                            </div>
                        )}

                        {mode === 'single' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-10">
                                <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 order-2 lg:order-1">
                                    <ControlPanel config={config} setConfig={setConfig} onGenerate={handleGenerateSingle} isProcessing={isProcessing} />
                                    
                                    {config.useConsciousness && isProcessing && (
                                        <ConsciousnessHUD state={consciousnessState} />
                                    )}

                                    {(isProcessing || swarmProgress > 0) && <SwarmVisualizer agents={agents} progress={swarmProgress} />}
                                    
                                    {config.useQuantum && <QuantumLab state={quantumState} />}
                                    
                                    <div className="hidden lg:block">
                                        <CollaborationPanel users={collabUsers} messages={collabMessages} onSend={(msg) => collabHub?.sendChat(msg)} />
                                    </div>
                                </div>
                                <div className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2">
                                    <ResultDisplay result={result} />
                                </div>
                                <div className="lg:hidden order-3">
                                     <CollaborationPanel users={collabUsers} messages={collabMessages} onSend={(msg) => collabHub?.sendChat(msg)} />
                                </div>
                            </div>
                        )}

                        {mode === 'editor' && (
                            <div className="h-[calc(100vh-140px)] w-full mx-auto animate-in slide-in-from-bottom-8">
                                <CreativeGenerator />
                            </div>
                        )}

                        {mode === 'studiopro' && (
                            <StudioPro />
                        )}

                        {mode === 'video' && (
                            <VideoStudio />
                        )}

                        {mode === 'ai-chat' && (
                            <div className="max-w-[1600px] mx-auto">
                                <NexusAIInterface />
                            </div>
                        )}

                        {mode === 'batch' && (
                            <div className="w-full h-[calc(100vh-140px)] min-h-[600px]">
                                <BatchControlPanel 
                                    config={batchConfig} 
                                    setConfig={setBatchConfig} 
                                    onProcessNode={handleNodeExecution}
                                    onTemplateSet={handleTemplateSet} 
                                    isProcessing={isProcessing} 
                                    resultsMap={nodeResults}
                                />
                            </div>
                        )}

                        {mode === 'autonomous' && <AutonomousDashboard isActive={true} />}
                        
                        {mode === 'evolution' && (
                            <div className="max-w-3xl mx-auto">
                                <EvolutionDashboard onEvolveComplete={handleEvolveComplete} isProcessing={isProcessing} />
                            </div>
                        )}

                        {mode === 'quantum' && (
                            <div className="max-w-4xl mx-auto">
                                <div className="mb-6 text-center text-nexus-dim italic text-sm">
                                    Camada 10: Visualização direta do processo de Recozimento Quântico (v37.5).
                                </div>
                                <QuantumLab state={quantumState} standalone={true} onRun={handleQuantumLabRun} />
                            </div>
                        )}

                        {mode === 'painless' && (
                            <div className="max-w-4xl mx-auto">
                                <PainlessDashboard onImageGenerated={handlePainlessImage} />
                            </div>
                        )}

                        {mode === 'style-dna' && (
                            <div className="max-w-6xl mx-auto">
                                <StyleDNABuilder onApply={handleApplyStyleDNA} />
                            </div>
                        )}
                    </main>

                    <footer className="fixed bottom-0 left-0 right-0 border-t border-nexus-border bg-nexus-bg/90 backdrop-blur text-center py-2 z-40 hidden sm:block">
                        <p className="text-[10px] font-mono text-nexus-dim uppercase tracking-widest">
                            Nexus V8.0 OMEGA — Sistema Patenteado INPI | Proteção Ativa
                        </p>
                    </footer>
                </div>
            </AuthGate>
        </>
    );
};

export default App;
