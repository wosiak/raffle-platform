-- Winners Club - Schema Inicial
-- Executar este arquivo no SQL Editor do Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB operations
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- TABELA: organizations
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('winners_club', 'partner', 'white_label')),
  logo_url TEXT,
  primary_color TEXT DEFAULT '#7C3AED',
  secondary_color TEXT DEFAULT '#06B6D4',
  blur_intensity INTEGER DEFAULT 12,
  border_radius TEXT DEFAULT 'lg' CHECK (border_radius IN ('none', 'sm', 'md', 'lg', 'xl')),
  dark_mode BOOLEAN DEFAULT true,
  reduce_motion BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  plan_limits JSONB DEFAULT '{}',
  usage_this_month JSONB DEFAULT '{"draws_count": 0, "participants_total": 0}',
  status TEXT DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial')),
  custom_domain TEXT,
  webhook_url TEXT,
  api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_status ON organizations(status);

-- ============================================
-- TABELA: members
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_email TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  credit_balance DECIMAL(12, 2) DEFAULT 0,
  total_earned DECIMAL(12, 2) DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  total_credits_won DECIMAL(12, 2) DEFAULT 0,
  wins_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  avatar_url TEXT,
  social_profiles JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_members_organization_id ON members(organization_id);
CREATE INDEX idx_members_user_email ON members(user_email);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_created_at ON members(created_at DESC);

-- ============================================
-- TABELA: partners
-- ============================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  category TEXT CHECK (category IN ('food', 'beauty', 'health', 'entertainment', 'shopping', 'travel', 'services', 'education', 'other')),
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  redemption_rules JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partners_organization_id ON partners(organization_id);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_featured ON partners(featured);
CREATE INDEX idx_partners_created_at ON partners(created_at DESC);

-- ============================================
-- TABELA: campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  rules JSONB DEFAULT '[]',
  prize_description TEXT,
  prize_image_url TEXT,
  winners_count INTEGER DEFAULT 1,
  max_participants INTEGER,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended', 'cancelled')),
  require_email BOOLEAN DEFAULT true,
  require_phone BOOLEAN DEFAULT false,
  custom_fields JSONB DEFAULT '[]',
  terms_url TEXT,
  participants_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX idx_campaigns_partner_id ON campaigns(partner_id);
CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- ============================================
-- TABELA: draws
-- ============================================
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('list', 'numeric_range', 'weighted', 'teams', 'shuffle', 'elimination')),
  mode TEXT DEFAULT 'standalone' CHECK (mode IN ('winners_club', 'partner_campaign', 'standalone')),
  config JSONB NOT NULL DEFAULT '{}',
  items JSONB DEFAULT '[]',
  prize JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'locked', 'executed', 'cancelled')),
  locked_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  verification JSONB DEFAULT '{"enabled": false}',
  results JSONB DEFAULT '[]',
  participants_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_draws_organization_id ON draws(organization_id);
CREATE INDEX idx_draws_campaign_id ON draws(campaign_id);
CREATE INDEX idx_draws_status ON draws(status);
CREATE INDEX idx_draws_created_at ON draws(created_at DESC);
CREATE INDEX idx_draws_executed_at ON draws(executed_at DESC);

-- ============================================
-- TABELA: transactions
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('credit_won', 'credit_redemption', 'credit_adjustment', 'voucher_generated', 'voucher_used')),
  amount DECIMAL(12, 2) NOT NULL,
  balance_before DECIMAL(12, 2),
  balance_after DECIMAL(12, 2),
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  voucher_code TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_organization_id ON transactions(organization_id);
CREATE INDEX idx_transactions_member_id ON transactions(member_id);
CREATE INDEX idx_transactions_partner_id ON transactions(partner_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);

-- ============================================
-- TABELA: vouchers
-- ============================================
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  qr_data TEXT,
  credits_amount DECIMAL(12, 2) NOT NULL,
  currency_value DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  used_by_partner_user TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vouchers_organization_id ON vouchers(organization_id);
CREATE INDEX idx_vouchers_member_id ON vouchers(member_id);
CREATE INDEX idx_vouchers_partner_id ON vouchers(partner_id);
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_vouchers_created_at ON vouchers(created_at DESC);

-- ============================================
-- TABELA: campaign_entries
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  participant_phone TEXT,
  social_username TEXT,
  custom_data JSONB DEFAULT '{}',
  rules_completion JSONB DEFAULT '[]',
  entries_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected', 'winner')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_entries_campaign_id ON campaign_entries(campaign_id);
CREATE INDEX idx_campaign_entries_organization_id ON campaign_entries(organization_id);
CREATE INDEX idx_campaign_entries_status ON campaign_entries(status);
CREATE INDEX idx_campaign_entries_created_at ON campaign_entries(created_at DESC);
CREATE INDEX idx_campaign_entries_email ON campaign_entries(participant_email);

-- ============================================
-- TABELA: testimonials
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  draw_id UUID REFERENCES draws(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  prize_won TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  featured BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_testimonials_organization_id ON testimonials(organization_id);
CREATE INDEX idx_testimonials_member_id ON testimonials(member_id);
CREATE INDEX idx_testimonials_status ON testimonials(status);
CREATE INDEX idx_testimonials_featured ON testimonials(featured);
CREATE INDEX idx_testimonials_created_at ON testimonials(created_at DESC);

-- ============================================
-- TABELA: audit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_email TEXT,
  actor_email TEXT,
  actor_name TEXT,
  action TEXT NOT NULL CHECK (action IN (
    'draw_created', 'draw_edited', 'draw_locked', 'draw_executed', 'draw_cancelled',
    'campaign_created', 'campaign_edited', 'entry_validated', 'entry_rejected',
    'voucher_generated', 'voucher_redeemed',
    'member_created', 'member_updated',
    'partner_created', 'partner_updated',
    'settings_changed'
  )),
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- TABELA: raffles (legacy/compatibilidade)
-- ============================================
CREATE TABLE IF NOT EXISTS raffles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  items JSONB DEFAULT '[]',
  verification JSONB DEFAULT '{"enabled": false}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'locked', 'completed', 'cancelled')),
  locked_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_raffles_organization_id ON raffles(organization_id);
CREATE INDEX idx_raffles_status ON raffles(status);
CREATE INDEX idx_raffles_created_at ON raffles(created_at DESC);

-- ============================================
-- FUNCTIONS: updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_draws_updated_at BEFORE UPDATE ON draws FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_entries_updated_at BEFORE UPDATE ON campaign_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_raffles_updated_at BEFORE UPDATE ON raffles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
