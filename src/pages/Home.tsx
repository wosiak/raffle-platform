import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import TestimonialCard from "@/components/testimonials/TestimonialCard";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Trophy,
  Users,
  Gift,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Plus,
  History,
  Building2,
  Megaphone
} from "lucide-react";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
    enabled: !!user,
  });

  const { data: recentDraws = [] } = useQuery({
    queryKey: ['recent-draws'],
    queryFn: () => base44.entities.Draw.filter({}, '-created_date', 5),
    enabled: !!user,
  });

  const { data: featuredTestimonials = [] } = useQuery({
    queryKey: ['featured-testimonials'],
    queryFn: () => base44.entities.Testimonial.filter({ 
      status: 'approved',
      featured: true 
    }, '-created_date', 6),
    enabled: !!user,
  });

  const features = [
    {
      icon: Trophy,
      title: "Motor de Sorteio Universal",
      description: "Lista, intervalo numérico, pesos, times, embaralhar e eliminatória",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "Sorteio Verificável",
      description: "Prova criptográfica com commit-reveal para total transparência",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: Gift,
      title: "Sistema de Créditos",
      description: "Carteira digital, vouchers e catálogo de parceiros",
      color: "from-violet-500 to-purple-500"
    },
    {
      icon: Megaphone,
      title: "Campanhas Sociais",
      description: "Landing pages para campanhas de seguir, curtir e compartilhar",
      color: "from-pink-500 to-rose-500"
    },
  ];

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200 px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1 inline" />
            Sistema Multi-tenant
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Winners Club
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              Sistema de Sorteios
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Plataforma completa para sorteios verificáveis, campanhas de engajamento 
            e gestão de créditos com parceiros.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={createPageUrl('NewDraw')}>
              <GradientButton size="lg" icon={Plus}>
                Novo Sorteio
              </GradientButton>
            </Link>
            <Link to={createPageUrl('DrawHistory')}>
              <GradientButton variant="secondary" size="lg" icon={History}>
                Histórico
              </GradientButton>
            </Link>
          </div>
        </motion.div>

        {/* Quick Stats */}
        {user && organizations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            <GlassCard className="p-5 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {recentDraws.filter(d => d.status === 'executed').length}
              </p>
              <p className="text-sm text-gray-500">Sorteios Realizados</p>
            </GlassCard>
            <GlassCard className="p-5 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-violet-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {organizations.length}
              </p>
              <p className="text-sm text-gray-500">Organizações</p>
            </GlassCard>
            <GlassCard className="p-5 text-center">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-sm text-gray-500">Parceiros</p>
            </GlassCard>
            <GlassCard className="p-5 text-center">
              <Megaphone className="w-8 h-8 mx-auto mb-2 text-pink-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-sm text-gray-500">Campanhas Ativas</p>
            </GlassCard>
          </motion.div>
        )}

        {/* Testimonials Section */}
        {user && featuredTestimonials.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                O que nossos vencedores dizem
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Depoimentos reais de quem já ganhou
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredTestimonials.slice(0, 3).map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} featured />
              ))}
            </div>

            <div className="text-center mt-6">
              <Link to={createPageUrl('Testimonials')}>
                <GradientButton variant="secondary">
                  Ver todos os depoimentos
                </GradientButton>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <GlassCard key={index} className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </motion.div>

        {/* Recent Draws */}
        {user && recentDraws.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-violet-500" />
                  Sorteios Recentes
                </h2>
                <Link to={createPageUrl('DrawHistory')}>
                  <GradientButton variant="secondary" size="sm">
                    Ver todos
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </GradientButton>
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentDraws.slice(0, 5).map((draw) => (
                  <div 
                    key={draw.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        draw.status === 'executed' 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : draw.status === 'locked'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {draw.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {draw.participants_count || 0} participantes
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      draw.status === 'executed' ? 'default' : 
                      draw.status === 'locked' ? 'secondary' : 'outline'
                    }>
                      {draw.status === 'executed' ? 'Realizado' : 
                       draw.status === 'locked' ? 'Travado' : 'Rascunho'}
                    </Badge>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* CTA for non-logged users */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <GlassCard className="p-8 max-w-2xl mx-auto">
              <Zap className="w-12 h-12 mx-auto mb-4 text-violet-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Comece a usar agora
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Faça login para criar sorteios, gerenciar campanhas e muito mais.
              </p>
              <GradientButton 
                size="lg"
                onClick={() => base44.auth.redirectToLogin()}
              >
                Entrar / Cadastrar
              </GradientButton>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}