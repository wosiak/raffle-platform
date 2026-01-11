import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';
import {
  Trophy,
  Download,
  Copy,
  Share2,
  RotateCcw,
  Shield,
  CheckCircle,
  Users,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DrawResult({ 
  results = [], 
  type,
  verification,
  onRerun,
  onExport
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EC4899']
    });
  }, []);

  const copyResults = () => {
    const text = results.map((r, i) => 
      type === 'teams' 
        ? `Time ${r.team}: ${r.value}`
        : `${i + 1}º - ${r.value}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTeams = type === 'teams';
  const groupedByTeam = isTeams 
    ? results.reduce((acc, r) => {
        if (!acc[r.team]) acc[r.team] = [];
        acc[r.team].push(r);
        return acc;
      }, {})
    : null;

  return (
    <div className="relative">
      <GlassCard className="p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg shadow-amber-500/30">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Resultado do Sorteio!
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {isTeams 
              ? `${Object.keys(groupedByTeam || {}).length} times formados`
              : `${results.length} vencedor${results.length > 1 ? 'es' : ''} sorteado${results.length > 1 ? 's' : ''}`}
          </p>
        </motion.div>

        {/* Results display */}
        {isTeams ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Object.entries(groupedByTeam || {}).map(([teamNum, members], index) => (
              <motion.div
                key={teamNum}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-800"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-violet-600" />
                  <span className="font-semibold text-violet-800 dark:text-violet-200">
                    Time {teamNum}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {members.length} membros
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {members.map((member, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                      {member.value}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl",
                  index === 0
                    ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-700"
                    : "bg-gray-50 dark:bg-gray-800/50"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full font-bold",
                  index === 0
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                    : index === 1
                    ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                    : index === 2
                    ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}>
                  {index + 1}º
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-semibold",
                    index === 0 
                      ? "text-lg text-amber-800 dark:text-amber-200" 
                      : "text-gray-900 dark:text-white"
                  )}>
                    {result.value}
                  </p>
                </div>
                {index === 0 && (
                  <Sparkles className="w-6 h-6 text-amber-500" />
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Verification badge */}
        {verification?.enabled && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                  Sorteio Verificável
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2">
                  Este sorteio possui prova criptográfica de integridade
                </p>
                <div className="space-y-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 break-all">
                  <p><strong>Hash:</strong> {verification.commit_hash?.slice(0, 32)}...</p>
                  <p><strong>Timestamp:</strong> {verification.timestamp}</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="outline" onClick={copyResults}>
            {copied ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          <Button variant="outline" onClick={() => onExport?.('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => onExport?.('json')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar JSON
          </Button>
          {onRerun && (
            <GradientButton onClick={onRerun} icon={RotateCcw}>
              Sortear Novamente
            </GradientButton>
          )}
        </div>
      </GlassCard>
    </div>
  );
}