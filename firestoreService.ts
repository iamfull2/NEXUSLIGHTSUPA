
import { supabase } from './supabaseClient';

// ═══════════════════════════════════════════════════════════
// NEXUS NEURAL LINK (SUPABASE DRIVER)
// ═══════════════════════════════════════════════════════════
// Nota: Mantemos o nome do arquivo 'firestoreService' para
// compatibilidade com importações existentes, mas o motor
// agora é 100% Supabase (PostgreSQL).

export interface ChatMessage {
    id?: string;
    text: string;
    sender: 'user' | 'ai' | 'system';
    timestamp: any;
    userId: string;
    userName?: string;
    userColor?: string;
    attachmentName?: string;
}

// Mapeia do formato do Banco SQL para o formato da Aplicação
const mapToApp = (dbRow: any): ChatMessage => ({
    id: dbRow.id.toString(),
    text: dbRow.text,
    sender: dbRow.sender as any,
    timestamp: dbRow.created_at,
    userId: dbRow.user_id || 'anon',
    userName: dbRow.user_name,
    userColor: dbRow.user_color,
    attachmentName: dbRow.attachment_name
});

export const subscribeToChat = (callback: (messages: ChatMessage[]) => void) => {
    // 1. Carregar Histórico Inicial
    const fetchHistory = async () => {
        const { data, error } = await supabase
            .from('nexus_chat')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error("Erro ao conectar ao Supabase:", error.message);
            return;
        }

        if (data) {
            const formatted = data.reverse().map(mapToApp);
            callback(formatted);
        }
    };

    fetchHistory();

    // 2. Inscrever em Mudanças em Tempo Real
    const channel = supabase
        .channel('public:nexus_chat')
        .on(
            'postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'nexus_chat' }, 
            (payload) => {
                // Quando uma nova mensagem chega, atualizamos a lista
                // Em um app ideal, adicionaríamos apenas a nova, mas fetchHistory garante sincronia
                fetchHistory();
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

export const sendChatMessage = async (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // CORREÇÃO CRÍTICA V32:
        // O banco SQL espera UUID ou NULL para user_id.
        // Se user não existe, enviamos null (não 'anon').
        
        const payload = {
            text: msg.text,
            sender: msg.sender,
            user_id: user ? user.id : null, 
            user_name: msg.userName || 'Operative',
            user_color: msg.userColor || '#00f0ff',
            attachment_name: msg.attachmentName || null
        };

        const { error } = await supabase
            .from('nexus_chat')
            .insert([payload]);
            
        if (error) {
            console.warn("Falha no envio Supabase:", error.message);
            throw error;
        }
    } catch (e: any) {
        console.error("Erro crítico no chat:", e.message);
    }
};
