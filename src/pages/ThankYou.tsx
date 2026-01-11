import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { Badge } from "@/components/ui/badge";
import {
  PartyPopper,
  CheckCircle,
  Trophy,
  Calendar,
  Mail,
  Instagram,
  ExternalLink,
  Share2,
  Heart,
  MessageCircle,
  UserPlus,
  AlertCircle
} from "lucide-react";
import confetti from 'canvas-confetti';

const ruleTypeIcons = {
  follow: UserPlus,
  like: Heart,
  share: Share2,
  comment: MessageCircle,
  tag_friends: UserPlus,
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

export default function ThankYou() {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('campaignId');
  const participantName = urlParams.get('name');

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaign-thankyou', campaignId],
    queryFn: () => base44.entities.Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
  });

  const campaign = campaigns[0];

  useEffect(() => {
    // Trigger confetti on load
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#7C3AED', '#EC4899', '#06B6D4', '#10B981'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  if (!campaign) {
    return (
      <div className="min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-20 text-center">
          <GlassCard className="p-8">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold mb-2">Campanha não encontrada</h2>
          </GlassCard>
        </div>
      </div>
    );
  }

  const campaignUrl = `${window.location.origin}/CampaignLanding?slug=${campaign.slug}`;

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <PartyPopper className="w-20 h-20 mx-auto mb-4 text-violet-500" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Parabéns, {participantName || 'Participante'}! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Sua inscrição foi registrada com sucesso!
          </p>
        </motion.div>

        {/* Campaign Info */}
        <GlassCard className="p-6 mb-6 bg-gradient-to-br from-violet-500/10 to-pink-500/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-violet-500" />
            {campaign.title}
          </h2>
          
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            {campaign.prize_description && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Trophy className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">Prêmio</p>
                  <p className="text-amber-800 dark:text-amber-200">{campaign.prize_description}</p>
                </div>
              </div>
            )}
            
            {campaign.end_date && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Calendar className="w-5 h-5" />
                <span>
                  Sorteio em: {format(new Date(campaign.end_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Confirmation Email Notice */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <Mail className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Verifique seu e-mail
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Enviamos um e-mail de confirmação com todos os detalhes da sua inscrição, 
                incluindo as regras para participar e informações sobre o sorteio.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Rules Checklist */}
        <GlassCard className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Checklist: Complete todas as regras
          </h2>
          
          <div className="space-y-3">
            {(campaign.rules || []).map((rule, index) => {
              const Icon = ruleTypeIcons[rule.type] || CheckCircle;
              return (
                <div key={rule.id || index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-violet-600" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {ruleTypeLabels[rule.type]}
                      </span>
                      {rule.required && (
                        <Badge className="bg-rose-100 text-rose-700 text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {rule.description}
                      </p>
                    )}
                    {rule.target_username && (
                      <a 
                        href={`https://${rule.platform}.com/${rule.target_username.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
                      >
                        <Instagram className="w-3 h-3" />
                        {rule.target_username}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {rule.target_url && (
                      <a 
                        href={rule.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
                      >
                        Ir para o post
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-semibold mb-1">Importante!</p>
                <p>
                  Certifique-se de completar todas as regras obrigatórias. 
                  Suas comprovações serão analisadas pela nossa equipe antes do sorteio.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Terms & Regulations */}
        {campaign.terms_url && (
          <GlassCard className="p-6 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Regulamento
            </h3>
            <a
              href={campaign.terms_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700"
            >
              Ler regulamento completo
              <ExternalLink className="w-4 h-4" />
            </a>
          </GlassCard>
        )}

        {/* Next Steps */}
        <GlassCard className="p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Próximos passos
          </h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-sm font-semibold flex-shrink-0">
                1
              </div>
              <span className="text-gray-700 dark:text-gray-300">
                Complete todas as regras obrigatórias nas suas redes sociais
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-sm font-semibold flex-shrink-0">
                2
              </div>
              <span className="text-gray-700 dark:text-gray-300">
                Aguarde a validação da nossa equipe (você receberá confirmação por e-mail)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-sm font-semibold flex-shrink-0">
                3
              </div>
              <span className="text-gray-700 dark:text-gray-300">
                Aguarde o sorteio na data programada
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-sm font-semibold flex-shrink-0">
                4
              </div>
              <span className="text-gray-700 dark:text-gray-300">
                Se você for sorteado, receberá um e-mail com instruções para retirar o prêmio
              </span>
            </li>
          </ol>
        </GlassCard>

        {/* Share */}
        <GlassCard className="p-6 text-center">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Compartilhe com seus amigos!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Ajude a divulgar esta campanha e aumente suas chances
          </p>
          <div className="flex justify-center gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Participe dessa campanha incrível! ${campaign.title} - ${campaignUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GradientButton variant="secondary" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                WhatsApp
              </GradientButton>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GradientButton variant="secondary" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Facebook
              </GradientButton>
            </a>
          </div>
        </GlassCard>

        {/* Success Message */}
        <div className="text-center mt-8 text-gray-600 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">Boa sorte! 🍀</p>
          <p className="text-sm">
            Agradecemos pela sua participação e desejamos muito sucesso!
          </p>
        </div>
      </div>
    </div>
  );
}