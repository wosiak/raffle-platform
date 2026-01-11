import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function RaffleConfig({ type, config, onChange }) {
  const updateConfig = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold mb-4">Configurações do Sorteio</h3>
      
      <div className="space-y-4">
        {/* Número de vencedores (para todos os tipos) */}
        {type !== 'shuffle' && (
          <div className="space-y-2">
            <Label htmlFor="num_winners">Número de Vencedores</Label>
            <Input
              id="num_winners"
              type="number"
              min="1"
              value={config.num_winners || 1}
              onChange={(e) => updateConfig('num_winners', Number(e.target.value))}
              className="bg-white/50"
            />
          </div>
        )}

        {/* Intervalo numérico */}
        {type === 'numeric' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_range">Número Inicial</Label>
                <Input
                  id="min_range"
                  type="number"
                  value={config.min_range || 1}
                  onChange={(e) => updateConfig('min_range', Number(e.target.value))}
                  className="bg-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_range">Número Final</Label>
                <Input
                  id="max_range"
                  type="number"
                  value={config.max_range || 100}
                  onChange={(e) => updateConfig('max_range', Number(e.target.value))}
                  className="bg-white/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="step">Passo (Intervalo)</Label>
              <Input
                id="step"
                type="number"
                min="1"
                value={config.step || 1}
                onChange={(e) => updateConfig('step', Number(e.target.value))}
                className="bg-white/50"
              />
            </div>
          </>
        )}

        {/* Times balanceados */}
        {type === 'teams' && (
          <div className="space-y-2">
            <Label htmlFor="num_teams">Número de Times</Label>
            <Input
              id="num_teams"
              type="number"
              min="2"
              value={config.num_teams || 2}
              onChange={(e) => updateConfig('num_teams', Number(e.target.value))}
              className="bg-white/50"
            />
          </div>
        )}

        {/* Eliminatória */}
        {type === 'elimination' && (
          <div className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="allow_repeats">Permitir Repetições</Label>
              <p className="text-sm text-gray-600">
                Manter vencedores no pool para próximas rodadas
              </p>
            </div>
            <Switch
              id="allow_repeats"
              checked={config.allow_repeats || false}
              onCheckedChange={(checked) => updateConfig('allow_repeats', checked)}
            />
          </div>
        )}

        {/* Créditos (modo Winners Club) */}
        {config.mode === 'club_credits' && (
          <div className="space-y-2">
            <Label htmlFor="credits_per_winner">Créditos por Vencedor</Label>
            <Input
              id="credits_per_winner"
              type="number"
              min="1"
              value={config.credits_per_winner || 100}
              onChange={(e) => updateConfig('credits_per_winner', Number(e.target.value))}
              className="bg-white/50"
            />
          </div>
        )}
      </div>
    </GlassCard>
  );
}