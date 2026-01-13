import { supabase } from '@/lib/supabase';

if (!supabase) {
  throw new Error('Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
}

type EntityRecord = Record<string, any>;

// Helper para converter ordenação do formato '-created_date' para Supabase
function parseOrder(order?: string): { column: string; ascending: boolean } | null {
  if (!order) return null;
  
  const ascending = !order.startsWith('-');
  const column = ascending ? order : order.substring(1);
  
  // Mapear nomes de campos se necessário (ex: created_date -> created_at)
  const columnMap: Record<string, string> = {
    'created_date': 'created_at',
    'updated_date': 'updated_at',
  };
  
  const mappedColumn = columnMap[column] || column;
  
  return { column: mappedColumn, ascending };
}

// Factory function para criar adaptadores de entidades
function makeSupabaseEntity(tableName: string) {
  return {
    async list(order?: string, limit?: number) {
      const orderData = parseOrder(order);
      let query = supabase.from(tableName).select('*');
      
      if (orderData) {
        query = query.order(orderData.column, { ascending: orderData.ascending });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error(`Error listing ${tableName}:`, error);
        throw error;
      }
      
      return data || [];
    },

    async filter(filters: EntityRecord = {}, order?: string, limit?: number) {
      let query = supabase.from(tableName).select('*');

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value !== null) {
            // Para objetos JSONB, usar contains
            query = query.contains(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Aplicar ordenação
      const orderData = parseOrder(order);
      if (orderData) {
        query = query.order(orderData.column, { ascending: orderData.ascending });
      } else {
        // Ordenação padrão por created_at descendente
        query = query.order('created_at', { ascending: false });
      }

      // Aplicar limite
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error(`Error filtering ${tableName}:`, error);
        throw error;
      }
      
      return data || [];
    },

    async create(data: EntityRecord) {
      const { data: created, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${tableName}:`, error);
        throw error;
      }

      return created;
    },

    async update(id: string, updates: EntityRecord) {
      const { data: updated, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
      }

      return updated;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting ${tableName}:`, error);
        throw error;
      }

      return true;
    },
  };
}

// Criar adaptadores para cada tabela
// Mapeamento: nome da entidade Base44 -> nome da tabela Supabase
const entityMappings: Record<string, string> = {
  Organization: 'organizations',
  Draw: 'draws',
  Member: 'members',
  Transaction: 'transactions',
  Partner: 'partners',
  Voucher: 'vouchers',
  Campaign: 'campaigns',
  CampaignEntry: 'campaign_entries',
  Testimonial: 'testimonials',
  AuditLog: 'audit_logs',
  Raffle: 'raffles',
};

// Criar objeto de entidades
const entities: Record<string, ReturnType<typeof makeSupabaseEntity>> = {};

Object.entries(entityMappings).forEach(([entityName, tableName]) => {
  entities[entityName] = makeSupabaseEntity(tableName);
});

// Adaptador de autenticação do Supabase
const authAdapter = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    };
  },

  async redirectToLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Error redirecting to login:', error);
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
};

// Adaptador de integrações (placeholder - pode ser implementado depois)
const integrationsAdapter = {
  Core: {
    async UploadFile(file: File) {
      // TODO: Implementar upload para Supabase Storage
      return { file_url: 'https://placehold.co/600x400?text=upload-pending' };
    },

    async SendEmail(to: string, subject: string, body: string) {
      // TODO: Implementar envio de email (usar Supabase Edge Functions ou serviço externo)
      console.log('SendEmail called:', { to, subject, body });
      return { status: 'sent' };
    },
  },
};

// Exportar cliente compatível com Base44
export const supabaseClient = {
  auth: authAdapter,
  entities,
  integrations: integrationsAdapter,
};

// Exportar também como base44 para facilitar migração gradual
export { supabaseClient as base44 };
