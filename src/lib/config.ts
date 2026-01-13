// Configuração para escolher entre Supabase e Mock
// Para usar Supabase, defina USE_SUPABASE=true no .env

export const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true' || 
                            import.meta.env.VITE_SUPABASE_URL !== undefined;
