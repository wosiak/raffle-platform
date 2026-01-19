import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles, RotateCcw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DrawItem {
  id: string;
  value: string;
  weight: number;
}

export default function ExecuteDraw() {
  const { companySlug, drawId } = useParams<{ companySlug: string; drawId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const draw = location.state?.draw;
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [eliminationState, setEliminationState] = useState<{
    participants: string[];
    eliminated: string[];
    isEliminating: boolean;
    currentEliminated: string | null;
  }>({
    participants: [],
    eliminated: [],
    isEliminating: false,
    currentEliminated: null,
  });

  const executeMutation = useMutation({
    mutationFn: async (data: { winner: string }) => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const results = {
        winner: data.winner,
        all_participants: draw.items ? draw.items.map((item: DrawItem) => item.value) : [],
        executed_at: new Date().toISOString(),
      };
      
      const updateData: any = {
        result: results,
        winner: data.winner,
        executed_at: new Date().toISOString(),
      };
      
      // Adicionar executed_by_user_id se o usuário estiver definido
      if (user?.id) {
        updateData.executed_by_user_id = user.id;
      }
      
      const { error } = await supabase
        .from('draws')
        .update(updateData)
        .eq('id', drawId);
      
      if (error) {
        console.error('Erro ao salvar sorteio:', error);
        throw error;
      }
      
      return data.winner;
    },
    onSuccess: () => {
      setShowConfetti(true);
      toast.success('Sorteio realizado com sucesso!');
      setTimeout(() => setShowConfetti(false), 5000);
    },
    onError: (error: any) => {
      console.error('Erro na mutation:', error);
      toast.error(error.message || 'Erro ao executar sorteio');
    },
  });

  const handleExecute = async () => {
    // Se é tipo eliminação, fazer animação especial
    if (draw.type === 'elimination') {
      if (!draw.items || draw.items.length < 2) {
        toast.error('Necessário pelo menos 2 participantes');
        return;
      }
      startEliminationAnimation();
      return;
    }
    
    // Se é tipo all_participants, usar items que já foram salvos
    if (draw.type === 'all_participants') {
      if (!draw.items || draw.items.length === 0) {
        toast.error('Nenhum participante encontrado no sorteio');
        return;
      }
      
      setIsExecuting(true);
      
      const winnersCount = draw.config.winnersCount || 1;
      if (winnersCount > draw.items.length) {
        toast.error('Número de vencedores maior que participantes disponíveis');
        setIsExecuting(false);
        return;
      }
      
      // Executar sorteio usando items já salvos
      const result = executeAllParticipantsDraw(draw.items, winnersCount);
      animateDrawing(result);
      return;
    }
    
    // Outros tipos de sorteio (comportamento normal)
    setIsExecuting(true);
    
    // Gerar resultado baseado no tipo
    let result: any;
    
    switch (draw.type) {
      case 'list':
      case 'weighted':
        if (!draw.items || draw.items.length === 0) {
          toast.error('Nenhum participante encontrado');
          setIsExecuting(false);
          return;
        }
        result = executeListDraw(draw.items);
        break;
        
      case 'numeric_range':
        result = executeNumericDraw(draw.config);
        break;
        
      case 'teams':
        if (!draw.items || draw.items.length === 0) {
          toast.error('Nenhum participante encontrado');
          setIsExecuting(false);
          return;
        }
        result = executeTeamsDraw(draw.items, draw.config.teams || 2);
        break;
        
      case 'shuffle':
        if (!draw.items || draw.items.length === 0) {
          toast.error('Nenhum item encontrado');
          setIsExecuting(false);
          return;
        }
        result = executeShuffleDraw(draw.items);
        break;
        
      default:
        toast.error('Tipo de sorteio não suportado');
        setIsExecuting(false);
        return;
    }
    
    // Animação de sorteio
    animateDrawing(result);
  };

  // Animação especial para eliminação
  const startEliminationAnimation = async () => {
    const participants = draw.items.map((item: DrawItem) => item.value);
    setEliminationState({
      participants: [...participants],
      eliminated: [],
      isEliminating: true,
      currentEliminated: null,
    });
    
    const participantsCopy = [...participants];
    const eliminationOrder: string[] = [];
    
    // Eliminar um por um
    while (participantsCopy.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s entre eliminações
      
      const randomIndex = Math.floor(Math.random() * participantsCopy.length);
      const eliminated = participantsCopy[randomIndex];
      eliminationOrder.push(eliminated);
      participantsCopy.splice(randomIndex, 1);
      
      setEliminationState(prev => ({
        ...prev,
        participants: [...participantsCopy],
        eliminated: [...eliminationOrder],
        currentEliminated: eliminated,
      }));
    }
    
    // Vencedor final
    const finalWinner = participantsCopy[0];
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setEliminationState(prev => ({
      ...prev,
      isEliminating: false,
    }));
    
    // Salvar resultado
    const resultData = JSON.stringify({
      eliminated: eliminationOrder,
      winner: finalWinner,
    });
    
    setWinner(finalWinner);
    executeMutation.mutate({ winner: resultData });
  };

  const animateDrawing = (finalResult: any) => {
    let count = 0;
    const maxCount = 20;
    
    const interval = setInterval(() => {
      // Mostrar valores aleatórios durante animação
      if (draw.type === 'numeric_range') {
        const min = draw.config.min || 1;
        const max = draw.config.max || 100;
        setWinner(String(Math.floor(Math.random() * (max - min + 1)) + min));
      } else if (draw.items && draw.items.length > 0) {
        const randomItem = draw.items[Math.floor(Math.random() * draw.items.length)];
        setWinner(randomItem.value);
      }
      
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        setWinner(finalResult);
        setIsExecuting(false);
        executeMutation.mutate({ winner: finalResult });
      }
    }, 100);
  };

  // Sorteio de lista/ponderado
  const executeListDraw = (items: DrawItem[]): string => {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= (item.weight || 1);
      if (random <= 0) {
        return item.value;
      }
    }
    
    return items[0].value;
  };

  // Sorteio numérico
  const executeNumericDraw = (config: any): string => {
    const min = config.min || 1;
    const max = config.max || 100;
    const winners = config.winners || 1;
    const exclude = config.exclude 
      ? config.exclude.split(',').map((n: string) => parseInt(n.trim())).filter((n: number) => !isNaN(n))
      : [];
    
    // Gerar array de números disponíveis
    const available = [];
    for (let i = min; i <= max; i++) {
      if (!exclude.includes(i)) {
        available.push(i);
      }
    }
    
    if (available.length === 0) {
      return 'Nenhum número disponível';
    }
    
    // Sortear
    const results = [];
    for (let i = 0; i < winners && available.length > 0; i++) {
      const index = Math.floor(Math.random() * available.length);
      results.push(available[index]);
      available.splice(index, 1);
    }
    
    return winners === 1 ? String(results[0]) : results.join(', ');
  };

  // Sorteio de times
  const executeTeamsDraw = (items: DrawItem[], numTeams: number): string => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const teams: any = {};
    
    for (let i = 0; i < numTeams; i++) {
      teams[`Time ${i + 1}`] = [];
    }
    
    shuffled.forEach((item, index) => {
      const teamIndex = index % numTeams;
      teams[`Time ${teamIndex + 1}`].push(item.value);
    });
    
    return JSON.stringify(teams);
  };

  // Embaralhar
  const executeShuffleDraw = (items: DrawItem[]): string => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return JSON.stringify(shuffled.map(item => item.value));
  };

  // Eliminação
  const executeEliminationDraw = (items: DrawItem[]): string => {
    const participants = [...items];
    const eliminationOrder = [];
    
    while (participants.length > 1) {
      const index = Math.floor(Math.random() * participants.length);
      eliminationOrder.push(participants[index].value);
      participants.splice(index, 1);
    }
    
    // Retornar ordem de eliminação + vencedor
    const result = {
      eliminated: eliminationOrder,
      winner: participants[0].value
    };
    
    return JSON.stringify(result);
  };

  // Sorteio de todos os participantes (global)
  const executeAllParticipantsDraw = (items: any[], winnersCount: number): string => {
    const available = [...items];
    const winners = [];
    
    // Sortear N vencedores
    for (let i = 0; i < winnersCount && available.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      winners.push(available[randomIndex].value);
      available.splice(randomIndex, 1);
    }
    
    return winnersCount === 1 ? winners[0] : winners.join(', ');
  };

  const handleReset = () => {
    setWinner(null);
    setShowConfetti(false);
  };

  const handleFinish = () => {
    navigate(`/${companySlug}/draws`);
  };

  if (!draw) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Sorteio não encontrado</p>
          <Button onClick={() => navigate(`/${companySlug}/draws`)}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent mb-2">
            {draw.title}
          </h1>
          {draw.description && (
            <p className="text-gray-600">{draw.description}</p>
          )}
          <p className="text-gray-500 mt-2">
            {draw.items.length} participante{draw.items.length > 1 ? 's' : ''}
          </p>
        </div>

        <GlassCard className="p-12">
          <AnimatePresence mode="wait">
            {/* Estado de Eliminação */}
            {eliminationState.isEliminating ? (
              <motion.div
                key="elimination"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-center mb-6">
                  🎯 Eliminação em Andamento
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {draw.items.map((item: DrawItem) => {
                    const isEliminated = eliminationState.eliminated.includes(item.value);
                    const isActive = eliminationState.participants.includes(item.value);
                    const isCurrent = eliminationState.currentEliminated === item.value;
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{
                          opacity: isEliminated ? 0.3 : 1,
                          scale: isCurrent ? 0.9 : 1,
                        }}
                        className={`relative p-4 rounded-lg text-center font-bold transition-all ${
                          isEliminated 
                            ? 'bg-red-100 border-2 border-red-400' 
                            : isActive 
                            ? 'bg-gradient-to-br from-violet-100 to-cyan-100 border-2 border-violet-400 shadow-lg' 
                            : 'bg-gray-100'
                        }`}
                      >
                        <span
                          className={`relative ${
                            isEliminated ? 'text-red-600 line-through' : 'text-violet-900'
                          }`}
                        >
                          {item.value}
                        </span>
                        {isEliminated && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl">❌</span>
                          </div>
                        )}
                        {isActive && eliminationState.participants.length === 1 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -top-2 -right-2"
                          >
                            <span className="text-3xl">👑</span>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                
                <div className="text-center mt-6 p-4 bg-violet-50 rounded-lg">
                  <p className="text-violet-900 font-medium">
                    {eliminationState.participants.length > 1 
                      ? `${eliminationState.participants.length} participantes restantes...` 
                      : '🎉 Vencedor definido!'}
                  </p>
                </div>
              </motion.div>
            ) : !winner ? (
              <motion.div
                key="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <Sparkles className="w-24 h-24 text-violet-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-4">
                  Pronto para sortear?
                </h2>
                <p className="text-gray-600 mb-8">
                  Clique no botão abaixo para realizar o sorteio
                </p>
                <GradientButton
                  onClick={handleExecute}
                  disabled={isExecuting || eliminationState.isEliminating}
                  className="px-12 py-6 text-xl"
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  Sortear Agora
                </GradientButton>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                {isExecuting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                      className="mb-6"
                    >
                      <Sparkles className="w-24 h-24 text-violet-500 mx-auto" />
                    </motion.div>
                    <motion.div
                      key={winner}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl font-bold text-gray-400 mb-4"
                    >
                      {winner}
                    </motion.div>
                    <p className="text-gray-500">Sorteando...</p>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    >
                      <Trophy className="w-32 h-32 text-yellow-500 mx-auto mb-6" />
                    </motion.div>
                    
                    <h2 className="text-3xl font-bold mb-4 text-gray-900">
                      🎉 Parabéns! 🎉
                    </h2>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-2xl p-8 mb-8"
                    >
                      {draw.type === 'teams' ? (
                        <>
                          <p className="text-lg mb-4">Times Sorteados:</p>
                          <div className="space-y-3 text-left">
                            {winner && typeof winner === 'string' && (() => {
                              try {
                                const teams = JSON.parse(winner);
                                return Object.entries(teams).map(([teamName, members]: [string, any]) => (
                                  <div key={teamName} className="bg-white/10 rounded-lg p-4">
                                    <p className="font-bold text-xl mb-2">{teamName}</p>
                                    <p className="text-sm">{members.join(', ')}</p>
                                  </div>
                                ));
                              } catch {
                                return <p>{winner}</p>;
                              }
                            })()}
                          </div>
                        </>
                      ) : draw.type === 'shuffle' ? (
                        <>
                          <p className="text-lg mb-4">Ordem Embaralhada:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {winner && typeof winner === 'string' && (() => {
                              try {
                                const shuffled = JSON.parse(winner);
                                return shuffled.map((item: string, index: number) => (
                                  <div key={index} className="bg-white/10 rounded p-2">
                                    <span className="font-bold">#{index + 1}</span> {item}
                                  </div>
                                ));
                              } catch {
                                return <p>{winner}</p>;
                              }
                            })()}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-lg mb-2">
                            {draw.type === 'numeric_range' && draw.config.winners > 1 
                              ? 'Números Sorteados:' 
                              : 'O vencedor é:'}
                          </p>
                          <p className="text-5xl font-bold break-words">{winner}</p>
                        </>
                      )}
                    </motion.div>

                    <div className="flex gap-4 justify-center">
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        size="lg"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Sortear Novamente
                      </Button>
                      <GradientButton
                        onClick={handleFinish}
                        size="lg"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Finalizar
                      </GradientButton>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Lista de participantes ou configuração */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <GlassCard className="p-6">
            {draw.type === 'numeric_range' ? (
              <>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Configuração do Sorteio
                </h3>
                <div className="grid grid-cols-2 gap-4 text-gray-900">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Número Inicial</p>
                    <p className="text-2xl font-bold">{draw.config.min || 1}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Número Final</p>
                    <p className="text-2xl font-bold">{draw.config.max || 100}</p>
                  </div>
                  {draw.config.winners > 1 && (
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Vencedores</p>
                      <p className="text-2xl font-bold">{draw.config.winners}</p>
                    </div>
                  )}
                  {draw.config.exclude && (
                    <div className="bg-gray-100 p-4 rounded-lg col-span-2">
                      <p className="text-sm text-gray-600">Números Excluídos</p>
                      <p className="text-lg font-bold">{draw.config.exclude}</p>
                    </div>
                  )}
                </div>
              </>
            ) : draw.items && draw.items.length > 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Participantes ({draw.items.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                  {draw.items.map((item: DrawItem) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg text-center transition-all ${
                        winner === item.value && !isExecuting && draw.type !== 'teams' && draw.type !== 'shuffle'
                          ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white scale-105 shadow-lg'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {item.value}
                      {item.weight > 1 && (
                        <span className="text-xs block mt-1 opacity-70">
                          Peso: {item.weight}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
