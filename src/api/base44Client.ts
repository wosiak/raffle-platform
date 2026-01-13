// Cliente API - Usa Supabase se configurado, senão usa mock
// Para usar Supabase: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env

// Verificar se Supabase está configurado
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useSupabase = !!(supabaseUrl && supabaseAnonKey);

// Mock local (usado quando Supabase não está configurado)
type EntityRecord = Record<string, any>;

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

function makeList(initial: EntityRecord[] = []) {
  let store = [...initial];
  return {
    async list() {
      await delay();
      return store;
    },
    async filter() {
      await delay();
      return store;
    },
    async create(data: EntityRecord) {
      await delay();
      const record = { id: crypto.randomUUID(), ...data };
      store = [record, ...store];
      return record;
    },
    async update(id: string, data: EntityRecord) {
      await delay();
      store = store.map((item) => (item.id === id ? { ...item, ...data } : item));
      return store.find((item) => item.id === id) ?? null;
    },
    async delete(id: string) {
      await delay();
      store = store.filter((item) => item.id !== id);
      return true;
    }
  };
}

const mockUser = {
  id: "mock-user",
  email: "mock@example.com",
  full_name: "Usuário Demo"
};

const mockBase44 = {
  auth: {
    async me() {
      await delay();
      return mockUser;
    },
    redirectToLogin() {
      console.info("💡 Mock ativo - Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env para usar Supabase");
    }
  },
  entities: {
    Organization: makeList([{ id: "org-1", name: "Organização Demo", slug: "demo" }]),
    Draw: makeList([]),
    Testimonial: makeList([]),
    Member: makeList([{ id: "member-1", email: mockUser.email }]),
    Transaction: makeList([]),
    Voucher: makeList([]),
    Partner: makeList([]),
    Campaign: makeList([]),
    CampaignEntry: makeList([]),
    AuditLog: makeList([]),
    Raffle: makeList([])
  },
  integrations: {
    Core: {
      async UploadFile() {
        await delay();
        return { file_url: "https://placehold.co/600x400?text=mock-file" };
      },
      async SendEmail() {
        await delay();
        return { status: "sent" };
      }
    }
  }
};

// Exportar: Se Supabase configurado, usar ele. Senão, usar mock.
// Por enquanto, sempre usar mock. Quando configurar .env, substitua esta linha:
export { base44 } from './supabaseClient';

// Para usar mock (comentar linha acima e descomentar abaixo):
// export const base44 = mockBase44;