import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import GlassBackground from '@/components/layout/GlassBackground';
import GlassCard from '@/components/ui/GlassCard';

const createPageUrl = (pageName) => `/${pageName}`;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import RaffleTypeSelector from '@/components/raffle/RaffleTypeSelector';
import RaffleConfig from '@/components/raffle/RaffleConfig';
import ParticipantInput from '@/components/raffle/ParticipantInput';
import RaffleResult from '@/components/raffle/RaffleResult';
import { 
  validateRaffleConfig, 
  executeRaffle, 
  generateSecureSeed,
  createCommitHash 
} from '@/components/raffle/RaffleEngine';
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Sparkles,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const STEPS = ['type', 'config', 'items', 'preview', 'result'];

export default function CreateRaffle() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [organization, setOrganization] = useState(null);
  
  const [raffleData, setRaffleData] = useState({
    title: '',
    description: '',
    type: null,
    config: {
      num_winners: 1,
      min_range: 1,
      max_range: 100,
      step: 1,
      num_teams: 2,
      allow_repeats: false
    },
    items: [],
    verification: {
      enabled: false
    }
  });

  const [executedRaffle, setExecutedRaffle] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    async function loadOrganization() {
      const orgs = await base44.entities.Organization.list();
      if (orgs.length > 0) {
        setOrganization(orgs[0]);
      }
    }
    loadOrganization();
  }, []);

  const updateRaffleData = (updates) => {
    setRaffleData(prev => ({ ...prev, ...updates }));
  };

  const validateStep = () => {
    if (currentStep === 0 && !raffleData.type) {
      toast.error('Selecione um tipo de sorteio');
      return false;
    }
    
    if (currentStep === 1 && !raffleData.title.trim()) {
      toast.error('Digite um título para o sorteio');
      return false;
    }

    if (currentStep === 2) {
      if (raffleData.type !== 'numeric' && raffleData.items.length === 0) {
        toast.error('Adicione participantes ao sorteio');
        return false;
      }
      
      const validation = validateRaffleConfig(
        raffleData.type,
        raffleData.config,
        raffleData.items
      );
      
      setValidationResult(validation);
      
      if (!validation.isValid) {
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const lockRaffle = async () => {
    try {
      const raffle = await base44.entities.Raffle.create({
        organization_id: organization.id,
        title: raffleData.title,
        description: raffleData.description,
        type: raffleData.type,
        config: raffleData.config,
        items: raffleData.items,
        status: 'locked',
        locked_at: new Date().toISOString()
      });

      // Se verificação habilitada, criar commit hash
      if (raffleData.verification.enabled) {
        const seed = generateSecureSeed();
        const { commit_hash } = await createCommitHash(raffle, seed);
        
        await base44.entities.Raffle.update(raffle.id, {
          verification: {
            enabled: true,
            commit_hash: commit_hash,
            reveal_seed: seed,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Criar audit log
      await base44.entities.AuditLog.create({
        organization_id: organization.id,
        entity_type: 'Raffle',
        entity_id: raffle.id,
        action: 'locked',
        actor_email: (await base44.auth.me()).email,
        actor_name: (await base44.auth.me()).full_name
      });

      toast.success('Sorteio travado com sucesso');
      return raffle;
    } catch (error) {
      toast.error('Erro ao travar sorteio');
      throw error;
    }
  };

  const runRaffle = async () => {
    try {
      const lockedRaffle = await lockRaffle();
      
      // Executar sorteio
      const results = executeRaffle(
        raffleData.type,
        raffleData.config,
        raffleData.items
      );

      // Atualizar raffle com resultados
      const completedRaffle = await base44.entities.Raffle.update(lockedRaffle.id, {
        status: 'completed',
        executed_at: new Date().toISOString(),
        results: results
      });

      // Se modo Winners Club, distribuir créditos
      if (raffleData.config.mode === 'club_credits') {
        const creditsPerWinner = raffleData.config.credits_per_winner || 100;
        
        for (const winner of results) {
          // Encontrar membro
          const members = await base44.entities.Member.filter({
            organization_id: organization.id,
            name: winner.value
          });

          if (members.length > 0) {
            const member = members[0];
            const newBalance = (member.credit_balance || 0) + creditsPerWinner;
            
            await base44.entities.Member.update(member.id, {
              credit_balance: newBalance,
              total_credits_won: (member.total_credits_won || 0) + creditsPerWinner
            });

            await base44.entities.Transaction.create({
              organization_id: organization.id,
              member_id: member.id,
              type: 'credit_won',
              amount: creditsPerWinner,
              balance_before: member.credit_balance || 0,
              balance_after: newBalance,
              reference_type: 'raffle',
              reference_id: completedRaffle.id,
              description: `Créditos ganhos no sorteio: ${raffleData.title}`
            });
          }
        }
      }

      // Audit log
      await base44.entities.AuditLog.create({
        organization_id: organization.id,
        entity_type: 'Raffle',
        entity_id: completedRaffle.id,
        action: 'executed',
        actor_email: (await base44.auth.me()).email,
        actor_name: (await base44.auth.me()).full_name,
        metadata: { results_count: results.length }
      });

      setExecutedRaffle(completedRaffle);
      toast.success('Sorteio realizado com sucesso! 🎉');
      nextStep();
    } catch (error) {
      toast.error('Erro ao realizar sorteio');
      console.error(error);
    }
  };

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassBackground />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <GlassBackground gradient="blue" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Criar Novo Sorteio
          </h1>
          <p className="text-gray-600">
            Siga os passos para configurar e executar seu sorteio
          </p>
        </div>

        {/* Progress */}
        {currentStep < 4 && (
          <GlassCard className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              {['Tipo', 'Configuração', 'Participantes', 'Prévia'].map((label, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    index <= currentStep 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div className={`w-12 md:w-24 h-1 mx-2 ${
                      index < currentStep ? 'bg-purple-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 0: Tipo */}
            {currentStep === 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Escolha o Tipo de Sorteio</h2>
                <RaffleTypeSelector
                  selectedType={raffleData.type}
                  onSelect={(type) => updateRaffleData({ type })}
                />
              </div>
            )}

            {/* Step 1: Configuração */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Informações Básicas</h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título do Sorteio</Label>
                      <Input
                        id="title"
                        placeholder="Ex: Sorteio Mensal de Créditos"
                        value={raffleData.title}
                        onChange={(e) => updateRaffleData({ title: e.target.value })}
                        className="bg-white/50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        placeholder="Descreva as regras e detalhes do sorteio..."
                        value={raffleData.description}
                        onChange={(e) => updateRaffleData({ description: e.target.value })}
                        className="bg-white/50 min-h-[100px]"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="verifiable">Sorteio Verificável</Label>
                        <p className="text-sm text-gray-600">
                          Gerar prova criptográfica do sorteio
                        </p>
                      </div>
                      <Switch
                        id="verifiable"
                        checked={raffleData.verification.enabled}
                        onCheckedChange={(checked) => 
                          updateRaffleData({ 
                            verification: { ...raffleData.verification, enabled: checked }
                          })
                        }
                      />
                    </div>
                  </div>
                </GlassCard>

                <RaffleConfig
                  type={raffleData.type}
                  config={raffleData.config}
                  onChange={(config) => updateRaffleData({ config })}
                />
              </div>
            )}

            {/* Step 2: Participantes */}
            {currentStep === 2 && raffleData.type !== 'numeric' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Adicionar Participantes</h2>
                <ParticipantInput
                  type={raffleData.type}
                  items={raffleData.items}
                  onChange={(items) => updateRaffleData({ items })}
                />
              </div>
            )}

            {/* Step 3: Prévia */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Prévia do Sorteio</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Título</h3>
                      <p className="text-gray-700">{raffleData.title}</p>
                    </div>

                    {raffleData.description && (
                      <div>
                        <h3 className="font-semibold mb-2">Descrição</h3>
                        <p className="text-gray-700">{raffleData.description}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold mb-2">Tipo</h3>
                      <p className="text-gray-700 capitalize">
                        {raffleData.type}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Configurações</h3>
                      <ul className="list-disc list-inside text-gray-700">
                        {raffleData.config.num_winners && (
                          <li>Número de vencedores: {raffleData.config.num_winners}</li>
                        )}
                        {raffleData.config.num_teams && (
                          <li>Número de times: {raffleData.config.num_teams}</li>
                        )}
                      </ul>
                    </div>

                    {raffleData.items.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Participantes</h3>
                        <p className="text-gray-700">
                          Total: {raffleData.items.length}
                        </p>
                      </div>
                    )}

                    {raffleData.verification.enabled && (
                      <Alert>
                        <Lock className="w-4 h-4" />
                        <AlertDescription>
                          Este sorteio terá prova criptográfica verificável
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </GlassCard>

                {validationResult && (
                  <>
                    {validationResult.warnings.length > 0 && (
                      <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside">
                            {validationResult.warnings.map((warning, i) => (
                              <li key={i}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                <Button
                  onClick={runRaffle}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg py-6"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Realizar Sorteio
                </Button>
              </div>
            )}

            {/* Step 4: Resultado */}
            {currentStep === 4 && executedRaffle && (
              <RaffleResult
                raffle={executedRaffle}
                onClose={() => navigate(createPageUrl('Dashboard'))}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep < 3 && (
          <div className="flex gap-4 mt-8">
            {currentStep > 0 && (
              <Button
                onClick={prevStep}
                variant="outline"
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
            <Button
              onClick={nextStep}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
            >
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}