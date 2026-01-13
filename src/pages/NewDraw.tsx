import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import DrawTypeSelector from "@/components/draw/DrawTypeSelector";
import DrawConfigForm from "@/components/draw/DrawConfigForm";
import ItemsInput from "@/components/draw/ItemsInput";
import DrawPreview from "@/components/draw/DrawPreview";
import DrawResult from "@/components/draw/DrawResult";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  FileText
} from "lucide-react";

// Crypto-secure random using Web Crypto API
const secureRandom = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xFFFFFFFF + 1);
};

const generateSecureSeed = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

const hashData = async (data) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Secure shuffle using Fisher-Yates with crypto random
const secureShuffle = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Weighted random selection with crypto-secure random
const weightedSelect = (items, count, allowDuplicates) => {
  const results = [];
  let pool = [...items];
  
  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = secureRandom() * totalWeight;
    
    for (let j = 0; j < pool.length; j++) {
      random -= pool[j].weight || 1;
      if (random <= 0) {
        results.push({ position: i + 1, value: pool[j].value, item_index: j });
        if (!allowDuplicates) {
          pool = pool.filter((_, idx) => idx !== j);
        }
        break;
      }
    }
  }
  
  return results;
};

export default function NewDraw() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [organization, setOrganization] = useState(null);
  const [step, setStep] = useState(1);
  const [drawType, setDrawType] = useState(null);
  const [draw, setDraw] = useState({
    title: '',
    description: '',
    type: null,
    mode: 'standalone',
    config: {
      winners_count: 1,
      range_start: 1,
      range_end: 100,
      range_step: 1,
      range_exclusions: [],
      teams_count: 2,
      balance_teams: true,
      remove_winner_after: true,
      allow_duplicates: false,
      use_weights: false
    },
    items: [],
    status: 'draft'
  });
  const [isLocked, setIsLocked] = useState(false);
  const [enableVerification, setEnableVerification] = useState(false);
  const [verification, setVerification] = useState(null);
  const [results, setResults] = useState(null);

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

  const updateDraw = (updates) => {
    setDraw(prev => ({ ...prev, ...updates }));
  };

  const updateConfig = (config) => {
    setDraw(prev => ({ ...prev, config: { ...prev.config, ...config } }));
  };

  // Generate pool of items based on type
  const getPool = useMemo(() => {
    if (draw.type === 'numeric_range') {
      const { range_start = 1, range_end = 100, range_step = 1, range_exclusions = [] } = draw.config;
      const pool = [];
      for (let i = range_start; i <= range_end; i += range_step) {
        if (!range_exclusions.includes(i)) {
          pool.push({ value: String(i), weight: 1 });
        }
      }
      return pool;
    }
    return draw.items;
  }, [draw.type, draw.items, draw.config]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors = [];
    
    if (!draw.title?.trim()) {
      errors.push('Título é obrigatório');
    }
    
    if (!draw.type) {
      errors.push('Selecione um tipo de sorteio');
    }

    const pool = getPool;
    
    if (draw.type !== 'numeric_range' && pool.length === 0) {
      errors.push('Adicione pelo menos um item à lista');
    }

    if (draw.type === 'numeric_range') {
      const { range_start, range_end } = draw.config;
      if (range_start >= range_end) {
        errors.push('Intervalo inválido: início deve ser menor que fim');
      }
    }

    if (draw.type !== 'teams' && draw.type !== 'shuffle') {
      const winnersCount = draw.config.winners_count || 1;
      if (winnersCount > pool.length && pool.length > 0) {
        errors.push(`Quantidade de vencedores (${winnersCount}) maior que o pool (${pool.length})`);
      }
    }

    if (draw.type === 'teams') {
      const teamsCount = draw.config.teams_count || 2;
      if (teamsCount > pool.length && pool.length > 0) {
        errors.push(`Quantidade de times (${teamsCount}) maior que participantes (${pool.length})`);
      }
    }

    return errors;
  }, [draw, getPool]);

  // Create mutation
  const createDrawMutation = useMutation({
    mutationFn: async (drawData) => {
      return await base44.entities.Draw.create(drawData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draws'] });
    }
  });

  // Lock the draw
  const handleLock = async () => {
    if (enableVerification) {
      const seed = generateSecureSeed();
      const timestamp = new Date().toISOString();
      const itemsHash = await hashData(getPool);
      const configHash = await hashData(draw.config);
      const commitHash = await hashData({ itemsHash, configHash, timestamp });
      
      setVerification({
        enabled: true,
        seed,
        timestamp,
        items_hash: itemsHash,
        config_hash: configHash,
        commit_hash: commitHash
      });
    }
    
    setIsLocked(true);
    setStep(4);
  };

  // Execute the draw
  const executeDraw = async () => {
    const pool = getPool;
    let drawResults = [];

    switch (draw.type) {
      case 'list':
      case 'numeric_range':
      case 'weighted':
        drawResults = weightedSelect(
          pool, 
          draw.config.winners_count || 1,
          draw.config.allow_duplicates
        );
        break;

      case 'shuffle':
        const shuffled = secureShuffle(pool);
        drawResults = shuffled.map((item, i) => ({
          position: i + 1,
          value: item.value,
          item_index: i
        }));
        break;

      case 'teams':
        const shuffledForTeams = secureShuffle(pool);
        const teamsCount = draw.config.teams_count || 2;
        drawResults = shuffledForTeams.map((item, i) => ({
          position: i + 1,
          value: item.value,
          team: (i % teamsCount) + 1
        }));
        break;

      case 'elimination':
        drawResults = weightedSelect(pool, 1, false);
        break;
    }

    // Save to database
    if (!organization?.id) {
      throw new Error('Organização não carregada. Por favor, recarregue a página.');
    }

    const drawData = {
      ...draw,
      organization_id: organization.id,
      items: pool,
      results: drawResults,
      status: 'executed',
      executed_at: new Date().toISOString(),
      locked_at: new Date().toISOString(),
      participants_count: pool.length,
      verification: verification || { enabled: false }
    };

    await createDrawMutation.mutateAsync(drawData);

    // Log to audit
    await base44.entities.AuditLog.create({
      organization_id: organization.id,
      action: 'draw_executed',
      entity_type: 'Draw',
      details: {
        title: draw.title,
        type: draw.type,
        participants_count: pool.length,
        winners_count: drawResults.length,
        verification_enabled: enableVerification
      }
    });

    setResults(drawResults);
    setStep(5);
  };

  // Export results
  const handleExport = (format) => {
    if (!results) return;

    let content, filename, type;

    if (format === 'csv') {
      const headers = draw.type === 'teams' 
        ? 'Posição,Valor,Time\n'
        : 'Posição,Valor\n';
      const rows = results.map(r => 
        draw.type === 'teams'
          ? `${r.position},${r.value},${r.team}`
          : `${r.position},${r.value}`
      ).join('\n');
      content = headers + rows;
      filename = `sorteio-${draw.title.replace(/\s+/g, '-')}.csv`;
      type = 'text/csv';
    } else {
      content = JSON.stringify({
        draw: {
          title: draw.title,
          type: draw.type,
          executed_at: new Date().toISOString(),
          verification
        },
        results
      }, null, 2);
      filename = `sorteio-${draw.title.replace(/\s+/g, '-')}.json`;
      type = 'application/json';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRerun = () => {
    setIsLocked(false);
    setResults(null);
    setVerification(null);
    setStep(3);
  };

  const steps = [
    { num: 1, label: 'Tipo' },
    { num: 2, label: 'Configurar' },
    { num: 3, label: 'Itens' },
    { num: 4, label: 'Prévia' },
    { num: 5, label: 'Resultado' },
  ];

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(createPageUrl('Home'))}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-violet-500" />
              Novo Sorteio
            </h1>
            <p className="text-sm text-gray-500">
              Crie um sorteio transparente e verificável
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300
                    ${step >= s.num 
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}
                  `}>
                    {s.num}
                  </div>
                  <span className={`text-xs mt-2 ${step >= s.num ? 'text-violet-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-2 rounded
                    ${step > s.num ? 'bg-violet-500' : 'bg-gray-200 dark:bg-gray-700'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Type Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard className="p-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título do Sorteio *</Label>
                    <Input
                      id="title"
                      value={draw.title}
                      onChange={(e) => updateDraw({ title: e.target.value })}
                      placeholder="Ex: Sorteio de Natal 2024"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={draw.description}
                      onChange={(e) => updateDraw({ description: e.target.value })}
                      placeholder="Descreva os detalhes do sorteio..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </GlassCard>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-500" />
                Escolha o tipo de sorteio
              </h2>
              
              <DrawTypeSelector 
                selectedType={drawType}
                onSelect={(type) => {
                  setDrawType(type);
                  updateDraw({ type, config: { ...draw.config, use_weights: type === 'weighted' } });
                }}
              />

              <div className="flex justify-end mt-6">
                <GradientButton 
                  onClick={() => setStep(2)}
                  disabled={!drawType || !draw.title?.trim()}
                  icon={ArrowRight}
                >
                  Próximo
                </GradientButton>
              </div>
            </motion.div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DrawConfigForm 
                type={draw.type}
                config={draw.config}
                onChange={updateConfig}
              />

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <GradientButton onClick={() => setStep(3)} icon={ArrowRight}>
                  Próximo
                </GradientButton>
              </div>
            </motion.div>
          )}

          {/* Step 3: Items Input */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {draw.type === 'numeric_range' ? (
                <GlassCard className="p-6">
                  <div className="text-center py-8">
                    <div className="text-6xl font-bold text-violet-600 mb-4">
                      {draw.config.range_start} - {draw.config.range_end}
                    </div>
                    <p className="text-gray-500">
                      {getPool.length} números disponíveis
                      {draw.config.range_step > 1 && ` (passo: ${draw.config.range_step})`}
                      {(draw.config.range_exclusions?.length || 0) > 0 && 
                        ` (${draw.config.range_exclusions.length} excluídos)`}
                    </p>
                  </div>
                </GlassCard>
              ) : (
                <ItemsInput
                  items={draw.items}
                  onChange={(items) => updateDraw({ items })}
                  useWeights={draw.config.use_weights}
                />
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <GradientButton 
                  onClick={() => setStep(4)} 
                  icon={ArrowRight}
                  disabled={draw.type !== 'numeric_range' && draw.items.length === 0}
                >
                  Revisar
                </GradientButton>
              </div>
            </motion.div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && !results && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DrawPreview
                draw={draw}
                items={getPool}
                config={draw.config}
                onLock={handleLock}
                onExecute={executeDraw}
                isLocked={isLocked}
                enableVerification={enableVerification}
                onVerificationChange={setEnableVerification}
                validationErrors={validationErrors}
              />

              {!isLocked && (
                <div className="flex justify-start mt-6">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 5: Results */}
          {step === 5 && results && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <DrawResult
                results={results}
                type={draw.type}
                verification={verification}
                onRerun={handleRerun}
                onExport={handleExport}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}