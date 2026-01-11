import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Search,
  Star,
  Check,
  X,
  Eye,
  Sparkles,
  Trophy,
  ChevronLeft,
  Filter
} from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

export default function Testimonials() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [organization, setOrganization] = useState(null);

  const queryClient = useQueryClient();

  // Load organization
  React.useEffect(() => {
    base44.entities.Organization.list('-created_date', 1)
      .then(orgs => setOrganization(orgs[0]))
      .catch(() => {});
  }, []);

  // Fetch testimonials
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['testimonials', organization?.id],
    queryFn: () => base44.entities.Testimonial.filter({ 
      organization_id: organization.id 
    }, '-created_date'),
    enabled: !!organization,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, featured }) => 
      base44.entities.Testimonial.update(id, {
        status,
        featured,
        approved_by: status === 'approved' ? base44.auth.me().then(u => u.email) : undefined,
        approved_at: status === 'approved' ? new Date().toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success('Depoimento atualizado!');
      setSelectedTestimonial(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Testimonial.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success('Depoimento excluído!');
      setSelectedTestimonial(null);
    },
  });

  const handleApprove = (testimonial) => {
    updateStatusMutation.mutate({ 
      id: testimonial.id, 
      status: 'approved',
      featured: testimonial.featured 
    });
  };

  const handleReject = (testimonial) => {
    updateStatusMutation.mutate({ 
      id: testimonial.id, 
      status: 'rejected',
      featured: false 
    });
  };

  const handleToggleFeatured = (testimonial) => {
    updateStatusMutation.mutate({ 
      id: testimonial.id, 
      status: testimonial.status,
      featured: !testimonial.featured 
    });
  };

  const handleDelete = (testimonial) => {
    if (confirm('Deseja realmente excluir este depoimento?')) {
      deleteMutation.mutate(testimonial.id);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? 'fill-amber-400 text-amber-400'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  // Filter testimonials
  const filteredTestimonials = testimonials.filter(t => {
    const matchesSearch = t.author_name.toLowerCase().includes(search.toLowerCase()) ||
                          t.content.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: testimonials.length,
    pending: testimonials.filter(t => t.status === 'pending').length,
    approved: testimonials.filter(t => t.status === 'approved').length,
    featured: testimonials.filter(t => t.featured).length,
  };

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-violet-500" />
                Depoimentos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie os depoimentos dos vencedores
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-violet-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.pending}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="text-amber-600 font-bold">{stats.pending}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aprovados</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.approved}
                </p>
              </div>
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Destaques</p>
                <p className="text-2xl font-bold text-violet-600">
                  {stats.featured}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-violet-500" />
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou conteúdo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCard>

        {/* Testimonials List */}
        {isLoading ? (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
          </GlassCard>
        ) : filteredTestimonials.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              {search || statusFilter !== 'all' 
                ? 'Nenhum depoimento encontrado com os filtros aplicados'
                : 'Nenhum depoimento ainda'}
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTestimonials.map((testimonial) => (
              <GlassCard key={testimonial.id} className="p-5 relative">
                {testimonial.featured && (
                  <Badge className="absolute top-3 right-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                    ⭐ Destaque
                  </Badge>
                )}

                <div className="flex gap-1 mb-3">
                  {renderStars(testimonial.rating)}
                </div>

                {testimonial.title && (
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {testimonial.title}
                  </h3>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                  {testimonial.content}
                </p>

                {testimonial.prize_won && (
                  <div className="flex items-center gap-2 mb-3 text-xs text-amber-700 dark:text-amber-300">
                    <Trophy className="w-3 h-3" />
                    {testimonial.prize_won}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={testimonial.author_photo_url} />
                    <AvatarFallback className="bg-violet-500 text-white text-xs">
                      {testimonial.author_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {testimonial.author_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(testimonial.created_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge className={statusColors[testimonial.status]}>
                    {statusLabels[testimonial.status]}
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedTestimonial(testimonial)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalhes
                </Button>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedTestimonial} onOpenChange={() => setSelectedTestimonial(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Depoimento</DialogTitle>
            </DialogHeader>

            {selectedTestimonial && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {renderStars(selectedTestimonial.rating)}
                  </div>
                  <Badge className={statusColors[selectedTestimonial.status]}>
                    {statusLabels[selectedTestimonial.status]}
                  </Badge>
                </div>

                {selectedTestimonial.title && (
                  <div>
                    <Label className="text-xs text-gray-500">Título</Label>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedTestimonial.title}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-gray-500">Depoimento</Label>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedTestimonial.content}
                  </p>
                </div>

                {selectedTestimonial.prize_won && (
                  <div>
                    <Label className="text-xs text-gray-500">Prêmio ganho</Label>
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <Trophy className="w-4 h-4" />
                      {selectedTestimonial.prize_won}
                    </div>
                  </div>
                )}

                {selectedTestimonial.photo_url && (
                  <div>
                    <Label className="text-xs text-gray-500 mb-2 block">Foto</Label>
                    <img
                      src={selectedTestimonial.photo_url}
                      alt="Foto do prêmio"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Avatar>
                    <AvatarImage src={selectedTestimonial.author_photo_url} />
                    <AvatarFallback className="bg-violet-500 text-white">
                      {selectedTestimonial.author_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedTestimonial.author_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(selectedTestimonial.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedTestimonial.status === 'pending' && (
                    <>
                      <GradientButton
                        variant="success"
                        className="flex-1"
                        onClick={() => handleApprove(selectedTestimonial)}
                        loading={updateStatusMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Aprovar
                      </GradientButton>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReject(selectedTestimonial)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </>
                  )}

                  {selectedTestimonial.status === 'approved' && (
                    <Button
                      variant={selectedTestimonial.featured ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => handleToggleFeatured(selectedTestimonial)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {selectedTestimonial.featured ? 'Remover destaque' : 'Destacar'}
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedTestimonial)}
                    disabled={deleteMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}