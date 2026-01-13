import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Criar cliente apenas se as variáveis estiverem definidas
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Tipos para as tabelas (simplificado - pode ser expandido com geração automática)
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: any;
        Insert: any;
        Update: any;
      };
      draws: {
        Row: any;
        Insert: any;
        Update: any;
      };
      members: {
        Row: any;
        Insert: any;
        Update: any;
      };
      transactions: {
        Row: any;
        Insert: any;
        Update: any;
      };
      partners: {
        Row: any;
        Insert: any;
        Update: any;
      };
      vouchers: {
        Row: any;
        Insert: any;
        Update: any;
      };
      campaigns: {
        Row: any;
        Insert: any;
        Update: any;
      };
      campaign_entries: {
        Row: any;
        Insert: any;
        Update: any;
      };
      testimonials: {
        Row: any;
        Insert: any;
        Update: any;
      };
      audit_logs: {
        Row: any;
        Insert: any;
        Update: any;
      };
      raffles: {
        Row: any;
        Insert: any;
        Update: any;
      };
    };
  };
};
