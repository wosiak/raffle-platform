// Cliente Base44 mockado para permitir build/dev local
// TODO: substituir por implementação real quando as credenciais/SDK estiverem disponíveis.

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

const base44 = {
  auth: {
    async me() {
      await delay();
      return mockUser;
    },
    redirectToLogin() {
      // eslint-disable-next-line no-console
      console.info("Mock login redirecionado");
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

export { base44 };

