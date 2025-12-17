
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatWithNexus } from '../geminiService';
import { ChatMessage } from '../nexusDb'; 
import { supabase } from '../supabaseClient';

// --- TYPES ---
interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    updatedAt: number;
}

interface Attachment {
    id: string;
    file: File;
    data: string; // Base64
    mimeType: string;
    name: string;
}

// --- HELPER: SIMPLE MARKDOWN PARSER ---
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="space-y-2 text-sm leading-relaxed">
            {parts.map((part, index) => {
                if (part.startsWith('```')) {
                    // Code Block
                    const codeContent = part.replace(/```[a-z]*\n?/, '').replace(/```$/, '');
                    const language = part.match(/```([a-z]*)/)?.[1] || 'Code';
                    return (
                        <div key={index} className="bg-[#0d1117] rounded-lg border border-white/10 overflow-hidden my-3 shadow-lg">
                            <div className="bg-white/5 px-3 py-1.5 text-[10px] font-mono text-gray-400 flex justify-between items-center border-b border-white/5">
                                <span className="uppercase">{language}</span>
                                <button 
                                    className="hover:text-nexus-accent transition-colors flex items-center gap-1" 
                                    onClick={() => navigator.clipboard.writeText(codeContent)}
                                >
                                    <span>📋</span> Copy
                                </button>
                            </div>
                            <pre className="p-3 overflow-x-auto text-xs font-mono text-green-400 custom-scrollbar">
                                <code>{codeContent}</code>
                            </pre>
                        </div>
                    );
                } else {
                    // Text with inline formatting
                    const textParts = part.split(/(\*\*.*?\*\*)/g);
                    return (
                        <span key={index} className="whitespace-pre-wrap">
                            {textParts.map((t, i) => {
                                if (t.startsWith('**') && t.endsWith('**')) {
                                    return <strong key={i} className="text-white font-bold">{t.slice(2, -2)}</strong>;
                                }
                                return t;
                            })}
                        </span>
                    );
                }
            })}
        </div>
    );
};

const NexusAIInterface: React.FC = () => {
    // --- STATE ---
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // Multi-File Attachments
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    
    // Admin Check
    const [isAdmin, setIsAdmin] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- INIT ---
    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const env = (import.meta as any).env || {};
            const adminEmail = env.VITE_ADMIN_EMAIL || 'mathias2matheus2@gmail.com';
            if (user?.email?.toLowerCase() === adminEmail.toLowerCase()) {
                setIsAdmin(true);
            }
        };
        checkAdmin();

        // Load from local storage or create new
        const saved = localStorage.getItem('nexus_ai_sessions');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSessions(parsed);
                if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
                else createNewSession();
            } catch(e) { createNewSession(); }
        } else {
            createNewSession();
        }
    }, []);

    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('nexus_ai_sessions', JSON.stringify(sessions));
        }
    }, [sessions]);

    useEffect(() => {
        scrollToBottom();
    }, [sessions, currentSessionId, isThinking]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- ACTIONS ---

    const createNewSession = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'Nova Conversa',
            messages: [],
            updatedAt: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        if (window.innerWidth < 768) setSidebarOpen(false);
        setAttachments([]);
        setInput('');
    };

    const deleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSessions = sessions.filter(s => s.id !== id);
        setSessions(newSessions);
        if (currentSessionId === id) {
            if (newSessions.length > 0) setCurrentSessionId(newSessions[0].id);
            else createNewSession();
        }
    };

    // --- FILE HANDLING ---

    const processFiles = (files: FileList | null) => {
        if (!files || !isAdmin) return; // Admin check here as backup
        
        const fileArray = Array.from(files);
        
        // Cumulative count check (fix for batch upload)
        if (attachments.length + fileArray.length > 10) {
            alert(`Máximo de 10 arquivos por vez. Você já tem ${attachments.length} e tentou adicionar ${fileArray.length}.`);
            return;
        }

        fileArray.forEach(file => {
            // Limit check (5MB per file)
            if (file.size > 5 * 1024 * 1024) {
                alert(`Arquivo ${file.name} muito grande (Max 5MB).`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target?.result as string;
                const mimeType = base64.substring(base64.indexOf(':') + 1, base64.indexOf(';'));
                const data = base64.split(',')[1];
                
                setAttachments(prev => [...prev, {
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    data,
                    mimeType,
                    name: file.name
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
        e.target.value = ''; // Reset input
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    // --- DRAG AND DROP ---

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (!isAdmin) return;
        e.preventDefault();
        setIsDragging(true);
    }, [isAdmin]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        if (!isAdmin) return;
        e.preventDefault();
        setIsDragging(false);
    }, [isAdmin]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        if (!isAdmin) return;
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    }, [attachments, isAdmin]);

    // --- MESSAGING ---

    const sendMessage = async () => {
        if ((!input.trim() && attachments.length === 0) || !currentSessionId) return;

        const session = sessions.find(s => s.id === currentSessionId);
        if (!session) return;

        const userText = input.trim();
        const currentAttachments = [...attachments];
        
        // Reset Inputs
        setInput('');
        setAttachments([]);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        // 1. Add User Message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            // Fallback text if user sends only files, to ensure history integrity and non-empty display
            text: userText || (currentAttachments.length > 0 ? "Analisar arquivos anexados." : ""),
            sender: 'user',
            userId: 'me',
            timestamp: new Date().toISOString(),
            attachmentName: currentAttachments.length > 0 
                ? `${currentAttachments.length} arquivo(s): ${currentAttachments.map(a => a.name).join(', ')}` 
                : undefined
        };

        const updatedMessages = [...session.messages, userMsg];
        
        // Optimistic Update
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return {
                    ...s,
                    messages: updatedMessages,
                    title: s.messages.length === 0 ? (userText.slice(0, 30) || 'Nova Análise') : s.title,
                    updatedAt: Date.now()
                };
            }
            return s;
        }));

        setIsThinking(true);

        try {
            // Prepare History - Filter out empty/invalid messages to prevent API errors
            const geminiHistory = updatedMessages.slice(0, -1)
                .filter(m => m.text && m.text.trim() !== "")
                .map(m => ({
                    role: m.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: m.text }]
                }));

            // System Prompt
            const systemInstruction = `Você é o NEXUS MIND, um sistema de inteligência artificial multimodal avançado.
            Você tem a capacidade de ver e analisar múltiplos arquivos (imagens, documentos de texto) enviados pelo usuário.
            
            Diretrizes:
            1. Se houver imagens, descreva-as tecnicamente se solicitado, ou use-as como contexto para prompts.
            2. Se houver código, analise e sugira melhorias ou explique.
            3. Use Markdown para formatar sua resposta (negrito para ênfase, blocos de código, listas).
            4. Mantenha um tom profissional, técnico e "cyberpunk" futurista.
            5. Seja conciso, mas detalhado onde importa.`;

            const payloadAttachments = currentAttachments.map(a => ({
                mimeType: a.mimeType,
                data: a.data
            }));

            // Send original userText (can be empty if file only), the service handles parts construction
            const responseText = await chatWithNexus(
                geminiHistory,
                userText,
                systemInstruction,
                payloadAttachments
            );

            // 2. Add AI Message
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'ai',
                userId: 'nexus',
                timestamp: new Date().toISOString()
            };

            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    return { ...s, messages: [...updatedMessages, aiMsg] };
                }
                return s;
            }));

        } catch (error) {
            console.error("Nexus Mind Error:", error);
            const errorMsg: ChatMessage = {
                id: Date.now().toString(),
                text: "Erro crítico no processamento neural. Verifique sua conexão ou se os arquivos são suportados.",
                sender: 'system',
                userId: 'system',
                timestamp: new Date().toISOString()
            };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...updatedMessages, errorMsg] } : s));
        } finally {
            setIsThinking(false);
        }
    };

    const activeSession = sessions.find(s => s.id === currentSessionId);

    return (
        <div className="flex h-[calc(100vh-140px)] w-full bg-[#050505] border border-nexus-border rounded-xl overflow-hidden shadow-2xl relative animate-in fade-in duration-500">
            {/* Reusing existing layout structure */}
            <div className={`absolute md:relative z-30 h-full w-64 bg-nexus-panel border-r border-nexus-border flex flex-col transition-transform duration-300 shadow-xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'}`}>
                <div className="p-4 border-b border-nexus-border flex justify-between items-center bg-nexus-panel">
                    <button onClick={createNewSession} className="flex-1 bg-nexus-text text-black py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"><span>+</span> Novo Chat</button>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-2 text-nexus-dim p-2">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                    {sessions.map(session => (
                        <div key={session.id} onClick={() => { setCurrentSessionId(session.id); if(window.innerWidth < 768) setSidebarOpen(false); }} className={`group p-3 rounded-lg cursor-pointer text-xs transition-all relative pr-8 border border-transparent ${currentSessionId === session.id ? 'bg-nexus-accent/10 border-nexus-accent/30 text-white shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'text-nexus-dim hover:bg-white/5 hover:text-gray-200'}`}>
                            <div className="font-bold truncate mb-1 text-[11px]">{session.title}</div>
                            <div className="text-[9px] opacity-50 flex justify-between font-mono"><span>{new Date(session.updatedAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span></div>
                            <button onClick={(e) => deleteSession(session.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-all">🗑️</button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col relative bg-[#020202]" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                {/* Drag Overlay - Admin Only */}
                {isAdmin && isDragging && (
                    <div className="absolute inset-0 z-50 bg-nexus-accent/10 backdrop-blur-sm border-2 border-dashed border-nexus-accent flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
                        <div className="text-6xl mb-4 animate-bounce">📂</div>
                        <h3 className="text-2xl font-bold text-white tracking-widest">SOLTE OS ARQUIVOS AQUI</h3>
                        <p className="text-nexus-accent">Adicionar ao Nexus Context (Admin Only)</p>
                    </div>
                )}
                
                <div className="h-14 border-b border-nexus-border bg-nexus-panel/50 backdrop-blur flex items-center justify-between px-4 z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-nexus-dim hover:text-white p-2 rounded hover:bg-white/5 transition-colors">{sidebarOpen ? '◀' : '▶'}</button>
                        <div className="flex items-center gap-2"><span className="text-xl animate-pulse-fast">💠</span><div><h2 className="text-sm font-bold text-white tracking-wider">NEXUS MIND</h2><p className="text-[9px] text-nexus-accent uppercase font-mono">Gemini 1.5 Pro + Vision</p></div></div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
                    {activeSession?.messages.map((msg) => (
                        <div key={msg.id} className={`group flex gap-4 max-w-4xl mx-auto ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-secondary to-nexus-accent flex-shrink-0 flex items-center justify-center text-xs font-bold text-black shadow-lg shadow-nexus-accent/20">AI</div>}
                            <div className={`max-w-[90%] md:max-w-[75%] p-5 rounded-2xl text-sm shadow-sm relative ${msg.sender === 'user' ? 'bg-[#1a1a1a] text-white rounded-tr-sm border border-white/10' : 'bg-transparent text-nexus-text pl-0 md:pl-0'}`}>
                                {msg.attachmentName && <div className="mb-3 inline-flex flex-wrap gap-2"><div className="bg-nexus-surface border border-nexus-border px-3 py-1.5 rounded-lg text-xs text-nexus-success flex items-center gap-2"><span>📎</span> <span className="font-mono font-bold">{msg.attachmentName}</span></div></div>}
                                <MarkdownRenderer content={msg.text} />
                            </div>
                            {msg.sender === 'user' && <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex-shrink-0 flex items-center justify-center text-xs text-nexus-dim">EU</div>}
                        </div>
                    ))}
                    {isThinking && <div className="flex gap-4 max-w-4xl mx-auto items-start animate-pulse"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-secondary to-nexus-accent flex items-center justify-center text-xs font-bold text-black">AI</div><div className="flex items-center gap-1 h-8 px-2"><div className="w-1.5 h-1.5 bg-nexus-dim rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-nexus-dim rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-nexus-dim rounded-full animate-bounce delay-150"></div></div></div>}
                    <div ref={messagesEndRef} className="h-4" />
                </div>

                <div className="p-4 md:pb-6 bg-[#020202]">
                    <div className="max-w-3xl mx-auto relative group">
                        <div className={`relative bg-nexus-panel border transition-all rounded-3xl overflow-hidden shadow-2xl flex flex-col ${isDragging ? 'border-nexus-accent bg-nexus-accent/5' : 'border-nexus-border focus-within:border-nexus-accent/50 focus-within:bg-nexus-panel/80'}`}>
                            
                            {/* Attachments List - Admin Only */}
                            {isAdmin && attachments.length > 0 && (
                                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide bg-black/20 border-b border-white/5">
                                    {attachments.map(att => (
                                        <div key={att.id} className="relative group/att flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-black">
                                            {att.mimeType.startsWith('image/') ? <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📄</div>}
                                            <button onClick={() => removeAttachment(att.id)} className="absolute top-0.5 right-0.5 bg-black/80 text-red-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover/att:opacity-100 transition-opacity">✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-end gap-2 p-3">
                                {/* Attachment Button - Admin Only */}
                                {isAdmin && (
                                    <>
                                        <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-nexus-dim hover:text-nexus-accent transition-colors rounded-full hover:bg-white/5 flex-shrink-0">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                                    </>
                                )}
                                
                                <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={isAdmin ? "Pergunte ao Nexus ou envie arquivos..." : "Pergunte ao Nexus..."} className="flex-1 bg-transparent text-white py-3 max-h-48 min-h-[44px] outline-none resize-none scrollbar-hide font-mono text-sm leading-relaxed placeholder:text-nexus-dim/50" rows={1} />
                                <button onClick={sendMessage} disabled={!input.trim() && attachments.length === 0} className={`p-2.5 rounded-full transition-all flex-shrink-0 mb-0.5 ${(input.trim() || attachments.length > 0) ? 'bg-nexus-text text-black hover:bg-white hover:scale-105 shadow-glow' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NexusAIInterface;
