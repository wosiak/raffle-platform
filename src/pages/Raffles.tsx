import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import GlassBackground from '@/components/layout/GlassBackground';
import GlassCard from '@/components/ui/GlassCard';

const createPageUrl = (pageName) => `/${pageName}`;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Trophy, 
  Search,
  Calendar,
  Users,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Raffles() {
  const [organization, setOrganization] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function loadOrganization() {
      const orgs = await base44.entities.Organization.list();
      if (orgs.length > 0) {
        setOrganization(orgs[0]);
      }
    }
    loadOrganization();
  }, []);

  const { data: raffles = [], isLoading } = useQuery({
    queryKey: ['raffles', organization?.id],
    queryFn: () => organization
      ? base44.entities.Raffle.filter({ organization_id: organization.id }, '-created_date')
      : [],
    enabled: !!organization
  });

  const filteredRaffles = raffles.filter(raffle => {
    const matchesSearch = raffle.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || raffle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    locked: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const statusLabels = {
    draft: 'Rascunho',
    locked: 'Travado',
    completed: 'Concluído',
    cancelled: 'Cancelado'
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Sorteios
            </h1>
            <p className="text-gray-600">
              Gerencie todos os sorteios da sua organização
            </p>
          </div>
          <Link to={createPageUrl('CreateRaffle')}>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Sorteio
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <GlassCard className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar sorteios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'draft', 'locked', 'completed'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
                >
                  {status === 'all' ? 'Todos' : statusLabels[status]}
                </Button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Raffles Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          </div>
        ) : filteredRaffles.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum sorteio encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar seus filtros'
                : 'Comece criando seu primeiro sorteio'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link to={createPageUrl('CreateRaffle')}>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Sorteio
                </Button>
              </Link>
            )}
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRaffles.map((raffle, index) => (
              <motion.div
                key={raffle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={createPageUrl(`ViewRaffle?id=${raffle.id}`)}>
                  <GlassCard hover className="p-6 h-full cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[raffle.status]}`}>
                        {statusLabels[raffle.status]}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {raffle.title}
                    </h3>

                    {raffle.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {raffle.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(raffle.created_date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                        </span>
                      </div>

                      {raffle.items && raffle.items.length > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{raffle.items.length} participantes</span>
                        </div>
                      )}

                      {raffle.results && raffle.results.length > 0 && (
                        <div className="flex items-center gap-2 text-purple-600 font-medium">
                          <Trophy className="w-4 h-4" />
                          <span>{raffle.results.length} vencedor(es)</span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}