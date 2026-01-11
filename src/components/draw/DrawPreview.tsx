import React from 'react';
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle,
  Lock,
  Play,
  Shield,
  Hash,
  Users,
  Trophy,
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DrawPreview({ 
  draw, 
  items, 
  config, 
  onLock, 
  onExecute,
  isLocked,
  enableVerification,
  onVerificationChange,
  validationErrors = []
}) {
  const typeLabels = {
    list: 'Lista de Itens',
    numeric_range: 'Intervalo Numérico',
    weighted: 'Sorteio com Pesos',
    teams: 'Times/Grupos',
    shuffle: 'Embaralhar',
    elimination: 'Eliminatória',
  };

  const getPoolSize = () => {
    if (draw.type === 'numeric_range') {
      const start = config.range_start ?? 1;
      const end = config.range_end ?? 100;
      const step = config.range_step ?? 1;
      const exclusions = config.range_exclusions?.length ?? 0;
      return Math.floor((end - start) / step) + 1 - exclusions;
    }
    return items.length;
  };

  const poolSize = getPoolSize();
  const winnersCount = config.winners_count || 1;
  const hasEnoughItems = draw.type === 'teams' || draw.type === 'shuffle' || poolSize >= winnersCount;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-violet-500" />
          Prévia do Sorteio
        </h3>
        {isLocked && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300">
            <Lock className="w-3 h-3 mr-1" />
            Travado
          </Badge>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Tipo</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {typeLabels[draw.type]}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Pool de itens</p>
          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
            <Hash className="w-4 h-4 text-violet-500" />
            {poolSize}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">
            {draw.type === 'teams' ? 'Times' : 'Vencedores'}
          </p>
          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
            {draw.type === 'teams' ? (
              <Users className="w-4 h-4 text-emerald-500" />
            ) : (
              <Trophy className="w-4 h-4 text-amber-500" />
            )}
            {draw.type === 'teams' ? config.teams_count || 2 : winnersCount}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <p className={cn(
            "font-semibold flex items-center gap-1",
            validationErrors.length > 0 
              ? "text-rose-600" 
              : "text-emerald-600"
          )}>
            {validationErrors.length > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                Pendente
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Pronto
              </>
            )}
          </p>
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
              <div>
                <p className="font-medium text-rose-700 dark:text-rose-300 mb-2">
                  Correções necessárias
                </p>
                <ul className="space-y-1">
                  {validationErrors.map((error, i) => (
                    <li key={i} className="text-sm text-rose-600 dark:text-rose-400">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Verifiable draw option */}
      <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-violet-600" />
            <div>
              <p className="font-medium text-violet-800 dark:text-violet-200">
                Sorteio Verificável
              </p>
              <p className="text-sm text-violet-600 dark:text-violet-400">
                Gera prova criptográfica (hash + commit-reveal)
              </p>
            </div>
          </div>
          <Switch
            checked={enableVerification}
            onCheckedChange={onVerificationChange}
            disabled={isLocked}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!isLocked ? (
          <GradientButton
            onClick={onLock}
            disabled={validationErrors.length > 0}
            icon={Lock}
            className="flex-1"
          >
            Travar Sorteio
          </GradientButton>
        ) : (
          <GradientButton
            onClick={onExecute}
            variant="success"
            icon={Play}
            className="flex-1"
          >
            Sortear Agora!
          </GradientButton>
        )}
      </div>

      {!isLocked && (
        <p className="text-xs text-gray-500 text-center mt-3">
          Após travar, os itens e configurações não podem ser alterados
        </p>
      )}
    </GlassCard>
  );
}