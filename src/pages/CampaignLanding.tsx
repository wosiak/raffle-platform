import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Circle,
  Instagram,
  Heart,
  Share2,
  MessageCircle,
  UserPlus,
  Link as LinkIcon,
  Upload,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  PartyPopper
} from "lucide-react";

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

const validationLabels = {
  manual_link: 'Enviar link como prova',
  manual_screenshot: 'Enviar print como prova',
  partner_confirmation: 'Confirmação do parceiro'
};

export default function CampaignLanding() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const [formData, setFormData] = useState({
    participant_name: '',
    participant_email: '',
    participant_phone: '',
    social_username: '',
    rules_completion: []
  });
  const [evidences, setEvidences] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaign-landing', slug],
    queryFn: () => base44.entities.Campaign.filter({ slug }),
    enabled: !!slug,
  });

  const campaign = campaigns[0];

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const rulesCompletion = (campaign.rules || []).map(rule => ({
        rule_id: rule.id,
        completed: true,
        validated: false,
        validation_type: rule.validation_type,
        evidence_url: evidences[rule.id]?.link || '',
        evidence_screenshot_url: evidences[rule.id]?.screenshot || ''
      }));

      const entry = await base44.entities.CampaignEntry.create({
        campaign_id: campaign.id,
        organization_id: campaign.organization_id,
        ...data,
        rules_completion: rulesCompletion,
        entries_count: 1,
        status: 'pending'
      });

      // Update participants count
      await base44.entities.Campaign.update(campaign.id, {
        participants_count: (campaign.participants_count || 0) + 1
      });

      // Send confirmation email
      if (data.participant_email) {
        try {
          const rulesText = (campaign.rules || []).map((rule, i) => 
            `${i + 1}. ${ruleTypeLabels[rule.type]}${rule.description ? ` - ${rule.description}` : ''}`
          ).join('\n');

          const campaignUrl = `${window.location.origin}${window.location.pathname}?slug=${campaign.slug}`;

          await base44.integrations.Core.SendEmail({
            to: data.participant_email,
            from_name: 'Winners Club',
            subject: `✅ Inscrição confirmada: ${campaign.title}`,
            body: `
Olá ${data.participant_name}!

Sua inscrição na campanha "${campaign.title}" foi registrada com sucesso! 🎉

📋 RESUMO DA SUA INSCRIÇÃO:
- Nome: ${data.participant_name}
- Email: ${data.participant_email}
${data.participant_phone ? `- Telefone: ${data.participant_phone}` : ''}
${data.social_username ? `- Usuário social: ${data.social_username}` : ''}

🎯 REGRAS PARA PARTICIPAR:
${rulesText}

${campaign.prize_description ? `🏆 PRÊMIO: ${campaign.prize_description}\n\n` : ''}

⚠️ IMPORTANTE:
- Suas comprovações serão analisadas pela nossa equipe
- Certifique-se de ter cumprido todas as regras
- O sorteio será realizado em: ${campaign.end_date ? format(new Date(campaign.end_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'breve'}

🔗 Link da campanha: ${campaignUrl}

Boa sorte! 🍀

---
Winners Club - Sistema de Sorteios
            `.trim()
          });
        } catch (error) {
          console.error('Erro ao enviar email:', error);
        }
      }
    },
    onSuccess: () => {
      // Redirect to thank you page
      window.location.href = `/ThankYou?campaignId=${campaign.id}&name=${encodeURIComponent(formData.participant_name)}`;
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const isActive = campaign?.status === 'active';
  const hasEnded = campaign?.end_date && new Date(campaign.end_date) < new Date();
  const hasStarted = !campaign?.start_date || new Date(campaign.start_date) <= new Date();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-20 text-center">
          <GlassCard className="p-8">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold mb-2">Campanha não encontrada</h2>
            <p className="text-gray-500">Verifique o link e tente novamente.</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {campaign.cover_image_url && (
            <img 
              src={campaign.cover_image_url} 
              alt={campaign.title}
              className="w-full h-48 md:h-64 object-cover rounded-2xl mb-6 shadow-lg"
            />
          )}
          
          <Badge className={`mb-4 ${
            isActive && hasStarted && !hasEnded
              ? 'bg-emerald-100 text-emerald-700'
              : hasEnded
              ? 'bg-gray-100 text-gray-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {isActive && hasStarted && !hasEnded ? (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                Campanha Ativa
              </>
            ) : hasEnded ? (
              'Campanha Encerrada'
            ) : (
              <>
                <Clock className="w-3 h-3 mr-1" />
                Em breve
              </>
            )}
          </Badge>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {campaign.title}
          </h1>
          
          {campaign.description && (
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
              {campaign.description}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            {campaign.start_date && campaign.end_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(campaign.start_date), 'dd/MM', { locale: ptBR })} - 
                {format(new Date(campaign.end_date), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {campaign.participants_count || 0} participantes
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              {campaign.winners_count || 1} vencedor{(campaign.winners_count || 1) > 1 ? 'es' : ''}
            </div>
          </div>
        </motion.div>

        {/* Prize */}
        {(campaign.prize_description || campaign.prize_image_url) && (
          <GlassCard className="p-6 mb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Prêmio
            </h2>
            <div className="flex items-center gap-4">
              {campaign.prize_image_url && (
                <img 
                  src={campaign.prize_image_url} 
                  alt="Prêmio"
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                {campaign.prize_description}
              </p>
            </div>
          </GlassCard>
        )}

        {/* Rules */}
        <GlassCard className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Como participar
          </h2>
          
          <div className="space-y-4">
            {(campaign.rules || []).map((rule, index) => {
              const Icon = ruleTypeIcons[rule.type] || CheckCircle;
              return (
                <div key={rule.id || index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <Icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {index + 1}. {ruleTypeLabels[rule.type]}
                      </span>
                      {rule.platform && rule.platform !== 'any' && (
                        <Badge variant="outline" className="text-xs">
                          {rule.platform}
                        </Badge>
                      )}
                      {rule.required && (
                        <Badge className="bg-rose-100 text-rose-700 text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-500">{rule.description}</p>
                    )}
                    {rule.target_username && (
                      <a 
                        href={`https://${rule.platform}.com/${rule.target_username.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 mt-1"
                      >
                        {rule.target_username}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {rule.target_url && (
                      <a 
                        href={rule.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 mt-1"
                      >
                        Acessar link
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {validationLabels[rule.validation_type]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Participation Form */}
        {isActive && hasStarted && !hasEnded ? (
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-violet-500" />
              Inscreva-se
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome completo *</Label>
                <Input
                  value={formData.participant_name}
                  onChange={(e) => setFormData({ ...formData, participant_name: e.target.value })}
                  placeholder="Seu nome"
                  required
                />
              </div>

              {campaign.require_email && (
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.participant_email}
                    onChange={(e) => setFormData({ ...formData, participant_email: e.target.value })}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              )}

              {campaign.require_phone && (
                <div>
                  <Label>Telefone *</Label>
                  <Input
                    value={formData.participant_phone}
                    onChange={(e) => setFormData({ ...formData, participant_phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              )}

              <div>
                <Label>@ nas redes sociais</Label>
                <Input
                  value={formData.social_username}
                  onChange={(e) => setFormData({ ...formData, social_username: e.target.value })}
                  placeholder="@seuuser"
                />
              </div>

              {/* Evidence inputs for each rule */}
              {(campaign.rules || []).filter(r => r.validation_type === 'manual_link').length > 0 && (
                <div className="border-t pt-4">
                  <Label className="mb-3 block">Links de comprovação</Label>
                  {(campaign.rules || []).filter(r => r.validation_type === 'manual_link').map((rule, index) => (
                    <div key={rule.id || index} className="mb-3">
                      <Label className="text-xs text-gray-500">
                        {ruleTypeLabels[rule.type]} - Link de prova
                      </Label>
                      <Input
                        value={evidences[rule.id]?.link || ''}
                        onChange={(e) => setEvidences({ 
                          ...evidences, 
                          [rule.id]: { ...evidences[rule.id], link: e.target.value }
                        })}
                        placeholder="https://..."
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedTerms}
                  onCheckedChange={setAgreedTerms}
                />
                <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                  Concordo com os termos e condições da campanha
                </label>
              </div>

              <GradientButton
                type="submit"
                className="w-full"
                loading={submitMutation.isPending}
                disabled={!agreedTerms || !formData.participant_name}
              >
                Participar do Sorteio
              </GradientButton>
            </form>
          </GlassCard>
        ) : (
          <GlassCard className="p-8 text-center">
            {hasEnded ? (
              <>
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Campanha encerrada
                </h3>
                <p className="text-gray-500">
                  As inscrições para esta campanha foram encerradas.
                </p>
              </>
            ) : (
              <>
                <Clock className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Em breve
                </h3>
                <p className="text-gray-500">
                  As inscrições começam em {campaign.start_date ? format(new Date(campaign.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'breve'}.
                </p>
              </>
            )}
          </GlassCard>
        )}


      </div>
    </div>
  );
}