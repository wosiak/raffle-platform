import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  Lock
} from 'lucide-react';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  locked: 'bg-amber-100 text-amber-700',
  executed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusIcons = {
  draft: Clock,
  locked: Lock,
  executed: CheckCircle,
  cancelled: XCircle,
};

const typeLabels = {
  list: 'Lista',
  numeric_range: 'Numérico',
  weighted: 'Ponderado',
  teams: 'Times',
  shuffle: 'Embaralhar',
  elimination: 'Eliminação',
};

export default function CompanyDraws() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const { getCurrentCompanyId, isMaster, exitImpersonate } = useAuth();

  const { data: draws = [], isLoading } = useQuery({
    queryKey: ['draws', getCurrentCompanyId()],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase não configurado');
      const companyId = getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('draws')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

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
              Sorteios
            </h1>
          </div>
          <Link to={`/${companySlug}/draws/new`}>
            <GradientButton>
              <Plus className="w-4 h-4 mr-2" />
              Novo Sorteio
            </GradientButton>
          </Link>
        </div>

        {/* Lista de sorteios */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          </div>
        ) : draws.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum sorteio ainda</h3>
            <p className="text-gray-500 mb-6">
              Crie seu primeiro sorteio para começar
            </p>
            <Link to={`/${companySlug}/draws/new`}>
              <GradientButton>
                <Plus className="w-4 h-4 mr-2" />
                Criar Sorteio
              </GradientButton>
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {draws.map((draw, index) => {
              const StatusIcon = statusIcons[draw.status as keyof typeof statusIcons];
              
              return (
                <motion.div
                  key={draw.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{draw.title}</h3>
                          <Badge className={statusColors[draw.status as keyof typeof statusColors]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {draw.status}
                          </Badge>
                          <Badge variant="outline">
                            {typeLabels[draw.type as keyof typeof typeLabels] || draw.type}
                          </Badge>
                        </div>
                        
                        {draw.description && (
                          <p className="text-gray-600 mb-3">{draw.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Criado em: {format(new Date(draw.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {draw.executed_at && (
                            <span>
                              Executado em: {format(new Date(draw.executed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          )}
                          {draw.participants_count > 0 && (
                            <span>
                              {draw.participants_count} participante{draw.participants_count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-col items-end">
                        {draw.status === 'draft' && (
                          <Link to={`/${companySlug}/draws/${draw.id}/execute`} state={{ draw }}>
                            <GradientButton>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Executar
                            </GradientButton>
                          </Link>
                        )}
                        {draw.status === 'executed' && draw.results && draw.results.winner && (
                          <div className="text-right w-full max-w-md">
                            <div className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-lg px-4 py-3">
                              {draw.type === 'teams' ? (
                                <>
                                  <p className="text-sm mb-2">Times Formados</p>
                                  <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                                    {(() => {
                                      try {
                                        const teams = JSON.parse(draw.results.winner);
                                        return Object.entries(teams).map(([teamName, members]: [string, any]) => (
                                          <div key={teamName} className="bg-white/20 rounded p-1">
                                            <strong>{teamName}:</strong> {members.join(', ')}
                                          </div>
                                        ));
                                      } catch {
                                        return <p className="text-sm">{draw.results.winner}</p>;
                                      }
                                    })()}
                                  </div>
                                </>
                              ) : draw.type === 'shuffle' ? (
                                <>
                                  <p className="text-sm mb-2">Ordem Embaralhada</p>
                                  <div className="text-xs max-h-32 overflow-y-auto">
                                    {(() => {
                                      try {
                                        const shuffled = JSON.parse(draw.results.winner);
                                        return shuffled.map((item: string, index: number) => (
                                          <div key={index}>
                                            #{index + 1} {item}
                                          </div>
                                        ));
                                      } catch {
                                        return <p>{draw.results.winner}</p>;
                                      }
                                    })()}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm">
                                    {draw.type === 'numeric_range' && draw.results.winner.includes(',') 
                                      ? 'Números Sorteados:' 
                                      : 'Vencedor:'}
                                  </p>
                                  <p className="text-lg font-bold break-words">{draw.results.winner}</p>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
