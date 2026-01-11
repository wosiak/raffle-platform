import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import { Trophy, Users, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function RaffleResult({ raffle, onExport, onClose }) {
  const results = raffle.results || [];

  React.useEffect(() => {
    // Animação de confete ao mostrar resultados
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a855f7', '#ec4899', '#8b5cf6']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#ec4899', '#8b5cf6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const exportResults = () => {
    if (raffle.type === 'teams') {
      // Exportar times
      const teamsData = results.map((team, i) => ({
        time: `Time ${i + 1}`,
        membros: team.members.join(', ')
      }));
      
      const csv = [
        'Time,Membros',
        ...teamsData.map(t => `"${t.time}","${t.membros}"`)
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resultado_${raffle.title}.csv`;
      a.click();
    } else {
      // Exportar vencedores
      const csv = [
        'Posição,Vencedor',
        ...results.map((winner, i) => `${i + 1},"${winner.value || winner}"`)
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resultado_${raffle.title}.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        
        <h2 className="text-3xl font-bold mb-2">
          Sorteio Concluído!
        </h2>
        <p className="text-gray-600">
          {raffle.title}
        </p>
      </GlassCard>

      {raffle.type === 'teams' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((team, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Time {index + 1}</h3>
                </div>
                <ul className="space-y-2">
                  {team.members.map((member, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 bg-white/30 rounded-lg">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{member}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold mb-4">
            {results.length === 1 ? 'Vencedor' : 'Vencedores'}
          </h3>
          <div className="space-y-3">
            {results.map((winner, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                  {index + 1}º
                </div>
                <span className="flex-1 text-lg font-semibold">
                  {winner.value || winner}
                </span>
                {winner.weight && winner.weight !== 1 && (
                  <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                    Peso: {winner.weight}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Verificação criptográfica */}
      {raffle.verification?.enabled && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-3">Prova Criptográfica</h3>
          <div className="space-y-2 text-sm font-mono bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <div>
              <span className="text-gray-400">Hash do Commit:</span>
              <br />
              {raffle.verification.commit_hash}
            </div>
            {raffle.verification.reveal_seed && (
              <div>
                <span className="text-gray-400">Seed Revelado:</span>
                <br />
                {raffle.verification.reveal_seed}
              </div>
            )}
            <div>
              <span className="text-gray-400">Timestamp:</span>
              <br />
              {new Date(raffle.verification.timestamp).toLocaleString('pt-BR')}
            </div>
          </div>
        </GlassCard>
      )}

      <div className="flex gap-3">
        <Button
          onClick={exportResults}
          variant="outline"
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Resultados
        </Button>
        <Button
          onClick={onClose}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
        >
          Fechar
        </Button>
      </div>
    </div>
  );
}