
import { MemoryEntry, StyleDNAProfile } from "./types";
import { supabase } from "./supabaseClient";

const STORAGE_KEY = 'nexus_neural_memory_v37_quantum';

export class NeuralMemoryBank {
    memories: MemoryEntry[] = [];
    private useSupabase = true;

    constructor() {
        this.loadLocal();
        this.loadCloud();
    }

    private loadLocal() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                this.memories = JSON.parse(data);
            }
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    private async loadCloud() {
        if (!this.useSupabase) return;
        
        try {
            const { data: { user } } = await supabase.auth.getUser();

            let query = supabase
                .from('generations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            // Se usuário logado, filtra. Se não, modo offline/local.
            if (user) {
                query = query.eq('user_id', user.id);
            } else {
                // Se não tem user, não tenta carregar do banco para evitar erro de RLS
                return; 
            }

            const { data, error } = await query;

            if (error) {
                console.warn("Memória Nuvem Offline:", error.message);
                return;
            }
            
            if (data && data.length > 0) {
                // Mapeamento SQL -> App
                this.memories = data.map((d: any) => ({
                    id: d.id,
                    timestamp: d.created_at,
                    concept: d.concept || d.prompt, 
                    style: d.style,
                    mood: d.mood,
                    imageUrl: d.image_url, // snake_case do banco
                    dna: d.dna || {}, 
                    performance: d.performance || { likes: 0, views: 0 }
                })) as MemoryEntry[];
                this.saveLocal(); 
            }
        } catch (e) {
            // Silently fail to local mode
        }
    }

    private saveLocal() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories));
        } catch (e: any) {
            if (e.name === 'QuotaExceededError') {
                const prune = this.memories.slice(0, 10);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(prune));
            }
        }
    }

    async storeGeneration(concept: string, style: string, mood: string, imageUrl: string) {
        const dna: StyleDNAProfile = {
            color: mood,
            lighting: style === 'cinematic' ? 'volumetric' : 'standard',
            composition: 'ai-generated',
            texture: 'high-fidelity',
            generation: 0
        };

        const entry: MemoryEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            concept,
            style,
            mood,
            imageUrl,
            dna,
            performance: { likes: 0, views: 1 }
        };

        // 1. Atualiza Local
        this.memories.unshift(entry);
        if (this.memories.length > 50) this.memories = this.memories.slice(0, 50);
        this.saveLocal();

        // 2. Sincroniza Nuvem (Supabase)
        if (this.useSupabase) {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                const { error } = await supabase.from('generations').insert([{
                    user_id: user.id,
                    prompt: entry.concept, // Campo obrigatório
                    concept: entry.concept,
                    style: entry.style,
                    mood: entry.mood,
                    image_url: entry.imageUrl, // snake_case
                    dna: entry.dna,
                    performance: entry.performance,
                    engine: 'gemini'
                }]);
                
                if (error) console.warn("Erro ao salvar memória na nuvem:", error.message);
            }
        }
        
        return entry;
    }

    getStats() {
        return {
            totalGenerations: this.memories.length,
            topStyle: 'Cinematic',
            topMood: 'Neon'
        };
    }
}

export const neuralMemory = new NeuralMemoryBank();
