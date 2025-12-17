
import React, { useEffect, useRef, useState } from 'react';
import { ActivityLog, AutonomousMetrics, MarketListing } from '../types';
import { analyzeTrends, generateAutonomousImage } from '../geminiService';

interface AutonomousDashboardProps {
    isActive: boolean;
}

const AutonomousDashboard: React.FC<AutonomousDashboardProps> = ({ isActive }) => {
    const [metrics, setMetrics] = useState<AutonomousMetrics>({
        totalGenerated: 0,
        totalRevenue: 0,
        trendAccuracy: 87, // Seed value
        engineStatus: 'idle',
        activeTrend: 'Analisando...'
    });

    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [listings, setListings] = useState<MarketListing[]>([]);
    
    const metricsRef = useRef(metrics);
    const listingsRef = useRef(listings);
    const engineRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const salesRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => { metricsRef.current = metrics; }, [metrics]);
    useEffect(() => { listingsRef.current = listings; }, [listings]);

    const addLog = (message: string, type: ActivityLog['type'] = 'info') => {
        const newLog: ActivityLog = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        };
        setLogs(prev => [newLog, ...prev].slice(0, 50));
    };

    const startEngine = async () => {
        if (engineRef.current) return;
        
        addLog('🚀 Sequência de motor iniciada. Handshake Neural...', 'info');
        setMetrics(prev => ({ ...prev, engineStatus: 'running' }));

        // 1. Initial Trend Analysis
        addLog('🔍 Raspando tendências visuais de [SIMULADO] Behance/Dribbble...', 'info');
        const trendData = await analyzeTrends();
        setMetrics(prev => ({ ...prev, activeTrend: trendData.trendName }));
        addLog(`✅ Tendência Identificada: ${trendData.trendName}`, 'trend');

        // 2. Generation Loop (Every 8 seconds for demo purposes)
        engineRef.current = setInterval(async () => {
            const conceptConfig = trendData.concepts[Math.floor(Math.random() * trendData.concepts.length)];
            
            addLog(`🎨 Gerando: ${conceptConfig.concept.substring(0, 30)}...`, 'info');
            
            try {
                const listing = await generateAutonomousImage(conceptConfig);
                setListings(prev => [listing, ...prev]);
                setMetrics(prev => ({ 
                    ...prev, 
                    totalGenerated: prev.totalGenerated + 1 
                }));
                addLog(`✨ Listado no Marketplace: $${listing.price}`, 'success');
            } catch (e) {
                addLog(`❌ Erro de Geração: ${(e as Error).message}`, 'info');
            }

        }, 8000);

        // 3. Sales Loop (Random sales simulation)
        salesRef.current = setInterval(() => {
            const currentListings = listingsRef.current.filter(l => l.status === 'listed');
            if (currentListings.length > 0) {
                if (Math.random() > 0.4) {
                    const soldItem = currentListings[Math.floor(Math.random() * currentListings.length)];
                    
                    setListings(prev => prev.map(l => l.id === soldItem.id ? { ...l, status: 'sold' } : l));
                    
                    setMetrics(prev => ({
                        ...prev,
                        totalRevenue: prev.totalRevenue + soldItem.price
                    }));

                    addLog(`💰 VENDIDO: ${soldItem.concept.substring(0, 20)}... por $${soldItem.price}`, 'sale');
                }
            }
        }, 3000);
    };

    const stopEngine = () => {
        if (engineRef.current) clearInterval(engineRef.current);
        if (salesRef.current) clearInterval(salesRef.current);
        engineRef.current = null;
        salesRef.current = null;
        setMetrics(prev => ({ ...prev, engineStatus: 'paused' }));
        addLog('⏸️ Motor pausado.', 'info');
    };

    useEffect(() => {
        return () => stopEngine();
    }, []);

    if (!isActive) return null;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Control Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-nexus-panel p-6 rounded-2xl border border-nexus-border">
                <div>
                    <h2 className="text-2xl font-black text-white">MOTOR DE <span className="text-nexus-accent">EVOLUÇÃO</span> AUTÔNOMO</h2>
                    <p className="text-nexus-dim text-xs font-mono">IA gerando, aprendendo e vendendo 24/7 sem intervenção humana.</p>
                </div>
                <div className="flex gap-2">
                    {metrics.engineStatus !== 'running' ? (
                        <button 
                            onClick={startEngine}
                            className="bg-nexus-success/20 text-nexus-success border border-nexus-success hover:bg-nexus-success/40 px-6 py-3 rounded-lg font-bold font-mono transition-all flex items-center gap-2"
                        >
                            <span>▶</span> INICIAR MOTOR
                        </button>
                    ) : (
                        <button 
                            onClick={stopEngine}
                            className="bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500/40 px-6 py-3 rounded-lg font-bold font-mono transition-all flex items-center gap-2"
                        >
                            <span>⏸</span> PAUSAR MOTOR
                        </button>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-nexus-panel p-4 rounded-xl border border-nexus-border">
                    <div className="text-nexus-dim text-xs font-mono uppercase">Total Gerado</div>
                    <div className="text-3xl font-bold text-white mt-1">{metrics.totalGenerated}</div>
                </div>
                <div className="bg-nexus-panel p-4 rounded-xl border border-nexus-border">
                    <div className="text-nexus-dim text-xs font-mono uppercase">Receita Total</div>
                    <div className="text-3xl font-bold text-nexus-success mt-1">${metrics.totalRevenue.toFixed(2)}</div>
                </div>
                <div className="bg-nexus-panel p-4 rounded-xl border border-nexus-border">
                    <div className="text-nexus-dim text-xs font-mono uppercase">Precisão Tendência</div>
                    <div className="text-3xl font-bold text-nexus-secondary mt-1">{metrics.trendAccuracy}%</div>
                </div>
                <div className="bg-nexus-panel p-4 rounded-xl border border-nexus-border">
                    <div className="text-nexus-dim text-xs font-mono uppercase">Tendência Ativa</div>
                    <div className="text-lg font-bold text-nexus-accent mt-2 truncate">{metrics.activeTrend}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Marketplace Feed */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <h3 className="text-sm font-mono text-nexus-dim uppercase tracking-widest border-b border-nexus-border pb-2">Feed do Marketplace ao Vivo</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {listings.length === 0 && (
                            <div className="col-span-full h-32 flex items-center justify-center text-nexus-dim text-sm italic border border-dashed border-nexus-border rounded-xl">
                                Motor ocioso. Marketplace vazio.
                            </div>
                        )}
                        {listings.map(item => (
                            <div key={item.id} className={`group relative rounded-xl overflow-hidden border transition-all duration-300 ${item.status === 'sold' ? 'border-nexus-success opacity-75' : 'border-nexus-border hover:border-nexus-accent'}`}>
                                <div className="aspect-square bg-black relative">
                                    <img src={item.imageUrl} className="w-full h-full object-cover" alt="Art" />
                                    {item.status === 'sold' && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-nexus-success font-black text-xl rotate-[-15deg] border-4 border-nexus-success px-4 py-1 rounded">VENDIDO</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-nexus-panel">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-white font-bold text-sm">${item.price}</span>
                                        <span className="text-[10px] text-nexus-accent font-mono">SCORE: {item.trendScore}</span>
                                    </div>
                                    <div className="text-[10px] text-nexus-dim truncate">{item.concept}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Log */}
                <div className="bg-nexus-panel rounded-xl border border-nexus-border p-4 h-[500px] flex flex-col">
                    <h3 className="text-sm font-mono text-nexus-dim uppercase tracking-widest mb-4">Log de Atividade Neural</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
                        {logs.map(log => (
                            <div key={log.id} className="text-xs font-mono border-l-2 border-nexus-border pl-3 py-1 animate-in slide-in-from-left-2">
                                <span className="text-nexus-dim block text-[10px]">{log.timestamp}</span>
                                <span className={`${
                                    log.type === 'sale' ? 'text-nexus-success' : 
                                    log.type === 'trend' ? 'text-nexus-secondary' : 
                                    log.type === 'success' ? 'text-nexus-accent' : 
                                    'text-gray-400'
                                }`}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutonomousDashboard;
