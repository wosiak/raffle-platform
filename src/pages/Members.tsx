import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Search,
  Trophy,
  Wallet,
  Mail,
  Phone,
  Edit,
  Trash2,
  ArrowLeft,
  UserPlus,
  Crown,
  ShieldCheck
} from "lucide-react";

const roleLabels = {
  owner: 'Proprietário',
  admin: 'Administrador',
  moderator: 'Moderador',
  member: 'Membro'
};

const roleColors = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-violet-100 text-violet-700',
  moderator: 'bg-blue-100 text-blue-700',
  member: 'bg-gray-100 text-gray-700'
};

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-700',
  blocked: 'bg-rose-100 text-rose-700'
};

export default function Members() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditMember, setCreditMember] = useState(null);

  const [newMember, setNewMember] = useState({
    name: '',
    user_email: '',
    phone: '',
    role: 'member',
    credit_balance: 0,
    status: 'active'
  });

  // Carregar organização
  useEffect(() => {
    async function loadOrganization() {
      try {
        const orgs = await base44.entities.Organization.list();
        if (orgs.length > 0) {
          setOrganization(orgs[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar organização:', error);
      }
    }
    loadOrganization();
  }, []);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.Member.filter({}, '-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!organization?.id) {
        throw new Error('Organização não carregada. Por favor, recarregue a página.');
      }
      return base44.entities.Member.create({
        ...data,
        organization_id: organization.id,
        total_earned: 0,
        total_spent: 0,
        wins_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setShowCreateDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Member.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setEditingMember(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Member.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    }
  });

  const adjustCreditMutation = useMutation({
    mutationFn: async ({ member, amount }) => {
      if (!organization?.id) {
        throw new Error('Organização não carregada. Por favor, recarregue a página.');
      }
      const newBalance = (member.credit_balance || 0) + amount;
      await base44.entities.Member.update(member.id, { 
        credit_balance: newBalance,
        total_earned: amount > 0 ? (member.total_earned || 0) + amount : member.total_earned
      });
      await base44.entities.Transaction.create({
        organization_id: organization.id,
        member_id: member.id,
        type: 'credit_adjustment',
        amount: amount,
        balance_before: member.credit_balance || 0,
        balance_after: newBalance,
        description: amount > 0 ? 'Crédito adicionado manualmente' : 'Crédito removido manualmente',
        status: 'completed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setShowCreditDialog(false);
      setCreditAmount(0);
      setCreditMember(null);
    }
  });

  const resetForm = () => {
    setNewMember({
      name: '',
      user_email: '',
      phone: '',
      role: 'member',
      credit_balance: 0,
      status: 'active'
    });
  };

  const filteredMembers = members.filter(member =>
    !search ||
    member.name?.toLowerCase().includes(search.toLowerCase()) ||
    member.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCredits = members.reduce((sum, m) => sum + (m.credit_balance || 0), 0);
  const activeMembers = members.filter(m => m.status === 'active').length;

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-violet-500" />
                Membros
              </h1>
              <p className="text-sm text-gray-500">
                Gerencie os membros do Winners Club
              </p>
            </div>
          </div>
          <GradientButton icon={UserPlus} onClick={() => setShowCreateDialog(true)}>
            Novo Membro
          </GradientButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <GlassCard className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Membros</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Membros Ativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeMembers}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total em Créditos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCredits.toLocaleString()}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Search */}
        <GlassCard className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </GlassCard>

        {/* Table */}
        <GlassCard className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhum membro encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                  <TableHead>Membro</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Vitórias</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-medium">
                          {member.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {member.user_email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="w-3 h-3" />
                            {member.user_email}
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[member.role]}>
                        {member.role === 'owner' && <Crown className="w-3 h-3 mr-1" />}
                        {roleLabels[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium text-emerald-600">
                        <Wallet className="w-4 h-4" />
                        {(member.credit_balance || 0).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-amber-600">
                        <Trophy className="w-4 h-4" />
                        {member.wins_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[member.status]}>
                        {member.status === 'active' ? 'Ativo' : member.status === 'blocked' ? 'Bloqueado' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCreditMember(member);
                            setShowCreditDialog(true);
                          }}
                        >
                          <Wallet className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMember(member)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-500"
                          onClick={() => deleteMutation.mutate(member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </GlassCard>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog || !!editingMember} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingMember(null);
            resetForm();
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-violet-500" />
                {editingMember ? 'Editar Membro' : 'Novo Membro'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={editingMember?.name || newMember.name}
                  onChange={(e) => {
                    if (editingMember) {
                      setEditingMember({ ...editingMember, name: e.target.value });
                    } else {
                      setNewMember({ ...newMember, name: e.target.value });
                    }
                  }}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingMember?.user_email || newMember.user_email}
                  onChange={(e) => {
                    if (editingMember) {
                      setEditingMember({ ...editingMember, user_email: e.target.value });
                    } else {
                      setNewMember({ ...newMember, user_email: e.target.value });
                    }
                  }}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editingMember?.phone || newMember.phone}
                  onChange={(e) => {
                    if (editingMember) {
                      setEditingMember({ ...editingMember, phone: e.target.value });
                    } else {
                      setNewMember({ ...newMember, phone: e.target.value });
                    }
                  }}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Função</Label>
                  <Select
                    value={editingMember?.role || newMember.role}
                    onValueChange={(role) => {
                      if (editingMember) {
                        setEditingMember({ ...editingMember, role });
                      } else {
                        setNewMember({ ...newMember, role });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editingMember?.status || newMember.status}
                    onValueChange={(status) => {
                      if (editingMember) {
                        setEditingMember({ ...editingMember, status });
                      } else {
                        setNewMember({ ...newMember, status });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                setEditingMember(null);
                resetForm();
              }}>
                Cancelar
              </Button>
              <GradientButton
                onClick={() => {
                  if (editingMember) {
                    updateMutation.mutate({ id: editingMember.id, data: editingMember });
                  } else {
                    createMutation.mutate(newMember);
                  }
                }}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingMember ? 'Salvar' : 'Cadastrar'}
              </GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credit Adjustment Dialog */}
        <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500" />
                Ajustar Créditos
              </DialogTitle>
            </DialogHeader>

            {creditMember && (
              <div className="py-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  <p className="text-sm text-gray-500">Membro</p>
                  <p className="font-semibold">{creditMember.name}</p>
                  <p className="text-sm text-gray-500 mt-2">Saldo atual</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {(creditMember.credit_balance || 0).toLocaleString()} créditos
                  </p>
                </div>

                <div>
                  <Label>Valor do ajuste (positivo para adicionar, negativo para remover)</Label>
                  <Input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                    placeholder="Ex: 100 ou -50"
                  />
                </div>

                {creditAmount !== 0 && (
                  <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <p className="text-sm text-violet-600">
                      Novo saldo: {((creditMember.credit_balance || 0) + creditAmount).toLocaleString()} créditos
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
                Cancelar
              </Button>
              <GradientButton
                onClick={() => adjustCreditMutation.mutate({ member: creditMember, amount: creditAmount })}
                loading={adjustCreditMutation.isPending}
                disabled={creditAmount === 0}
              >
                Confirmar ajuste
              </GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}