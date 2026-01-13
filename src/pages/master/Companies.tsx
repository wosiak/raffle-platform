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
import { Building2, Plus, LogIn, LogOut, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
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
                    <span className={`px-2 py-1 text-xs rounded ${
                      company.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {company.status}
                    </span>
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
