
import { supabase } from '../supabaseClient';

/**
 * SECURE API GATEWAY
 * Substitui chamadas diretas de API por chamadas seguras ao Backend (Edge Functions).
 * Isso protege suas chaves API e permite controle de créditos.
 */

interface GenerateParams {
    prompt: string;
    model: string;
    aspectRatio?: string;
    referenceImage?: string;
}

export const generateSecureImage = async (params: GenerateParams) => {
    // 1. Verificar sessão
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error("Autenticação necessária.");

    console.log("🔒 Solicitando geração segura via Nexus Edge...");

    // 2. Chamar Edge Function (que contém a chave real do Gemini/Freepik)
    const { data, error } = await supabase.functions.invoke('nexus-generate', {
        body: { 
            prompt: params.prompt,
            model: params.model,
            ratio: params.aspectRatio,
            image: params.referenceImage
        }
    });

    if (error) {
        console.error("Erro na Edge Function:", error);
        throw new Error(error.message || "Falha no servidor Nexus.");
    }

    if (!data.imageUrl) {
        throw new Error("Resposta inválida do servidor.");
    }

    return data.imageUrl;
};

/* 
   NOTA PARA IMPLEMENTAÇÃO DA EDGE FUNCTION (supabase/functions/nexus-generate/index.ts):
   
   Deno.serve(async (req) => {
     const { prompt, model } = await req.json();
     // 1. Verificar créditos no DB
     // 2. Chamar Gemini API usando Deno.env.get('GEMINI_API_KEY')
     // 3. Salvar imagem no Supabase Storage
     // 4. Descontar créditos
     // 5. Retornar URL pública
   });
*/
