import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Search, Trash2, Mail, Phone, MapPin, User, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Participant {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  whatsapp: string | null;
  address: string;
  instagram: string | null;
  facebook: string | null;
  created_at: string;
}

export default function MasterParticipants() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    whatsapp: '',
    address: '',
    instagram: '',
    facebook: '',
  });

  // Carregar participantes
  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Participant[];
    },
  });

  // Criar participante
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const { data: created, error } = await supabase
        .from('participants')
        .insert({
          name: data.name,
          email: data.email,
          cpf: data.cpf.replace(/\D/g, ''), // Remove formatação
          phone: data.phone,
          whatsapp: data.whatsapp || null,
          address: data.address,
          instagram: data.instagram || null,
          facebook: data.facebook || null,
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('email')) {
            throw new Error('Email já cadastrado');
          }
          if (error.message.includes('cpf')) {
            throw new Error('CPF já cadastrado');
          }
        }
        throw error;
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      queryClient.invalidateQueries({ queryKey: ['participants-summary'] });
      setShowCreateDialog(false);
      setNewParticipant({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        whatsapp: '',
        address: '',
        instagram: '',
        facebook: '',
      });
      toast.success('Participante cadastrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao cadastrar participante');
    },
  });

  // Deletar participante
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      queryClient.invalidateQueries({ queryKey: ['participants-summary'] });
      toast.success('Participante removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover participante');
    },
  });

  // Filtrar participantes
  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf.includes(searchTerm) ||
    p.phone.includes(searchTerm)
  );

  const handleDelete = (participant: Participant) => {
    if (confirm(`Remover ${participant.name}?\n\nEsta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(participant.id);
    }
  };

  const handleCreate = () => {
    // Validar campos obrigatórios
    if (!newParticipant.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!newParticipant.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }
    if (!newParticipant.cpf.trim()) {
      toast.error('CPF é obrigatório');
      return;
    }
    if (!newParticipant.phone.trim()) {
      toast.error('Telefone é obrigatório');
      return;
    }
    if (!newParticipant.address.trim()) {
      toast.error('Endereço é obrigatório');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newParticipant.email)) {
      toast.error('Email inválido');
      return;
    }

    // Validar CPF (11 dígitos)
    const cpfDigits = newParticipant.cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }

    createMutation.mutate(newParticipant);
  };

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/master/companies')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
                Participantes
              </h1>
              <p className="text-gray-600 mt-2">
                {filteredParticipants.length} participante{filteredParticipants.length !== 1 ? 's' : ''} cadastrado{filteredParticipants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <GradientButton onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Participante
          </GradientButton>
        </div>

        {/* Busca */}
        <GlassCard className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email, CPF ou telefone..."
              className="pl-10 bg-white/10 border-white/20"
            />
          </div>
        </GlassCard>

        {/* Lista de participantes */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum participante ainda'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Tente buscar com outros termos' : 'Participantes cadastrados aparecerão aqui'}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filteredParticipants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold">{participant.name}</h3>
                        <span className="text-xs text-gray-500">
                          {format(new Date(participant.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {/* Email */}
                        <a
                          href={`mailto:${participant.email}`}
                          className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {participant.email}
                        </a>

                        {/* Telefone */}
                        <a
                          href={`tel:${participant.phone}`}
                          className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {participant.phone}
                        </a>

                        {/* CPF */}
                        <div className="flex items-center gap-2 text-gray-300">
                          <User className="w-4 h-4" />
                          CPF: {participant.cpf}
                        </div>

                        {/* WhatsApp */}
                        {participant.whatsapp && (
                          <a
                            href={`https://wa.me/${participant.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                          >
                            📱 WhatsApp
                          </a>
                        )}

                        {/* Instagram */}
                        {participant.instagram && (
                          <a
                            href={`https://instagram.com/${participant.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
                          >
                            📷 @{participant.instagram}
                          </a>
                        )}

                        {/* Facebook */}
                        {participant.facebook && (
                          <a
                            href={`https://facebook.com/${participant.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            👤 {participant.facebook}
                          </a>
                        )}
                      </div>

                      {/* Endereço */}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(participant.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mt-3 text-sm"
                      >
                        <MapPin className="w-4 h-4" />
                        {participant.address}
                      </a>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(participant)}
                      className="ml-4 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Dialog criar participante */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Participante</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="md:col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                    placeholder="Ex: João da Silva"
                  />
                </div>
                
                {/* Email */}
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                {/* CPF */}
                <div>
                  <Label>CPF *</Label>
                  <Input
                    value={newParticipant.cpf}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 11) {
                        // Formatar CPF: 123.456.789-01
                        if (value.length > 9) {
                          value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                        } else if (value.length > 6) {
                          value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                        } else if (value.length > 3) {
                          value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                        }
                        setNewParticipant({ ...newParticipant, cpf: value });
                      }
                    }}
                    placeholder="123.456.789-01"
                    maxLength={14}
                  />
                </div>

                {/* Telefone */}
                <div>
                  <Label>Telefone *</Label>
                  <Input
                    value={newParticipant.phone}
                    onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    value={newParticipant.whatsapp}
                    onChange={(e) => setNewParticipant({ ...newParticipant, whatsapp: e.target.value })}
                    placeholder="5511987654321"
                  />
                  <p className="text-xs text-gray-500 mt-1">Com código do país (55)</p>
                </div>

                {/* Endereço */}
                <div className="md:col-span-2">
                  <Label>Endereço Completo *</Label>
                  <Input
                    value={newParticipant.address}
                    onChange={(e) => setNewParticipant({ ...newParticipant, address: e.target.value })}
                    placeholder="Rua, Número, Bairro, Cidade - Estado"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={newParticipant.instagram}
                    onChange={(e) => setNewParticipant({ ...newParticipant, instagram: e.target.value.replace('@', '') })}
                    placeholder="usuario"
                  />
                  <p className="text-xs text-gray-500 mt-1">Sem @</p>
                </div>

                {/* Facebook */}
                <div>
                  <Label>Facebook</Label>
                  <Input
                    value={newParticipant.facebook}
                    onChange={(e) => setNewParticipant({ ...newParticipant, facebook: e.target.value })}
                    placeholder="usuario"
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500">* Campos obrigatórios</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <GradientButton
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
              </GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
