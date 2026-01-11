import React from 'react';
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { 
  List, 
  Hash, 
  Scale, 
  Users, 
  Shuffle, 
  Trophy,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const drawTypes = [
  {
    id: 'list',
    title: 'Lista de Itens',
    description: 'Nomes, palavras, frases ou qualquer texto',
    icon: List,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-500/10',
  },
  {
    id: 'numeric_range',
    title: 'Intervalo Numérico',
    description: 'Números de X a Y com passo e exclusões',
    icon: Hash,
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    id: 'weighted',
    title: 'Sorteio com Pesos',
    description: 'Itens com probabilidades diferentes',
    icon: Scale,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'teams',
    title: 'Times/Grupos',
    description: 'Dividir participantes em times balanceados',
    icon: Users,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'shuffle',
    title: 'Embaralhar/Ordenar',
    description: 'Ordenação aleatória da lista completa',
    icon: Shuffle,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500/10',
  },
  {
    id: 'elimination',
    title: 'Rodada Eliminatória',
    description: 'Remove ou mantém vencedor a cada rodada',
    icon: Trophy,
    color: 'from-indigo-500 to-violet-500',
    bgColor: 'bg-indigo-500/10',
  },
];

export default function DrawTypeSelector({ selectedType, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {drawTypes.map((type, index) => (
        <motion.div
          key={type.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <GlassCard
            hover
            animate={false}
            className={cn(
              "cursor-pointer p-5 transition-all duration-300",
              selectedType === type.id 
                ? "ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-gray-900" 
                : ""
            )}
            onClick={() => onSelect(type.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(type.id)}
            aria-pressed={selectedType === type.id}
            aria-label={`Selecionar ${type.title}`}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                type.bgColor
              )}>
                <type.icon className={cn(
                  "w-6 h-6 bg-gradient-to-br bg-clip-text",
                  type.color
                )} style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text', backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                <type.icon className={cn("w-6 h-6")} style={{ 
                  background: `linear-gradient(135deg, ${type.color.includes('violet') ? '#8B5CF6' : type.color.includes('cyan') ? '#06B6D4' : type.color.includes('amber') ? '#F59E0B' : type.color.includes('emerald') ? '#10B981' : type.color.includes('pink') ? '#EC4899' : '#6366F1'}, ${type.color.includes('purple') ? '#A855F7' : type.color.includes('blue') ? '#3B82F6' : type.color.includes('orange') ? '#F97316' : type.color.includes('teal') ? '#14B8A6' : type.color.includes('rose') ? '#F43F5E' : '#8B5CF6'})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'none'
                }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {type.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {type.description}
                </p>
              </div>
              <ChevronRight className={cn(
                "w-5 h-5 text-gray-300 dark:text-gray-600 transition-transform",
                selectedType === type.id && "translate-x-1 text-violet-500"
              )} />
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}