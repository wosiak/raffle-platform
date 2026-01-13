import React, { useState, useEffect } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Megaphone,
  Plus,
  Calendar,
  Users,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  Instagram,
  Facebook,
  Heart,
  Share2,
  MessageCircle,
  UserPlus,
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  ended: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-rose-100 text-rose-700'
};

const statusLabels = {
  draft: 'Rascunho',
  active: 'Ativa',
  paused: 'Pausada',
  ended: 'Encerrada',
  cancelled: 'Cancelada'
};

const ruleTypeIcons = {
  follow: UserPlus,
  like: Heart,
  share: Share2,
  comment: MessageCircle,
  tag_friends: Users,
  custom: CheckCircle
};

const ruleTypeLabels = {
  follow: 'Seguir',
  like: 'Curtir',
  share: 'Compartilhar',
  comment: 'Comentar',
  tag_friends: 'Marcar amigos',
  custom: 'Personalizado'
};

const platformIcons = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Megaphone,
  twitter: MessageCircle,
  youtube: Trophy,
  any: CheckCircle
};

export default function Campaigns() {
  const queryClient = useQueryClient();
  const [organization, setOrganization] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    slug: '',
    start_date: '',
    end_date: '',
    rules: [],
    winners_count: 1,
    require_email: true,
    require_phone: false,
    status: 'draft'
  });
  const [newRule, setNewRule] = useState({
    type: 'follow',
    platform: 'instagram',
    target_url: '',
    target_username: '',
    description: '',
    validation_type: 'manual_link',
    required: true,
    extra_entries: 0
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

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.filter({}, '-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!organization?.id) {
        throw new Error('Organização não carregada. Por favor, recarregue a página.');
      }
      return base44.entities.Campaign.create({
        ...data,
        organization_id: organization.id,
        participants_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCreateDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Campaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setEditingCampaign(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Campaign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    }
  });

  const resetForm = () => {
    setNewCampaign({
      title: '',
      description: '',
      slug: '',
      start_date: '',
      end_date: '',
      rules: [],
      winners_count: 1,
      require_email: true,
      require_phone: false,
      status: 'draft'
    });
  };

  const addRule = () => {
    setNewCampaign(prev => ({
      ...prev,
      rules: [...prev.rules, { ...newRule, id: crypto.randomUUID() }]
    }));
    setNewRule({
      type: 'follow',
      platform: 'instagram',
      target_url: '',
      target_username: '',
      description: '',
      validation_type: 'manual_link',
      required: true,
      extra_entries: 0
    });
  };

  const removeRule = (id) => {
    setNewCampaign(prev => ({
      ...prev,
      rules: prev.rules.filter(r => r.id !== id)
    }));
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

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
                <Megaphone className="w-6 h-6 text-pink-500" />
                Campanhas de Engajamento
              </h1>
              <p className="text-sm text-gray-500">
                Crie campanhas para aumentar o engajamento nas redes sociais
              </p>
            </div>
          </div>
          <GradientButton icon={Plus} onClick={() => setShowCreateDialog(true)}>
            Nova Campanha
          </GradientButton>
        </div>

        {/* Campaigns Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : campaigns.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma campanha criada
            </h3>
            <p className="text-gray-500 mb-6">
              Crie campanhas para promover sorteios e aumentar o engajamento
            </p>
            <GradientButton icon={Plus} onClick={() => setShowCreateDialog(true)}>
              Criar primeira campanha
            </GradientButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Badge className={statusColors[campaign.status]}>
                        {statusLabels[campaign.status]}
                      </Badge>
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-2">
                        {campaign.title}
                      </h3>
                    </div>
                    {campaign.cover_image_url && (
                      <img 
                        src={campaign.cover_image_url} 
                        alt="" 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                  </div>

                  {campaign.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {campaign.start_date && campaign.end_date ? (
                        <>
                          {format(new Date(campaign.start_date), 'dd/MM', { locale: ptBR })} - 
                          {format(new Date(campaign.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </>
                      ) : (
                        'Datas não definidas'
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      {campaign.participants_count || 0} participantes
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Trophy className="w-4 h-4" />
                      {campaign.winners_count || 1} vencedor{(campaign.winners_count || 1) > 1 ? 'es' : ''}
                    </div>
                  </div>

                  {campaign.rules?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {campaign.rules.slice(0, 3).map((rule, i) => {
                        const Icon = ruleTypeIcons[rule.type] || CheckCircle;
                        return (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Icon className="w-3 h-3 mr-1" />
                            {ruleTypeLabels[rule.type]}
                          </Badge>
                        );
                      })}
                      {campaign.rules.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{campaign.rules.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to={createPageUrl(`CampaignLanding?slug=${campaign.slug}`)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Landing
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to={createPageUrl(`CampaignEntries?campaignId=${campaign.id}`)}>
                        <Users className="w-4 h-4 mr-1" />
                        {campaign.participants_count || 0}
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingCampaign(campaign)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-rose-500 hover:text-rose-600"
                      onClick={() => deleteMutation.mutate(campaign.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog || !!editingCampaign} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingCampaign(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-pink-500" />
                {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Título *</Label>
                  <Input
                    value={editingCampaign?.title || newCampaign.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      if (editingCampaign) {
                        setEditingCampaign({ ...editingCampaign, title });
                      } else {
                        setNewCampaign({ ...newCampaign, title, slug: generateSlug(title) });
                      }
                    }}
                    placeholder="Ex: Sorteio de Natal"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={editingCampaign?.slug || newCampaign.slug}
                    onChange={(e) => {
                      const slug = e.target.value;
                      if (editingCampaign) {
                        setEditingCampaign({ ...editingCampaign, slug });
                      } else {
                        setNewCampaign({ ...newCampaign, slug });
                      }
                    }}
                    placeholder="sorteio-natal"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={editingCampaign?.description || newCampaign.description}
                    onChange={(e) => {
                      const description = e.target.value;
                      if (editingCampaign) {
                        setEditingCampaign({ ...editingCampaign, description });
                      } else {
                        setNewCampaign({ ...newCampaign, description });
                      }
                    }}
                    placeholder="Descreva a campanha..."
                  />
                </div>
                <div>
                  <Label>Data de início</Label>
                  <Input
                    type="datetime-local"
                    value={editingCampaign?.start_date?.slice(0, 16) || newCampaign.start_date}
                    onChange={(e) => {
                      const start_date = e.target.value;
                      if (editingCampaign) {
                        setEditingCampaign({ ...editingCampaign, start_date });
                      } else {
                        setNewCampaign({ ...newCampaign, start_date });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Data de término</Label>
                  <Input
                    type="datetime-local"
                    value={editingCampaign?.end_date?.slice(0, 16) || newCampaign.end_date}
                    onChange={(e) => {
                      const end_date = e.target.value;
                      if (editingCampaign) {
                        setEditingCampaign({ ...editingCampaign, end_date });
                      } else {
                        setNewCampaign({ ...newCampaign, end_date });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Quantidade de vencedores</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingCampaign?.winners_count || newCampaign.winners_count}
                    onChange={(e) => {
                      const winners_count = parseInt(e.target.value) || 1;
                      if (editingCampaign) {
                        setEditingCampaign({ ...editingCampaign, winners_count });
                      } else {
                        setNewCampaign({ ...newCampaign, winners_count });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editingCampaign?.status || newCampaign.status}
                    onValueChange={(status) => {
                      if (editingCampaign) {
                        setEditingCampaign({ ...editingCampaign, status });
                      } else {
                        setNewCampaign({ ...newCampaign, status });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="paused">Pausada</SelectItem>
                      <SelectItem value="ended">Encerrada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rules Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Regras de Participação
                </h3>

                {/* Existing rules */}
                {(editingCampaign?.rules || newCampaign.rules)?.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {(editingCampaign?.rules || newCampaign.rules).map((rule) => {
                      const Icon = ruleTypeIcons[rule.type] || CheckCircle;
                      return (
                        <div key={rule.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Icon className="w-5 h-5 text-violet-500" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{ruleTypeLabels[rule.type]}</p>
                            <p className="text-xs text-gray-500">
                              {rule.platform} • {rule.target_username || rule.target_url || 'Validação ' + rule.validation_type}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRule(rule.id)}
                          >
                            <XCircle className="w-4 h-4 text-rose-500" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add new rule */}
                <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Tipo de ação</Label>
                      <Select value={newRule.type} onValueChange={(type) => setNewRule({ ...newRule, type })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="follow">Seguir</SelectItem>
                          <SelectItem value="like">Curtir</SelectItem>
                          <SelectItem value="share">Compartilhar</SelectItem>
                          <SelectItem value="comment">Comentar</SelectItem>
                          <SelectItem value="tag_friends">Marcar amigos</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Plataforma</Label>
                      <Select value={newRule.platform} onValueChange={(platform) => setNewRule({ ...newRule, platform })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="twitter">Twitter/X</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="any">Qualquer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Username/Perfil</Label>
                      <Input
                        value={newRule.target_username}
                        onChange={(e) => setNewRule({ ...newRule, target_username: e.target.value })}
                        placeholder="@usuario"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Validação</Label>
                      <Select value={newRule.validation_type} onValueChange={(validation_type) => setNewRule({ ...newRule, validation_type })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual_link">Link como prova</SelectItem>
                          <SelectItem value="manual_screenshot">Print como prova</SelectItem>
                          <SelectItem value="partner_confirmation">Confirmação do parceiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={addRule} variant="outline" size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar regra
                  </Button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Exigir email</p>
                  <p className="text-sm text-gray-500">Participante deve informar email</p>
                </div>
                <Switch
                  checked={editingCampaign?.require_email ?? newCampaign.require_email}
                  onCheckedChange={(require_email) => {
                    if (editingCampaign) {
                      setEditingCampaign({ ...editingCampaign, require_email });
                    } else {
                      setNewCampaign({ ...newCampaign, require_email });
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                setEditingCampaign(null);
                resetForm();
              }}>
                Cancelar
              </Button>
              <GradientButton
                onClick={() => {
                  if (editingCampaign) {
                    updateMutation.mutate({ id: editingCampaign.id, data: editingCampaign });
                  } else {
                    createMutation.mutate(newCampaign);
                  }
                }}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCampaign ? 'Salvar' : 'Criar campanha'}
              </GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}