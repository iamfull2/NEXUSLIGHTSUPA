
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import LandingPage from './LandingPage';

interface AuthGateProps {
    children: React.ReactNode;
}

// Logo Component Local Definition for AuthGate
const NexusLogoSmall: React.FC = () => (
    <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center group cursor-pointer perspective-1000">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 via-slate-500 to-slate-800 shadow-[0_0_20px_rgba(0,240,255,0.3)] relative z-10 overflow-hidden transform transition-transform duration-700 group-hover:rotate-12">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50"></div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-nexus-success rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-nexus-secondary rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.8)]"></div>
            <div className="absolute inset-0 border border-slate-400/30 rounded-full opacity-50 rotate-45 scale-75"></div>
            <div className="absolute inset-0 border border-slate-400/30 rounded-full opacity-50 -rotate-45 scale-75"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-nexus-accent rounded-full blur-[1px] z-20 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-nexus-accent/30 rounded-full blur-md z-10 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
        </div>
        <div className="absolute inset-0 bg-nexus-accent/20 rounded-full blur-xl group-hover:bg-nexus-secondary/30 transition-colors duration-1000 -z-10"></div>
    </div>
);

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'verifying' | 'granted' | 'denied' | 'creating'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [matrixChars, setMatrixChars] = useState<string>('');
    const [view, setView] = useState<'landing' | 'login'>('landing');
    
    useEffect(() => {
        // Check active session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setIsAuthenticated(true);
                    setStatus('granted');
                }
            } catch (e) {
                console.warn("Session check failed (Offline mode likely needed)", e);
            }
            setIsCheckingAuth(false);
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setIsAuthenticated(true);
                setStatus('granted');
            }
            setIsCheckingAuth(false);
        });

        // Matrix Rain Effect
        const interval = setInterval(() => {
            let result = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
            for (let i = 0; i < 100; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            setMatrixChars(result);
        }, 50);

        return () => {
            clearInterval(interval);
            subscription.unsubscribe();
        };
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        
        if (!email || !password) {
            setErrorMsg("Preencha todos os campos.");
            return;
        }

        // 🟢 GOD MODE / ADMIN BYPASS LOCAL
        const env = (import.meta as any).env || {};
        const adminEmail = env.VITE_ADMIN_EMAIL || 'mathias2matheus2@gmail.com';
        if (email.trim().toLowerCase() === adminEmail.toLowerCase() && password.trim() === 'MMK200981@@@@') {
            setStatus('verifying');
            await new Promise(resolve => setTimeout(resolve, 800)); // Simula verificação
            setStatus('granted');
            setTimeout(() => {
                setIsAuthenticated(true);
            }, 500);
            return;
        }

        if (isSignUp) setStatus('creating');
        else setStatus('scanning');

        try {
            if (isSignUp) {
                // REGISTRO NO SUPABASE
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: email.split('@')[0], // Username padrão baseado no email
                            role: 'operative',
                            created_via: 'nexus_web_v32'
                        }
                    }
                });

                if (error) throw error;

                // Verifica se o login foi direto (auto-confirm) ou requer email
                if (data.session) {
                    setStatus('granted');
                    // O onAuthStateChange vai lidar com o resto
                } else if (data.user) {
                    setStatus('idle');
                    alert("CADASTRO REALIZADO! Verifique seu email para ativar o Link Neural.");
                    setIsSignUp(false); // Volta para login para facilitar
                }

            } else {
                // LOGIN NO SUPABASE
                setStatus('verifying');
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                setStatus('granted');
            }
        } catch (error: any) {
            console.error("Auth Error:", error);
            
            const msg = error.message || "";

            // Tratamento de Erros Específicos
            if (msg.includes("already registered")) {
                setStatus('denied');
                setErrorMsg("Agente já registrado. Tente fazer login.");
                setTimeout(() => setStatus('idle'), 3000);
                return;
            }

            if (msg.includes("Invalid login credentials")) {
                setStatus('denied');
                setErrorMsg("Credenciais inválidas.");
                setTimeout(() => setStatus('idle'), 3000);
                return;
            }

            // 🛑 FALLBACK APENAS PARA ERRO DE REDE/OFFLINE
            if (msg.includes('fetch') || msg.includes('upstream') || error.status === 500) {
                
                setStatus('verifying');
                setErrorMsg("⚠️ Backend Offline. Ativando Protocolo Local...");
                
                await new Promise(resolve => setTimeout(resolve, 1500));
                setStatus('granted');
                setTimeout(() => setIsAuthenticated(true), 800);
                return;
            }

            // Erro Genérico
            setStatus('denied');
            setErrorMsg(msg || "Erro de conexão com a Matrix.");
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const handleGuestAccess = () => {
        setStatus('scanning');
        setTimeout(() => {
            setStatus('granted');
            setIsAuthenticated(true);
        }, 800);
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            // Ignore error if already signed out or offline
        }
        setIsAuthenticated(false);
        setStatus('idle');
        setView('landing'); 
    };

    useEffect(() => {
        if (isAuthenticated) {
            (window as any).nexusLogout = handleLogout;
        }
    }, [isAuthenticated]);

    if (isAuthenticated) {
        return (
            <div className="animate-in fade-in duration-1000">
                {children}
            </div>
        );
    }

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-nexus-bg-deep text-nexus-text font-mono flex flex-col items-center justify-center relative overflow-hidden z-[9999]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                <div className="w-16 h-16 border-4 border-t-nexus-accent border-r-nexus-secondary border-b-nexus-success border-l-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-xs tracking-[0.3em] text-nexus-accent animate-pulse">INICIALIZANDO UPLINK NEURAL...</div>
            </div>
        );
    }

    if (view === 'landing') {
        return (
            <LandingPage 
                onLogin={() => setView('login')} 
                onGuest={handleGuestAccess} 
            />
        );
    }

    // Login View
    return (
        <div className="min-h-screen bg-nexus-bg-deep text-nexus-text font-mono flex flex-col items-center justify-center relative overflow-hidden z-[9999]">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none text-xs break-all leading-3 text-nexus-accent overflow-hidden">
                {matrixChars}
            </div>

            <div className="z-10 w-full max-w-md p-8 bg-nexus-panel/95 backdrop-blur-2xl border border-nexus-border rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] relative">
                
                <button 
                    onClick={() => setView('landing')}
                    className="absolute top-6 left-6 text-nexus-dim hover:text-nexus-accent text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                    ← Voltar
                </button>

                <div className="text-center mb-8 mt-4">
                    <NexusLogoSmall />
                    <h1 className="text-2xl font-black tracking-[0.2em] text-nexus-text mb-2">PORTÃO <span className="text-nexus-accent">NEXUS</span></h1>
                    <p className="text-[9px] text-nexus-dim uppercase tracking-[0.3em] font-bold">
                        {isSignUp ? 'NOVO REGISTRO DE AGENTE' : 'ACESSO CLASSIFICADO'}
                    </p>
                </div>

                <div className="mb-6 h-12 flex items-center justify-center">
                    {status !== 'idle' ? (
                        <div className="p-3 w-full bg-nexus-bg/80 border border-nexus-border rounded text-center text-xs tracking-widest font-bold animate-in fade-in">
                            {status === 'scanning' && <span className="text-nexus-accent animate-pulse">ESCANEANDO BIOMETRIA...</span>}
                            {status === 'creating' && <span className="text-nexus-accent animate-pulse">CRIANDO IDENTIDADE SUPABASE...</span>}
                            {status === 'verifying' && <span className="text-yellow-500 animate-pulse">DESCRIPTOGRAFANDO CHAVES...</span>}
                            {status === 'granted' && <span className="text-nexus-success">ACESSO CONCEDIDO</span>}
                            {status === 'denied' && <span className="text-red-500">ACESSO NEGADO</span>}
                        </div>
                    ) : errorMsg ? (
                        <div className="p-3 w-full bg-red-500/10 border border-red-500/50 rounded text-center text-[10px] tracking-widest font-bold text-red-400 animate-in slide-in-from-top-2">
                            {errorMsg}
                        </div>
                    ) : (
                        <div className="h-full"></div>
                    )}
                </div>

                <form onSubmit={handleAuth} className={`space-y-5 transition-all duration-500 ${status === 'granted' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    <div>
                        <label className="block text-[10px] uppercase text-nexus-dim mb-2 font-bold tracking-wider">ID Operativo (Email)</label>
                        <input 
                            type="email" 
                            name="email"
                            autoComplete="username"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-4 text-nexus-accent focus:border-nexus-accent focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] outline-none transition-all placeholder:text-nexus-dim/30 text-sm"
                            placeholder="usuario@nexus.sys"
                            disabled={status !== 'idle'}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-nexus-dim mb-2 font-bold tracking-wider">Senha Quântica</label>
                        <input 
                            type="password" 
                            name="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-4 text-nexus-accent focus:border-nexus-accent focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] outline-none transition-all placeholder:text-nexus-dim/30 text-sm"
                            placeholder="••••••••••••"
                            disabled={status !== 'idle'}
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={status !== 'idle' || !email || !password}
                        className={`
                            w-full py-4 rounded-lg font-black uppercase tracking-[0.2em] transition-all text-xs
                            ${status === 'denied' 
                                ? 'bg-red-500/10 text-red-500 border border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.2)]' 
                                : 'bg-nexus-accent/10 text-nexus-accent border border-nexus-accent hover:bg-nexus-accent hover:text-black hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]'}
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {status === 'idle' ? (isSignUp ? 'REGISTRAR NO SISTEMA' : 'INICIALIZAR LINK') : 'PROCESSANDO...'}
                    </button>

                    <div className="text-center space-y-2">
                        <button 
                            type="button" 
                            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
                            className="text-xs text-nexus-dim hover:text-nexus-accent underline transition-colors"
                        >
                            {isSignUp ? "Já tem um ID? Entrar" : "Novo Operativo? Criar Conta"}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center border-t border-nexus-border/20 pt-4">
                    <p className="text-[9px] text-nexus-dim font-mono">
                        TERMINAL SEGURO V37.5<br/>
                        <span className="text-nexus-dim/30">ENCRIPTAÇÃO: TLS 1.3 // NÓ: SUPABASE</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthGate;
