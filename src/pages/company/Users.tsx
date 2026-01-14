import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Users as UsersIcon,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Facebook,
  Instagram,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  status: string;
  last_login_at?: string;
  created_at: string;
}

export default function CompanyUsers() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getCurrentCompanyId, isMaster, exitImpersonate } = useAuth();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    whatsapp: '',
    address: '',
    facebook: '',
    instagram: '',
  });

  // Carregar usuários da empresa
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', getCurrentCompanyId()],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase não configurado');
      const companyId = getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_master', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as User[];
    },
  });

  // Criar usuário
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!supabase) throw new Error('Supabase não configurado');
      const companyId = getCurrentCompanyId();
      
      // Criar hash da senha usando RPC
      const { data: created, error } = await supabase.rpc('create_user_with_password', {
        p_name: data.name,
        p_email: data.email,
        p_password: data.password,
        p_company_id: companyId,
        p_phone: data.phone || null,
        p_whatsapp: data.whatsapp || null,
        p_address: data.address || null,
        p_facebook: data.facebook || null,
        p_instagram: data.instagram || null,
      });
      
      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateDialog(false);
      resetForm();
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar usuário');
    },
  });

  // Atualizar usuário
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const updateData: any = {
        name: data.name,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        address: data.address || null,
        facebook: data.facebook || null,
        instagram: data.instagram || null,
      };
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowEditDialog(false);
      setSelectedUser(null);
      resetForm();
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar usuário');
    },
  });

  // Deletar usuário
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário deletado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar usuário');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      whatsapp: '',
      address: '',
      facebook: '',
      instagram: '',
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Preencha nome, email e senha');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
      address: user.address || '',
      facebook: user.facebook || '',
      instagram: user.instagram || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    if (!selectedUser) return;
    if (!formData.name) {
      toast.error('Preencha o nome');
      return;
    }
    updateMutation.mutate({ id: selectedUser.id, data: formData });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deletar usuário ${name}?`)) {
      deleteMutation.mutate(id);
    }
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
          <div className="flex items-center gap-4">
            {isMaster ? (
              <Button variant="outline" onClick={handleBackToMaster}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            ) : (
              <Link to={`/${companySlug}/dashboard`}>
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
              Usuários
            </h1>
          </div>
          <GradientButton onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </GradientButton>
        </div>

        {/* Lista de usuários */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          </div>
        ) : users.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum usuário ainda</h3>
            <p className="text-gray-500 mb-6">
              Crie o primeiro usuário da empresa
            </p>
            <GradientButton onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Usuário
            </GradientButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      {user.status}
                    </Badge>
                  </div>

                  {/* Informações de contato */}
                  <div className="space-y-2 mb-4 text-sm">
                    {user.phone && (
                      <a 
                        href={`tel:${user.phone.replace(/\D/g, '')}`}
                        className="flex items-center gap-2 text-gray-600 hover:text-violet-600 transition-colors cursor-pointer"
                        title="Ligar"
                      >
                        <Phone className="w-3 h-3" />
                        {user.phone}
                      </a>
                    )}
                    {user.whatsapp && (
                      <a 
                        href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors cursor-pointer"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" />
                        {user.whatsapp}
                      </a>
                    )}
                    {user.address && (
                      <a 
                        href={`https://www.google.com/maps/search/${encodeURIComponent(user.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
                        title="Abrir no Google Maps"
                      >
                        <MapPin className="w-3 h-3" />
                        {user.address}
                      </a>
                    )}
                    {user.instagram && (
                      <a 
                        href={`https://instagram.com/${user.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors cursor-pointer"
                        title="Abrir Instagram"
                      >
                        <Instagram className="w-3 h-3" />
                        {user.instagram}
                      </a>
                    )}
                    {user.facebook && (
                      <a 
                        href={user.facebook.startsWith('http') ? user.facebook : `https://facebook.com/${user.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Abrir Facebook"
                      >
                        <Facebook className="w-3 h-3" />
                        {user.facebook.replace('https://facebook.com/', '').replace('https://www.facebook.com/', '')}
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id, user.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Dialog Criar */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Campos obrigatórios */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Informações Básicas *</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Nome *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="joao@email.com"
                    />
                  </div>
                  <div>
                    <Label>Senha *</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>
              </div>

              {/* Campos opcionais */}
              <div>
                <h3 className="font-semibold mb-3">Informações Adicionais (opcional)</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Telefone (ligação)</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                    />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="(11) 98765-4321"
                    />
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número, bairro, cidade, estado"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Instagram</Label>
                    <Input
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@usuario"
                    />
                  </div>
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="https://facebook.com/usuario"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <GradientButton
                onClick={handleCreate}
                loading={createMutation.isPending}
              >
                Criar Usuário
              </GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Editar */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email (não editável)</Label>
                <Input
                  value={formData.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label>Telefone (ligação)</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <Label>Endereço</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                />
              </div>
              <div>
                <Label>Facebook</Label>
                <Input
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <GradientButton
                onClick={handleUpdate}
                loading={updateMutation.isPending}
              >
                Salvar Alterações
              </GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
