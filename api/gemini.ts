import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, // Aumenta timeout para operações de IA
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Busca a chave de forma segura no ambiente do servidor
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key não configurada no servidor (NEXUS_ERROR_KEY_MISSING)" });
    }

    const { action, model, payload } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    // Roteamento de Ações do SDK
    switch (action) {
      case "generateContent":
        const contentResult = await ai.models.generateContent({ model, ...payload });
        // Fixed: Explicitly return the text property as it is a getter and won't be serialized automatically.
        return res.status(200).json({
          ...contentResult,
          text: contentResult.text
        });

      case "generateVideos":
        const videoOperation = await ai.models.generateVideos({ model, ...payload });
        return res.status(200).json(videoOperation);

      case "getVideosOperation":
        const statusOperation = await ai.operations.getVideosOperation({ operation: payload.operation });
        return res.status(200).json(statusOperation);

      default:
        return res.status(400).json({ error: "Ação Nexus inválida" });
    }
  } catch (err: any) {
    console.error("NEXUS_PROXY_CRASH:", err);
    return res.status(500).json({
      error: err.message || "Erro interno no processamento neural"
    });
  }
}