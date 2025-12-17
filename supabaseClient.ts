
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════
// NEXUS SUPABASE CORE CONFIGURATION (V33.5 PRO)
// ═══════════════════════════════════════════════════════════

// 1. Safe Environment Access for Vite/Vercel
const env = (import.meta as any).env || {};

// 2. Credentials Strategy: Vercel Env Vars -> Hardcoded Fallback (New Project)
// Using the SPECIFIC credentials provided by the user for direct connection.
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://azehckamfnkodjgyfbxv.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6ZWhja2FtZm5rb2RqZ3lmYnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NjIxMzcsImV4cCI6MjA4MTEzODEzN30.w_vKOiBME4zkwZcreYZ23ZzjkK8C6uK_nLxdP_Hcf3M';

// 3. Client Initialization with Auto-Refresh
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});
