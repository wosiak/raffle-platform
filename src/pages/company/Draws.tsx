import React, { useState } from 'react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, 
  Plus, 
  Sparkles,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';

const typeLabels = {
  list: 'Lista',
  all_participants: 'Participantes',
  numeric_range: 'Numérico',
  weighted: 'Ponderado',
  shuffle: 'Embaralhar',
  elimination: 'Eliminação',
};

export default function CompanyDraws() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const { getCurrentCompanyId, isMaster, exitImpersonate } = useAuth();
  const [openParticipants, setOpenParticipants] = useState<Record<string, boolean>>({});

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
                          <Badge variant="outline">
                            {typeLabels[draw.type as keyof typeof typeLabels] || draw.type}
                          </Badge>
                          {draw.executed_at && (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Executado
                            </Badge>
                          )}
                          {!draw.executed_at && (
                            <Badge className="bg-gray-100 text-gray-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                        
                        {draw.description && (
                          <p className="text-gray-600 mb-3">{draw.description}</p>
                        )}
                        
                        {/* Mostrar participantes */}
                        {draw.items && Array.isArray(draw.items) && draw.items.length > 0 && (
                          <Collapsible
                            open={openParticipants[draw.id]}
                            onOpenChange={(isOpen) => setOpenParticipants({ ...openParticipants, [draw.id]: isOpen })}
                            className="mb-3"
                          >
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-2 text-violet-600 hover:text-violet-700">
                                <Users className="w-4 h-4" />
                                <span>
                                  {draw.items.length} participante{draw.items.length !== 1 ? 's' : ''}
                                </span>
                                {openParticipants[draw.id] ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <div className="bg-gradient-to-br from-violet-50 to-cyan-50 rounded-lg p-3 max-h-48 overflow-y-auto border border-violet-100">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {draw.items.map((item: any, idx: number) => (
                                    <div 
                                      key={item.id || idx}
                                      className="bg-white/80 backdrop-blur-sm rounded-md px-3 py-2 text-sm flex items-center justify-between shadow-sm border border-violet-200 hover:border-violet-400 hover:bg-white transition-all"
                                    >
                                      <span className="font-medium text-violet-900">{item.value}</span>
                                      {item.weight && item.weight !== 1 && (
                                        <Badge className="ml-2 text-xs bg-violet-100 text-violet-700 hover:bg-violet-200">
                                          Peso: {item.weight}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                        
                        {/* Configurações especiais para sorteios numéricos */}
                        {draw.type === 'numeric_range' && draw.config && (
                          <div className="mb-3">
                            <Badge variant="outline" className="text-xs">
                              Faixa: {draw.config.min || 1} até {draw.config.max || 100}
                              {draw.config.count && draw.config.count > 1 && ` (${draw.config.count} números)`}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Configurações de times - removido */}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Criado em: {format(new Date(draw.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {draw.executed_at && (
                            <span>
                              Executado em: {format(new Date(draw.executed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-col items-end">
                        {!draw.executed_at && (
                          <Link to={`/${companySlug}/draws/${draw.id}/execute`} state={{ draw }}>
                            <GradientButton>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Executar
                            </GradientButton>
                          </Link>
                        )}
                        {draw.executed_at && draw.result && draw.result.winner && (
                          <div className="text-right w-full max-w-md">
                            <div className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-lg px-4 py-3">
                              {draw.type === 'elimination' ? (
                                <>
                                  <p className="text-sm mb-2">Ordem de Eliminação</p>
                                  <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                                    {(() => {
                                      try {
                                        const result = JSON.parse(draw.result.winner);
                                        return (
                                          <>
                                            {result.eliminated.map((name: string, index: number) => (
                                              <div key={index} className="bg-white/20 rounded p-1">
                                                ❌ {index + 1}º eliminado: <strong>{name}</strong>
                                              </div>
                                            ))}
                                            <div className="bg-green-500/30 rounded p-2 mt-2">
                                              🏆 <strong>Vencedor: {result.winner}</strong>
                                            </div>
                                          </>
                                        );
                                      } catch {
                                        return <p className="text-sm">{draw.result.winner}</p>;
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
                                        const shuffled = JSON.parse(draw.result.winner);
                                        return shuffled.map((item: string, index: number) => (
                                          <div key={index}>
                                            #{index + 1} {item}
                                          </div>
                                        ));
                                      } catch {
                                        return <p>{draw.result.winner}</p>;
                                      }
                                    })()}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm">
                                    {draw.type === 'numeric_range' && draw.result.winner.includes(',') 
                                      ? 'Números Sorteados:' 
                                      : 'Vencedor:'}
                                  </p>
                                  <p className="text-lg font-bold break-words">{draw.result.winner}</p>
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
