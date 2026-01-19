import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Sparkles, 
  History, 
  LogOut,
  ArrowLeft,
  TrendingUp,
  Users as UsersIcon,
  Calendar,
  Settings
} from 'lucide-react';

export default function CompanyDashboard() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const { user, logout, getCurrentCompanyId, isMaster, exitImpersonate, impersonatedCompany } = useAuth();

  // Buscar informações da empresa
  const { data: company } = useQuery({
    queryKey: ['company', companySlug],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', companySlug)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Estatísticas
  const { data: stats } = useQuery({
    queryKey: ['stats', getCurrentCompanyId()],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase não configurado');
      const companyId = getCurrentCompanyId();
      
      const { count: totalDraws } = await supabase
        .from('draws')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      
      const { count: executedDraws } = await supabase
        .from('draws')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .not('executed_at', 'is', null);
      
      return {
        totalDraws: totalDraws || 0,
        executedDraws: executedDraws || 0,
      };
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBackToMaster = () => {
    exitImpersonate();
    navigate('/master/companies');
  };

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4">
              {isMaster && impersonatedCompany && (
                <Button variant="outline" onClick={handleBackToMaster}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Master
                </Button>
              )}
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
                {company?.name || companySlug}
              </h1>
            </div>
            <p className="text-gray-600 mt-2">
              Olá, {user?.name}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total de Sorteios</p>
                  <p className="text-3xl font-bold mt-1">{stats?.totalDraws || 0}</p>
                </div>
                <Sparkles className="w-12 h-12 text-violet-500 opacity-20" />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Executados</p>
                  <p className="text-3xl font-bold mt-1">{stats?.executedDraws || 0}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Este Mês</p>
                  <p className="text-3xl font-bold mt-1">-</p>
                </div>
                <Calendar className="w-12 h-12 text-cyan-500 opacity-20" />
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-8">
              <Sparkles className="w-12 h-12 text-violet-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Criar Sorteio</h2>
              <p className="text-gray-600 mb-6">
                Crie um novo sorteio para sua empresa
              </p>
              <Link to={`/${companySlug}/draws/new`}>
                <GradientButton>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Novo Sorteio
                </GradientButton>
              </Link>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-8">
              <History className="w-12 h-12 text-cyan-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Histórico</h2>
              <p className="text-gray-600 mb-6">
                Veja todos os sorteios realizados
              </p>
              <Link to={`/${companySlug}/draws`}>
                <GradientButton>
                  <History className="w-4 h-4 mr-2" />
                  Ver Sorteios
                </GradientButton>
              </Link>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-8">
              <UsersIcon className="w-12 h-12 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Usuários</h2>
              <p className="text-gray-600 mb-6">
                Gerencie os usuários da empresa
              </p>
              <Link to={`/${companySlug}/users`}>
                <GradientButton>
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Gerenciar
                </GradientButton>
              </Link>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
