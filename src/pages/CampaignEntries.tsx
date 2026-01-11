import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  Search,
  Filter,
  Mail,
  Phone,
  Instagram,
  Calendar,
  AlertCircle,
  Trophy
} from "lucide-react";

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  validated: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  winner: 'bg-violet-100 text-violet-700'
};

const statusLabels = {
  pending: 'Pendente',
  validated: 'Validado',
  rejected: 'Rejeitado',
  winner: 'Vencedor'
};

const ruleTypeLabels = {
  follow: 'Seguir',
  like: 'Curtir',
  share: 'Compartilhar',
  comment: 'Comentar',
  tag_friends: 'Marcar amigos',
  custom: 'Personalizado'
};

export default function CampaignEntries() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('campaignId');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [validationNotes, setValidationNotes] = useState('');

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => base44.entities.Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
  });
  const campaign = campaigns[0];

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['campaign-entries', campaignId],
    queryFn: () => base44.entities.CampaignEntry.filter({ campaign_id: campaignId }, '-created_date', 200),
    enabled: !!campaignId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ entryId, status, notes }) => {
      const entry = entries.find(e => e.id === entryId);
      
      await base44.entities.CampaignEntry.update(entryId, { 
        status,
        validation_notes: notes 
      });

      // Send email if marked as winner
      if (status === 'winner' && entry?.participant_email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: entry.participant_email,
            from_name: 'Winners Club',
            subject: `🎉 VOCÊ GANHOU! ${campaign?.title || 'Campanha'}`,
            body: `
Parabéns ${entry.participant_name}! 🎊

Você foi sorteado(a) como VENCEDOR(A) da campanha "${campaign?.title}"!

${campaign?.prize_description ? `🏆 SEU PRÊMIO: ${campaign.prize_description}\n\n` : ''}

📝 PRÓXIMOS PASSOS:
1. Entre em contato conosco dentro de 48 horas para validar seu prêmio
2. Tenha em mãos um documento de identificação
3. Aguarde instruções para retirada/recebimento do prêmio

⏰ PRAZO: Você tem até ${format(new Date(Date.now() + 48 * 60 * 60 * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} para responder

📧 Em caso de dúvidas, responda este e-mail.

Parabéns novamente! 🎉

---
Winners Club - Sistema de Sorteios
            `.trim()
          });
        } catch (error) {
          console.error('Erro ao enviar email:', error);
        }
      }

      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-entries'] });
      setSelectedEntry(null);
    }
  });

  const validateRuleMutation = useMutation({
    mutationFn: async ({ entry, ruleId, validated }) => {
      const updatedRules = entry.rules_completion.map(r => 
        r.rule_id === ruleId 
          ? { ...r, validated, validated_by: 'admin', validated_at: new Date().toISOString() }
          : r
      );
      
      const allValidated = updatedRules.every(r => r.validated);
      
      await base44.entities.CampaignEntry.update(entry.id, {
        rules_completion: updatedRules,
        status: allValidated ? 'validated' : entry.status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-entries'] });
    }
  });

  const filteredEntries = entries.filter(entry => {
    const matchSearch = !search || 
      entry.participant_name?.toLowerCase().includes(search.toLowerCase()) ||
      entry.participant_email?.toLowerCase().includes(search.toLowerCase()) ||
      entry.social_username?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || entry.status === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const stats = {
    total: entries.length,
    pending: entries.filter(e => e.status === 'pending').length,
    validated: entries.filter(e => e.status === 'validated').length,
    rejected: entries.filter(e => e.status === 'rejected').length,
  };

  if (!campaignId) {
    return (
      <div className="min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-20 text-center">
          <GlassCard className="p-8">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold mb-2">Campanha não especificada</h2>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Campaigns')}>
            <Button variant="ghost" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-pink-500" />
              Participantes da Campanha
            </h1>
            {campaign && (
              <p className="text-sm text-gray-500">{campaign.title}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <GlassCard className="p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-sm text-gray-500">Validados</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.validated}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-sm text-gray-500">Rejeitados</p>
            <p className="text-2xl font-bold text-rose-600">{stats.rejected}</p>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou @"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="validated">Validados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
                <SelectItem value="winner">Vencedores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCard>

        {/* Entries Table */}
        <GlassCard className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhuma inscrição encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                    <TableHead>Participante</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Inscrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {entry.participant_name}
                          </p>
                          {entry.social_username && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Instagram className="w-3 h-3" />
                              {entry.social_username}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {entry.participant_email && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Mail className="w-3 h-3" />
                              {entry.participant_email}
                            </div>
                          )}
                          {entry.participant_phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Phone className="w-3 h-3" />
                              {entry.participant_phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(entry.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[entry.status]}>
                          {statusLabels[entry.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </GlassCard>

        {/* Entry Details Dialog */}
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-500" />
                Detalhes da Inscrição
              </DialogTitle>
            </DialogHeader>

            {selectedEntry && (
              <div className="space-y-6 py-4">
                {/* Participant Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-semibold mb-3">Informações do Participante</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Nome</Label>
                      <p className="font-medium">{selectedEntry.participant_name}</p>
                    </div>
                    {selectedEntry.participant_email && (
                      <div>
                        <Label className="text-xs text-gray-500">Email</Label>
                        <p className="font-medium">{selectedEntry.participant_email}</p>
                      </div>
                    )}
                    {selectedEntry.participant_phone && (
                      <div>
                        <Label className="text-xs text-gray-500">Telefone</Label>
                        <p className="font-medium">{selectedEntry.participant_phone}</p>
                      </div>
                    )}
                    {selectedEntry.social_username && (
                      <div>
                        <Label className="text-xs text-gray-500">Usuário Social</Label>
                        <p className="font-medium">{selectedEntry.social_username}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-gray-500">Data de Inscrição</Label>
                      <p className="font-medium">
                        {format(new Date(selectedEntry.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Status</Label>
                      <Badge className={statusColors[selectedEntry.status]}>
                        {statusLabels[selectedEntry.status]}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Rules Validation */}
                <div>
                  <h3 className="font-semibold mb-3">Validação das Regras</h3>
                  <div className="space-y-3">
                    {selectedEntry.rules_completion?.map((ruleComp, index) => {
                      const rule = campaign?.rules?.find(r => r.id === ruleComp.rule_id);
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 ${
                            ruleComp.validated
                              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                              : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">
                                {ruleTypeLabels[rule?.type]} - {rule?.platform}
                              </p>
                              {rule?.description && (
                                <p className="text-sm text-gray-500">{rule.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={ruleComp.validated ? "default" : "outline"}
                                className={ruleComp.validated ? "bg-emerald-600" : ""}
                                onClick={() => validateRuleMutation.mutate({
                                  entry: selectedEntry,
                                  ruleId: ruleComp.rule_id,
                                  validated: !ruleComp.validated
                                })}
                              >
                                {ruleComp.validated ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Validado
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Não validado
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Evidence */}
                          {ruleComp.evidence_url && (
                            <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                              <Label className="text-xs text-gray-500 mb-1">Link de comprovação:</Label>
                              <a
                                href={ruleComp.evidence_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 break-all"
                              >
                                {ruleComp.evidence_url}
                                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                              </a>
                            </div>
                          )}
                          
                          {ruleComp.evidence_screenshot_url && (
                            <div className="mt-3">
                              <Label className="text-xs text-gray-500 mb-1">Screenshot:</Label>
                              <img
                                src={ruleComp.evidence_screenshot_url}
                                alt="Comprovação"
                                className="rounded-lg max-h-48 object-contain"
                              />
                            </div>
                          )}

                          {ruleComp.validated_at && (
                            <p className="text-xs text-gray-500 mt-2">
                              Validado em {format(new Date(ruleComp.validated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => {
                      updateStatusMutation.mutate({
                        entryId: selectedEntry.id,
                        status: 'validated',
                        notes: validationNotes
                      });
                    }}
                    disabled={selectedEntry.status === 'validated'}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar Inscrição
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => {
                      updateStatusMutation.mutate({
                        entryId: selectedEntry.id,
                        status: 'rejected',
                        notes: validationNotes
                      });
                    }}
                    disabled={selectedEntry.status === 'rejected'}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar Inscrição
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-violet-600 border-violet-200 hover:bg-violet-50"
                    onClick={() => {
                      updateStatusMutation.mutate({
                        entryId: selectedEntry.id,
                        status: 'winner',
                        notes: validationNotes
                      });
                    }}
                    disabled={selectedEntry.status === 'winner'}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Marcar como Vencedor
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEntry(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}