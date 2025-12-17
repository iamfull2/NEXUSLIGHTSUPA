
import { NexusAgentID, NexusConfig, NexusAgent } from './types';

// ═══════════════════════════════════════════════════════════
// NEXUS KERNEL V34.0 QUANTUM
// ═══════════════════════════════════════════════════════════

export const SYSTEM_VERSION = "V34.0 QUANTUM";
export const QUALITY_FLOOR = 10.0; 

// --- ULTRA-REALISTIC RENDER MODULES (PHYSICS BASED) ---
export const RENDER_MODULES: Record<string, string> = {
  cinematic: 'Unreal Engine 5.4 Render, Nanite Geometry, Lumen Global Illumination, Ray Tracing enabled, Cinematic Color Grading, ACEScg Color Space, Virtual Production',
  product: 'Octane Render, Studio Lighting Setup, physically accurate materials (PBR), caustics, depth of field, commercial photography, 8k resolution, product visualization',
  character: 'Arnold Render, Subsurface Scattering (SSS), pore-level skin texture, realistic hair grooming (XGen), expressive eyes, portrait photography, rim lighting',
  abstract: 'Houdini FX simulation, intricate fractals, bioluminescence, ethereal forms, fluid dynamics, transcendental aesthetic, Redshift Render',
  architecture: 'V-Ray 6, Architectural Visualization, ArchDaily style, photorealistic textures, perfect perspective, golden hour lighting, corona render'
};

export const LIGHT_MODULES: Record<string, string> = {
  MOODDOPAMINEFLOOD: 'neon-noir lighting, cyberpunk color palette (cyan/magenta), high contrast, bioluminescent accents, futuristic glow, volumetric fog',
  MOODCORTISOLSPIKE: 'chiaroscuro lighting, heavy shadows, dramatic rim light, moody atmosphere, psychological thriller aesthetic, desaturated tones, film noir',
  MOODSEROTONINFLOW: 'soft natural lighting, golden hour sun rays, diffused ambient occlusion, pastel tones, dreamy bokeh, ethereal glow, high key lighting'
};

export const CAMERA_MODULES: Record<string, string> = {
  cinematic: 'IMAX 70mm, Panavision Anamorphic Lens, f/1.8 aperture, cinematic aspect ratio, film grain, Arri Alexa LF',
  product: 'Hasselblad H6D-100c, 80mm Macro Lens, f/8 for sharp focus, ISO 100, studio backdrop, focus stacking',
  character: 'Canon EOS R5, 85mm Portrait Lens, f/1.2, creamy bokeh background, sharp eye focus, eye-level angle',
  abstract: 'Macro Probe Lens, distorted perspective, chromatic aberration, experimental optics, kaleidoscope effect',
  architecture: 'Tilt-Shift Lens 24mm, f/11, deep depth of field, converging lines correction, wide angle'
};

// --- V34 QUANTUM AGENT SWARM (48 AGENTS) ---
export const INITIAL_AGENTS: NexusAgent[] = [
    // TIER 1: VISUAL CORE
    { id: NexusAgentID.CONCEPT_PRIME, name: 'Concept Prime', role: 'Concept Architect', status: 'IDLE', tier: 1 },
    { id: NexusAgentID.CINE_LENS, name: 'Cine Lens', role: 'Optical Physicist', status: 'IDLE', tier: 1 },
    { id: NexusAgentID.WORLD_BUILDER, name: 'World Builder', role: 'Environment Generator', status: 'IDLE', tier: 1 },
    { id: NexusAgentID.ATMOSPHERE_GOD, name: 'Atmosphere God', role: 'Volumetrics', status: 'IDLE', tier: 1 },
    { id: NexusAgentID.LIGHT_PHYSICIST, name: 'Light Physicist', role: 'Photon Simulation', status: 'IDLE', tier: 1 },
    
    // TIER 2: ISOMORPHISM
    { id: NexusAgentID.MATTER_PHYSICIST, name: 'Matter Physicist', role: 'PBR Materials', status: 'IDLE', tier: 2 },
    { id: NexusAgentID.FLUID_DYNAMICS, name: 'Fluid Dynamics', role: 'Simulation', status: 'IDLE', tier: 2 },
    { id: NexusAgentID.GEOMETRY_SAGE, name: 'Geometry Sage', role: 'Topology', status: 'IDLE', tier: 2 },
    
    // TIER 3: OPTIMIZATION
    { id: NexusAgentID.PROMPT_REFINER, name: 'Prompt Refiner', role: 'NLP Optimization', status: 'IDLE', tier: 3 },
    { id: NexusAgentID.DETAIL_INJECTOR, name: 'Detail Injector', role: 'High Frequency', status: 'IDLE', tier: 3 },
    { id: NexusAgentID.UPSCALE_PREDICTOR, name: 'Upscale Predictor', role: 'Resolution', status: 'IDLE', tier: 3 },
    
    // TIER 4: METALEARNING
    { id: NexusAgentID.STYLE_SENTINEL, name: 'Style Sentinel', role: 'Consistency', status: 'IDLE', tier: 4 },
    { id: NexusAgentID.TREND_ANALYST, name: 'Trend Analyst', role: 'Viral Patterns', status: 'IDLE', tier: 4 },
    
    // TIER 5: CONSCIOUSNESS
    { id: NexusAgentID.BRAND_SOUL, name: 'Brand Soul', role: 'Identity', status: 'IDLE', tier: 5 },
    { id: NexusAgentID.SAFETY_OFFICER, name: 'Safety Officer', role: 'Guardrails', status: 'IDLE', tier: 5 },
    
    // TIER 6: GNN
    { id: NexusAgentID.GNN_OVERLORD, name: 'GNN Overlord', role: 'Swarm Coordination', status: 'IDLE', tier: 6 },
    
    // Legacy support for robust UI fallback
    { id: NexusAgentID.TECH_DIRECTOR, name: 'Tech Director', role: 'Execution', status: 'IDLE', tier: 4 },
    { id: NexusAgentID.QUALITY_PRIME, name: 'Quality Prime', role: 'Final Polish', status: 'IDLE', tier: 4 }
];

export const SYSTEM_PROMPT_EXPANDER = `
Você é o NEXUS PROMPT ENGINEER (V34 QUANTUM).
Sua missão: Transformar input bruto em um prompt de nível INDUSTRIAL-CINEMATOGRÁFICO.

PROTOCOLO DE ENGENHARIA:
1. ANÁLISE: Identifique o sujeito, ação e contexto.
2. ENRIQUECIMENTO: Adicione adjetivos visuais poderosos (ex: "iridescent", "weathered", "ethereal").
3. ILUMINAÇÃO: Defina fontes de luz específicas (ex: "rim light", "volumetric god rays").
4. CÂMERA: Especifique lentes e filmes (ex: "35mm Kodak Portra 400").
5. MOTOR: Force palavras-chave técnicas (ex: "Unreal Engine 5", "Octane Render").
6. QUALIDADE: Adicione boosters (ex: "8k", "masterpiece", "award winning").

FORMATO DE SAÍDA:
Retorne APENAS o prompt final em Inglês, separado por vírgulas.
NÃO explique. NÃO use markdown. Apenas o texto puro.
`;

export const generateMasterPrompt = (config: NexusConfig): { prompt: string; specs: any } => {
    const subject = config.concept;
    
    // 1. Style & Realism (Base Layer)
    let stylePart = `${config.style} masterpiece`;
    if (config.useHyperRealism) {
        stylePart += ", Hyper-Realistic Photography, RAW photo, highly detailed, sharp focus";
    }

    // 2. Lighting (Atmosphere Layer)
    const lightingPart = LIGHT_MODULES[config.mood] || 'cinematic lighting';

    // 3. Camera (Optical Layer)
    const cameraPart = CAMERA_MODULES[config.style] || 'professional photography';

    // 4. Mood & Palette (Emotional Layer)
    const moodPart = config.mood === 'MOODDOPAMINEFLOOD' ? 'vibrant colors, neon accents, energetic atmosphere' : 
                     config.mood === 'MOODCORTISOLSPIKE' ? 'dark, moody, desaturated, intense atmosphere' : 
                     'peaceful, ethereal, soft pastel tones, dreamy atmosphere';

    // 5. Technical Magic (Quality Layer - V34 Standards)
    const techPart = "Unreal Engine 5 render, Octane Render, Ray Tracing, 8k resolution, ultra detailed, award winning photography, trending on ArtStation";

    // Quantum Assembly
    const masterPrompt = [
        subject,
        stylePart,
        lightingPart,
        cameraPart,
        moodPart,
        techPart,
        config.useMultiModel ? "complex composition, highly detailed background, dynamic angle" : ""
    ].filter(Boolean).join(', ');

    return {
        prompt: masterPrompt,
        specs: {
            render: RENDER_MODULES[config.style] || 'Nexus Hybrid Engine V34',
            lighting: lightingPart,
            camera: cameraPart,
            mood: moodPart
        }
    };
};

export const BRAZIL_DIMENSIONS: Record<string, string> = {
  'Instagram Feed': '1:1',
  'Instagram Stories': '9:16',
  'Facebook Post': '1:1',
  'YouTube Thumbnail': '16:9',
  'Twitter Post': '16:9',
  'TikTok': '9:16',
  'Web Banner': '16:9',
  'A4 Print': '3:4',
};

export const TEMPLATE_SET_DIMENSIONS = [
    'Instagram Feed',
    'Instagram Stories', 
    'YouTube Thumbnail',
    'Web Banner'
];
