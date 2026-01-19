import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Sparkles, Users, Hash, Trophy, Shuffle as ShuffleIcon, Target } from 'lucide-react';
import { toast } from 'sonner';

const drawTypes = [
  { value: 'list', label: 'Lista de Nomes', icon: Users, description: 'Sorteio a partir de uma lista' },
  { value: 'all_participants', label: 'Participantes', icon: Users, description: 'Todos os participantes cadastrados' },
  { value: 'numeric_range', label: 'Faixa Numérica', icon: Hash, description: 'Sorteio de números' },
  { value: 'weighted', label: 'Ponderado', icon: Trophy, description: 'Com pesos diferentes' },
  { value: 'shuffle', label: 'Embaralhar', icon: ShuffleIcon, description: 'Embaralhar ordem' },
  { value: 'elimination', label: 'Eliminação', icon: Target, description: 'Eliminatória' },
];

export default function CompanyNewDraw() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const { user, getCurrentCompanyId } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'list',
    config: {},
    items: [] as any[],
  });

  const [itemInput, setItemInput] = useState('');
  const [participantsCount, setParticipantsCount] = useState(0);

  // Carregar total de participantes quando tipo for 'all_participants'
  React.useEffect(() => {
    const loadParticipantsCount = async () => {
      if (formData.type === 'all_participants' && supabase) {
        const { count } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true });
        setParticipantsCount(count || 0);
        
        // Inicializar winnersCount com 1 se não estiver definido
        if (!formData.config.winnersCount) {
          setFormData(prev => ({
            ...prev,
            config: { ...prev.config, winnersCount: 1 }
          }));
        }
      }
    };
    loadParticipantsCount();
  }, [formData.type]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!supabase) throw new Error('Supabase não configurado');
      const companyId = getCurrentCompanyId();
      
      let itemsToSave = data.items;
      
      // Se for tipo all_participants, buscar participantes do banco
      if (data.type === 'all_participants') {
        const { data: participants, error } = await supabase
          .from('participants')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        
        if (!participants || participants.length === 0) {
          throw new Error('Nenhum participante cadastrado no sistema');
        }
        
        // Converter participantes para formato de items
        itemsToSave = participants.map(p => ({
          id: p.id,
          value: p.name,
          weight: 1,
        }));
      }
      
      const { data: created, error } = await supabase
        .from('draws')
        .insert({
          ...data,
          items: itemsToSave,
          company_id: companyId,
          created_by_user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return created;
    },
    onSuccess: (created) => {
      toast.success('Sorteio criado! Pronto para executar.');
      // Redirecionar para página de execução
      navigate(`/${companySlug}/draws/${created.id}/execute`, { 
        state: { draw: created } 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar sorteio');
    },
  });

  const handleAddItem = () => {
    if (!itemInput.trim()) return;
    
    const newItem = {
      id: crypto.randomUUID(),
      value: itemInput.trim(),
      weight: formData.type === 'weighted' ? (formData.config.currentWeight || 1) : 1,
    };
    
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
    setItemInput('');
  };

  const handleRemoveItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Digite um título');
      return;
    }
    
    // Validações por tipo
    if (formData.type === 'list' && formData.items.length === 0) {
      toast.error('Adicione pelo menos um participante');
      return;
    }
    
    if (formData.type === 'all_participants') {
      if (participantsCount === 0) {
        toast.error('Não há participantes cadastrados no sistema');
        return;
      }
      if (!formData.config.winnersCount || formData.config.winnersCount < 1) {
        toast.error('Defina o número de vencedores (mínimo 1)');
        return;
      }
      if (formData.config.winnersCount > participantsCount) {
        toast.error(`Número de vencedores não pode ser maior que ${participantsCount}`);
        return;
      }
    }
    
    if (formData.type === 'numeric_range') {
      if (!formData.config.min || !formData.config.max) {
        toast.error('Defina o número inicial e final');
        return;
      }
      if (formData.config.min >= formData.config.max) {
        toast.error('O número inicial deve ser menor que o final');
        return;
      }
    }
    
    if (formData.type === 'weighted' && formData.items.length === 0) {
      toast.error('Adicione pelo menos um participante');
      return;
    }
    
    if (formData.type === 'shuffle' && formData.items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }
    
    if (formData.type === 'elimination' && formData.items.length < 2) {
      toast.error('Adicione pelo menos 2 participantes');
      return;
    }
    
    createMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={`/${companySlug}/draws`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
            Novo Sorteio
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <GlassCard className="p-8 space-y-6">
            {/* Título */}
            <div>
              <Label>Título do Sorteio</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Sorteio de Natal 2024"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o sorteio..."
                rows={3}
              />
            </div>

            {/* Tipo */}
            <div>
              <Label>Tipo de Sorteio</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  // Limpar items ao trocar tipo de sorteio
                  setFormData({ 
                    ...formData, 
                    type: value,
                    items: [], // Limpa participantes ao trocar tipo
                    config: {} // Limpa configurações ao trocar tipo
                  });
                  setItemInput(''); // Limpa input
                }}
              >
                <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-gray-900 hover:bg-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-violet-500/30 backdrop-blur-xl">
                  {drawTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem 
                        key={type.value} 
                        value={type.value}
                        className="text-gray-200 hover:bg-violet-600/20 hover:text-white focus:bg-violet-600/30 focus:text-white cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Items (se tipo = list) */}
            {formData.type === 'list' && (
              <div>
                <Label>Participantes</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    placeholder="Nome do participante"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddItem}>
                    Adicionar
                  </Button>
                </div>
                
                {formData.items.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto bg-white">
                    {formData.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-gray-100 rounded text-gray-900"
                      >
                        <span className="font-medium">{item.value}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-2">
                  {formData.items.length} participante{formData.items.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Configuração para tipo Participantes */}
            {formData.type === 'all_participants' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-violet-900/20 to-cyan-900/20 backdrop-blur-sm rounded-lg p-4 border border-violet-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-300">Participantes Disponíveis</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      {participantsCount}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Todos os participantes cadastrados no sistema participarão automaticamente
                  </p>
                </div>

                <div>
                  <Label>Número de Vencedores</Label>
                  <Input
                    type="number"
                    value={formData.config.winnersCount !== undefined ? formData.config.winnersCount : 1}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setFormData({
                        ...formData,
                        config: { ...formData.config, winnersCount: value >= 1 ? value : 1 }
                      });
                    }}
                    placeholder="Ex: 1"
                    min="1"
                    max={participantsCount}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Quantos participantes serão sorteados como vencedores
                  </p>
                </div>
              </div>
            )}

            {/* Configuração para tipo numérico */}
            {formData.type === 'numeric_range' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número Inicial</Label>
                    <Input
                      type="number"
                      value={formData.config.min || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, min: parseInt(e.target.value) || 1 }
                      })}
                      placeholder="Ex: 1"
                    />
                  </div>
                  <div>
                    <Label>Número Final</Label>
                    <Input
                      type="number"
                      value={formData.config.max || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, max: parseInt(e.target.value) || 100 }
                      })}
                      placeholder="Ex: 100"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Números a Excluir (opcional)</Label>
                  <Input
                    value={formData.config.exclude || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, exclude: e.target.value }
                    })}
                    placeholder="Ex: 13, 25, 42"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Separe os números por vírgula
                  </p>
                </div>
                
                <div>
                  <Label>Quantidade de Vencedores</Label>
                  <Input
                    type="number"
                    value={formData.config.winners || 1}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, winners: parseInt(e.target.value) || 1 }
                    })}
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>
            )}

            {/* Configuração para tipo ponderado */}
            {formData.type === 'weighted' && (
              <div>
                <Label>Participantes (com Peso)</Label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Input
                    className="col-span-2"
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    placeholder="Nome do participante"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                  />
                  <Input
                    type="number"
                    value={formData.config.currentWeight || 1}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, currentWeight: parseInt(e.target.value) || 1 }
                    })}
                    placeholder="Peso"
                    min="1"
                  />
                </div>
                <Button type="button" onClick={handleAddItem} className="w-full mb-3">
                  Adicionar Participante
                </Button>
                
                {formData.items.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto bg-white">
                    {formData.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-gray-100 rounded text-gray-900"
                      >
                        <div>
                          <span className="font-medium">{item.value}</span>
                          <span className="text-sm text-gray-500 ml-2">(Peso: {item.weight})</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-2">
                  Quanto maior o peso, maior a chance de ser sorteado
                </p>
              </div>
            )}

            {/* Configuração para embaralhar */}
            {formData.type === 'shuffle' && (
              <div>
                <Label>Items para Embaralhar</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    placeholder="Nome do item"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddItem}>
                    Adicionar
                  </Button>
                </div>
                
                {formData.items.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto bg-white">
                    {formData.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-gray-100 rounded text-gray-900"
                      >
                        <div>
                          <span className="text-gray-500 mr-2">#{index + 1}</span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Configuração para eliminação */}
            {formData.type === 'elimination' && (
              <div>
                <Label>Participantes</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    placeholder="Nome do participante"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddItem}>
                    Adicionar
                  </Button>
                </div>
                
                {formData.items.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto bg-white">
                    {formData.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-gray-100 rounded text-gray-900"
                      >
                        <span className="font-medium">{item.value}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-2">
                  Sistema eliminará participantes um a um até sobrar o vencedor
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Link to={`/${companySlug}/draws`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <GradientButton
                type="submit"
                loading={createMutation.isPending}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Criar Sorteio
              </GradientButton>
            </div>
          </GlassCard>
        </form>
      </div>
    </div>
  );
}
