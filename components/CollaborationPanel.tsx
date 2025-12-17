
import React, { useState, useEffect, useRef } from 'react';
import { CollabUser } from '../types';
import { subscribeToChat, sendChatMessage, ChatMessage } from '../nexusDb';
import { chatWithNexus } from '../geminiService';
import { supabase } from '../supabaseClient';

interface CollaborationPanelProps {
    users: CollabUser[];
    messages: string[]; 
    onSend: (msg: string) => void;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ users, onSend }) => {
    const [input, setInput] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Config State
    const [showConfig, setShowConfig] = useState(false);
    const [agentName, setAgentName] = useState('NEXUS');
    const [systemInstruction, setSystemInstruction] = useState('Você é NEXUS, uma IA avançada integrada ao Light Designer. Sua função é ajudar o usuário com prompts criativos, ideias de design e comandos técnicos. Mantenha um tom futurista, conciso e prestativo.');
    
    // Context File State
    const [contextFile, setContextFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        fetchUser();
    }, []);
    
    useEffect(() => {
        const unsubscribe = subscribeToChat((msgs) => {
            setChatHistory(msgs);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isAiThinking]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Arquivo muito grande (Max 5MB).");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string;
            const mimeType = base64.substring(base64.indexOf(':') + 1, base64.indexOf(';'));
            const data = base64.split(',')[1];
            
            setContextFile({ data, mimeType, name: file.name });
        };
        reader.readAsDataURL(file);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsgText = input.trim();
        setInput('');

        const msgPayload = {
            text: userMsgText,
            sender: 'user' as const,
            userId: currentUser?.id || 'anon',
            userName: currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Operative',
            userColor: '#00f0ff'
        };

        // Optimistic Update
        const optimisticMsg: ChatMessage = {
            ...msgPayload,
            id: `local-${Date.now()}`,
            timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, optimisticMsg]);

        // Send to Supabase
        sendChatMessage(msgPayload).catch(err => console.warn("Sync warning", err));

        onSend(userMsgText);

        const shouldTriggerAI = userMsgText.toLowerCase().includes('nexus') || userMsgText.toLowerCase().includes('ai') || userMsgText.startsWith('/');

        if (shouldTriggerAI) {
            setIsAiThinking(true);
            
            const history = chatHistory.slice(-10).map(msg => ({
                role: msg.sender === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));

            try {
                const aiResponse = await chatWithNexus(
                    history, 
                    userMsgText, 
                    systemInstruction,
                    contextFile ? [{ mimeType: contextFile.mimeType, data: contextFile.data }] : undefined
                );
                
                const aiMsgPayload = {
                    text: aiResponse,
                    sender: 'ai' as const,
                    userId: 'nexus-core',
                    userName: agentName,
                    userColor: '#7000ff'
                };

                // AI response also goes to Supabase to persist history
                await sendChatMessage(aiMsgPayload);
                
                // Optimistic update for AI response (though subscription usually catches it fast)
                // setChatHistory(prev => [...prev, { ...aiMsgPayload, id: `ai-${Date.now()}`, timestamp: new Date().toISOString() }]);

            } catch (error) {
                console.error("AI Chat Error:", error);
            } finally {
                setIsAiThinking(false);
            }
        }
    };

    return (
        <div className="glass-panel rounded-xl p-4 flex flex-col h-full min-h-[400px] border border-nexus-border/50 shadow-lg relative overflow-hidden">
            
            <div className="flex items-center gap-2 mb-4 border-b border-nexus-border pb-4 justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-nexus-success animate-pulse shadow-[0_0_10px_#00ff9d]"></span>
                    <h3 className="text-xs font-bold text-nexus-text tracking-widest font-mono">BATE-PAPO NEXUS</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowConfig(!showConfig)}
                        className={`p-1.5 rounded hover:bg-nexus-accent/20 transition-colors ${showConfig ? 'text-nexus-accent' : 'text-nexus-dim'}`}
                        title="Configurar Agente"
                    >
                        ⚙️
                    </button>
                </div>
            </div>

            {showConfig && (
                <div className="absolute inset-x-0 top-14 bottom-0 bg-nexus-panel/95 backdrop-blur-md z-20 p-4 flex flex-col gap-4 animate-in slide-in-from-top-4 border-t border-nexus-accent/30">
                    <div>
                        <h4 className="text-xs font-bold text-nexus-accent mb-2 uppercase tracking-widest">Configuração do Agente</h4>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                        <div>
                            <label className="block text-[10px] text-nexus-text mb-1 font-mono">NOME DO AGENTE</label>
                            <input type="text" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-nexus-text mb-1 font-mono">ARQUIVO DE CONTEXTO</label>
                            <div onClick={() => fileInputRef.current?.click()} className={`w-full border-2 border-dashed rounded-lg p-3 text-center cursor-pointer ${contextFile ? 'border-nexus-success bg-nexus-success/5' : 'border-nexus-border'}`}>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,text/plain" className="hidden" />
                                {contextFile ? <div className="text-[10px] text-nexus-success font-bold">{contextFile.name}</div> : <div className="text-[10px] text-nexus-dim">Clique para adicionar arquivo</div>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] text-nexus-text mb-1 font-mono">INSTRUÇÕES DE SISTEMA</label>
                            <textarea value={systemInstruction} onChange={(e) => setSystemInstruction(e.target.value)} className="w-full h-32 bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white resize-none" />
                        </div>
                    </div>
                    <button onClick={() => setShowConfig(false)} className="w-full py-2 bg-nexus-accent text-black font-bold text-xs rounded">SALVAR</button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-hide max-h-[300px]">
                {chatHistory.map((msg) => (
                    <div key={msg.id || Math.random()} className={`flex flex-col ${msg.sender === 'user' && msg.userId === (currentUser?.id || 'anon') ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${msg.sender === 'ai' ? 'text-nexus-accent' : 'text-nexus-dim'}`}>{msg.sender === 'ai' ? msg.userName : msg.userName}</span>
                        </div>
                        <div className={`text-xs font-mono p-2.5 rounded-lg max-w-[85%] break-words shadow-sm relative overflow-hidden ${msg.sender === 'ai' ? 'bg-nexus-secondary/10 border border-nexus-secondary/30 text-nexus-text' : (msg.userId === (currentUser?.id || 'anon') ? 'bg-nexus-accent/10 border border-nexus-accent/30 text-nexus-text' : 'bg-nexus-bg/50 border border-nexus-border text-nexus-dim')}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isAiThinking && (
                    <div className="flex flex-col items-start animate-pulse">
                        <div className="bg-nexus-secondary/10 border border-nexus-secondary/30 p-2.5 rounded-lg text-xs text-nexus-text">Digitando...</div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} className="relative group">
                {contextFile && !showConfig && <div className="absolute -top-6 left-0 text-[9px] text-nexus-success bg-nexus-success/10 px-2 py-0.5 rounded border border-nexus-success/30">📎 {contextFile.name}</div>}
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Conversar com ${agentName}...`} className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-4 py-3 text-xs text-nexus-text focus:border-nexus-success outline-none" />
            </form>
        </div>
    );
};

export default CollaborationPanel;
