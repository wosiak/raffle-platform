import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { List, Hash, Trophy, Users, Shuffle, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const raffleTypes = [
  {
    id: 'list',
    icon: List,
    title: 'Lista de Itens',
    description: 'Nomes, palavras ou qualquer texto'
  },
  {
    id: 'numeric',
    icon: Hash,
    title: 'Intervalo Numérico',
    description: 'Sortear números em um intervalo'
  },
  {
    id: 'weighted',
    icon: Trophy,
    title: 'Sorteio com Pesos',
    description: 'Itens com probabilidades diferentes'
  },
  {
    id: 'teams',
    icon: Users,
    title: 'Times Balanceados',
    description: 'Dividir participantes em grupos'
  },
  {
    id: 'shuffle',
    icon: Shuffle,
    title: 'Embaralhar Lista',
    description: 'Ordenar aleatoriamente todos os itens'
  },
  {
    id: 'elimination',
    icon: Target,
    title: 'Eliminatória',
    description: 'Múltiplas rodadas removendo vencedores'
  }
];

export default function RaffleTypeSelector({ onSelect, selectedType }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {raffleTypes.map((type, index) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;
        
        return (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              hover
              className={`p-6 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-purple-500 bg-white/80' : ''
              }`}
              onClick={() => onSelect(type.id)}
              role="button"
              tabIndex={0}
              aria-label={`Selecionar ${type.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(type.id);
                }
              }}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-4 rounded-xl ${
                  isSelected 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                  <Icon className={`w-8 h-8 ${
                    isSelected ? 'text-white' : 'text-gray-700'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {type.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {type.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}