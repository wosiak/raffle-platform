import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Building2, Plus, LogIn, LogOut, Edit, Trash2, Users, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  created_at: string;
}

export default function MasterCompanies() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout, impersonate, exitImpersonate, impersonatedCompany } = useAuth();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', slug: '' });

  // Carregar empresas
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Company[];
    },
  });

  // Carregar participantes (total e últimos 5)
  const { data: participantsData } = useQuery({
    queryKey: ['participants-summary'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      // Total de participantes
      const { count } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true });
      
      // Últimos 5 participantes
      const { data: recent, error } = await supabase
        .from('participants')
        .select('id, name, email, cpf, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return {
        total: count || 0,
        recent: recent as Participant[],
      };
    },
  });

  // Criar empresa
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const { data: created, error } = await supabase
        .from('companies')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowCreateDialog(false);
      setNewCompany({ name: '', slug: '' });
      toast.success('Empresa criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar empresa');
    },
  });

  // Deletar empresa
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar empresa');
    },
  });

  const handleImpersonate = (company: Company) => {
    impersonate(company.id, company.name, company.slug);
    navigate(`/${company.slug}/dashboard`);
    toast.success(`Acessando ${company.name}`);
  };

  const handleExitImpersonate = () => {
    exitImpersonate();
    toast.info('Voltou para visão master');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDownloadCSV = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Criar CSV
      const headers = ['Nome', 'Email', 'CPF', 'Telefone', 'WhatsApp', 'Endereço', 'Instagram', 'Facebook', 'Data Cadastro'];
      const rows = data.map(p => [
        p.name,
        p.email,
        p.cpf,
        p.phone,
        p.whatsapp || '',
        p.address,
        p.instagram || '',
        p.facebook || '',
        format(new Date(p.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `participantes_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
      link.click();
      
      toast.success('CSV baixado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao baixar CSV');
    }
  };

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
              Painel Master
            </h1>
            <p className="text-gray-600 mt-2">
              Olá, {user?.name} ({user?.email})
            </p>
            {impersonatedCompany && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-amber-600 font-semibold">
                  Acessando: {impersonatedCompany.name}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExitImpersonate}
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Sair
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <GradientButton onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </GradientButton>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Lista de empresas */}
        <h2 className="text-2xl font-bold mb-4">Empresas</h2>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Building2 className="w-10 h-10 text-violet-500" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{company.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">/{company.slug}</p>
                  
                  <div className="flex gap-2">
                    <GradientButton
                      onClick={() => handleImpersonate(company)}
                      className="flex-1"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Acessar
                    </GradientButton>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Deletar ${company.name}?`)) {
                          deleteMutation.mutate(company.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Card de Participantes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold mb-4">Participantes</h2>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-violet-500" />
                <div>
                  <h3 className="text-xl font-bold">Cadastros Globais</h3>
                  <p className="text-sm text-gray-500">Todos os participantes do sistema</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadCSV}
                  disabled={!participantsData?.total}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar CSV
                </Button>
                <GradientButton onClick={() => navigate('/master/participants')}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todos
                </GradientButton>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Estatísticas */}
              <div className="bg-gradient-to-br from-violet-900/20 to-cyan-900/20 backdrop-blur-sm rounded-lg p-4 border border-violet-500/30">
                <p className="text-sm text-gray-300 mb-1">Total de Participantes</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  {participantsData?.total || 0}
                </p>
              </div>

              {/* Últimos cadastros */}
              <div className="bg-gradient-to-br from-violet-900/20 to-cyan-900/20 backdrop-blur-sm rounded-lg p-4 border border-violet-500/30">
                <p className="text-sm text-gray-300 mb-3 font-semibold">Últimos Cadastros</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {participantsData?.recent && participantsData.recent.length > 0 ? (
                    participantsData.recent.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between text-xs bg-white/10 backdrop-blur-sm rounded px-2 py-1 border border-violet-400/20"
                      >
                        <span className="font-medium text-violet-200 truncate max-w-[150px]">
                          {participant.name}
                        </span>
                        <span className="text-gray-400">
                          {format(new Date(participant.created_at), 'dd/MM', { locale: ptBR })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">Nenhum participante ainda</p>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Dialog criar empresa */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Empresa</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Nome da Empresa</Label>
                <Input
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="Ex: Minha Empresa"
                />
              </div>
              
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={newCompany.slug}
                  onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="ex: minha-empresa"
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL: /{newCompany.slug}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <GradientButton
                onClick={() => createMutation.mutate(newCompany)}
                loading={createMutation.isPending}
                disabled={!newCompany.name || !newCompany.slug}
              >
                Criar
              </GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
