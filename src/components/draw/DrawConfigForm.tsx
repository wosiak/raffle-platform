import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import GlassCard from "@/components/ui/GlassCard";
import { 
  Trophy, 
  Hash, 
  Users,
  RotateCcw,
  Scale,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DrawConfigForm({ type, config, onChange }) {
  const updateConfig = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Hash className="w-5 h-5 text-violet-500" />
        Configurações do Sorteio
      </h3>

      <div className="space-y-6">
        {/* Winners count - available for most types */}
        {type !== 'shuffle' && type !== 'teams' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="winners_count" className="text-gray-700 dark:text-gray-300">
                Quantidade de vencedores
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quantos itens serão sorteados</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                id="winners_count"
                value={[config.winners_count || 1]}
                onValueChange={([value]) => updateConfig('winners_count', value)}
                min={1}
                max={100}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={config.winners_count || 1}
                onChange={(e) => updateConfig('winners_count', parseInt(e.target.value) || 1)}
                className="w-20"
                min={1}
              />
            </div>
          </div>
        )}

        {/* Numeric range specific */}
        {type === 'numeric_range' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="range_start">Início</Label>
                <Input
                  id="range_start"
                  type="number"
                  value={config.range_start ?? 1}
                  onChange={(e) => updateConfig('range_start', parseInt(e.target.value))}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="range_end">Fim</Label>
                <Input
                  id="range_end"
                  type="number"
                  value={config.range_end ?? 100}
                  onChange={(e) => updateConfig('range_end', parseInt(e.target.value))}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="range_step">Passo (intervalo)</Label>
              <Input
                id="range_step"
                type="number"
                value={config.range_step ?? 1}
                onChange={(e) => updateConfig('range_step', parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="range_exclusions">Exclusões (separar por vírgula)</Label>
              <Input
                id="range_exclusions"
                value={(config.range_exclusions || []).join(', ')}
                onChange={(e) => updateConfig('range_exclusions', 
                  e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
                )}
                placeholder="Ex: 13, 17, 42"
              />
            </div>
          </>
        )}

        {/* Teams specific */}
        {type === 'teams' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teams_count">Número de times</Label>
                <Input
                  id="teams_count"
                  type="number"
                  value={config.teams_count ?? 2}
                  onChange={(e) => updateConfig('teams_count', parseInt(e.target.value) || 2)}
                  min={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_size">Tamanho por time (opcional)</Label>
                <Input
                  id="team_size"
                  type="number"
                  value={config.team_size ?? ''}
                  onChange={(e) => updateConfig('team_size', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Auto"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Balancear times</p>
                  <p className="text-sm text-gray-500">Distribuir igualmente os participantes</p>
                </div>
              </div>
              <Switch
                checked={config.balance_teams ?? true}
                onCheckedChange={(checked) => updateConfig('balance_teams', checked)}
              />
            </div>
          </>
        )}

        {/* Elimination specific */}
        {type === 'elimination' && (
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-rose-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Remover vencedor após rodada</p>
                <p className="text-sm text-gray-500">O vencedor não participa das próximas rodadas</p>
              </div>
            </div>
            <Switch
              checked={config.remove_winner_after ?? true}
              onCheckedChange={(checked) => updateConfig('remove_winner_after', checked)}
            />
          </div>
        )}

        {/* Weighted specific */}
        {type === 'weighted' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Sorteio com pesos</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Defina os pesos ao adicionar os itens. Itens com peso maior têm mais chances de ser sorteados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Common options */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-violet-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Permitir duplicatas</p>
                <p className="text-sm text-gray-500">Mesmo item pode ganhar mais de uma vez</p>
              </div>
            </div>
            <Switch
              checked={config.allow_duplicates ?? false}
              onCheckedChange={(checked) => updateConfig('allow_duplicates', checked)}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}