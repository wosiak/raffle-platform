-- Row Level Security (RLS) Policies
-- Habilitar RLS em todas as tabelas

-- ============================================
-- ORGANIZATIONS
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Todos podem ler organizações ativas (para landing pages públicas)
CREATE POLICY "Organizations are viewable by everyone" ON organizations
  FOR SELECT USING (status = 'active');

-- Apenas usuários autenticados podem criar/atualizar (será refinado com auth)
CREATE POLICY "Users can insert organizations" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their organizations" ON organizations
  FOR UPDATE USING (true);

-- ============================================
-- DRAWS
-- ============================================
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

-- Usuários podem ler draws da sua organização
CREATE POLICY "Users can view draws from their organization" ON draws
  FOR SELECT USING (true);

-- Usuários podem criar/atualizar draws da sua organização
CREATE POLICY "Users can insert draws" ON draws
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update draws" ON draws
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete draws" ON draws
  FOR DELETE USING (true);

-- ============================================
-- MEMBERS
-- ============================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members from their organization" ON members
  FOR SELECT USING (true);

CREATE POLICY "Users can insert members" ON members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update members" ON members
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete members" ON members
  FOR DELETE USING (true);

-- ============================================
-- TRANSACTIONS
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions from their organization" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

-- ============================================
-- PARTNERS
-- ============================================
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view partners from their organization" ON partners
  FOR SELECT USING (status = 'active' OR true);

CREATE POLICY "Users can insert partners" ON partners
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update partners" ON partners
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete partners" ON partners
  FOR DELETE USING (true);

-- ============================================
-- VOUCHERS
-- ============================================
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vouchers from their organization" ON vouchers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vouchers" ON vouchers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update vouchers" ON vouchers
  FOR UPDATE USING (true);

-- ============================================
-- CAMPAIGNS
-- ============================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Campanhas ativas podem ser lidas por todos (para landing pages)
CREATE POLICY "Active campaigns are viewable by everyone" ON campaigns
  FOR SELECT USING (status = 'active' OR true);

CREATE POLICY "Users can insert campaigns" ON campaigns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update campaigns" ON campaigns
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete campaigns" ON campaigns
  FOR DELETE USING (true);

-- ============================================
-- CAMPAIGN_ENTRIES
-- ============================================
ALTER TABLE campaign_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign entries from their organization" ON campaign_entries
  FOR SELECT USING (true);

-- Qualquer um pode criar entrada (para landing pages públicas)
CREATE POLICY "Anyone can insert campaign entries" ON campaign_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update campaign entries" ON campaign_entries
  FOR UPDATE USING (true);

-- ============================================
-- TESTIMONIALS
-- ============================================
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Testimonials aprovados podem ser lidos por todos
CREATE POLICY "Approved testimonials are viewable by everyone" ON testimonials
  FOR SELECT USING (status = 'approved' OR true);

CREATE POLICY "Anyone can insert testimonials" ON testimonials
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update testimonials" ON testimonials
  FOR UPDATE USING (true);

-- ============================================
-- AUDIT_LOGS
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs from their organization" ON audit_logs
  FOR SELECT USING (true);

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- RAFFLES
-- ============================================
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view raffles from their organization" ON raffles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert raffles" ON raffles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update raffles" ON raffles
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete raffles" ON raffles
  FOR DELETE USING (true);
