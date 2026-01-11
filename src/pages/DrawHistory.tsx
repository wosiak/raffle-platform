import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  Search,
  Filter,
  Trophy,
  Users,
  Hash,
  Shuffle,
  Scale,
  List,
  Download,
  Eye,
  Shield,
  Calendar,
  ArrowLeft,
  Plus
} from "lucide-react";

const typeIcons = {
  list: List,
  numeric_range: Hash,
  weighted: Scale,
  teams: Users,
  shuffle: Shuffle,
  elimination: Trophy
};

const typeLabels = {
  list: 'Lista',
  numeric_range: 'Numérico',
  weighted: 'Pesos',
  teams: 'Times',
  shuffle: 'Embaralhar',
  elimination: 'Eliminatória'
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  locked: 'bg-amber-100 text-amber-700',
  executed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700'
};

const statusLabels = {
  draft: 'Rascunho',
  locked: 'Travado',
  executed: 'Realizado',
  cancelled: 'Cancelado'
};

export default function DrawHistory() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDraw, setSelectedDraw] = useState(null);

  const { data: draws = [], isLoading } = useQuery({
    queryKey: ['draws'],
    queryFn: () => base44.entities.Draw.filter({}, '-created_date', 100),
  });

  const filteredDraws = draws.filter(draw => {
    const matchesSearch = !search || 
      draw.title?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || draw.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || draw.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const exportDraw = (draw, format) => {
    if (!draw.results) return;

    let content, filename, type;

    if (format === 'csv') {
      const headers = draw.type === 'teams' 
        ? 'Posição,Valor,Time\n'
        : 'Posição,Valor\n';
      const rows = draw.results.map(r => 
        draw.type === 'teams'
          ? `${r.position},${r.value},${r.team}`
          : `${r.position},${r.value}`
      ).join('\n');
      content = headers + rows;
      filename = `sorteio-${draw.title?.replace(/\s+/g, '-')}.csv`;
      type = 'text/csv';
    } else {
      content = JSON.stringify({
        draw: {
          title: draw.title,
          type: draw.type,
          executed_at: draw.executed_at,
          verification: draw.verification
        },
        results: draw.results
      }, null, 2);
      filename = `sorteio-${draw.title?.replace(/\s+/g, '-')}.json`;
      type = 'application/json';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-6 h-6 text-violet-500" />
                Histórico de Sorteios
              </h1>
              <p className="text-sm text-gray-500">
                {filteredDraws.length} sorteio{filteredDraws.length !== 1 ? 's' : ''} encontrado{filteredDraws.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link to={createPageUrl('NewDraw')}>
            <GradientButton icon={Plus}>
              Novo Sorteio
            </GradientButton>
          </Link>
        </div>

        {/* Filters */}
        <GlassCard className="p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="list">Lista</SelectItem>
                <SelectItem value="numeric_range">Numérico</SelectItem>
                <SelectItem value="weighted">Com pesos</SelectItem>
                <SelectItem value="teams">Times</SelectItem>
                <SelectItem value="shuffle">Embaralhar</SelectItem>
                <SelectItem value="elimination">Eliminatória</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="locked">Travado</SelectItem>
                <SelectItem value="executed">Realizado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCard>

        {/* Table */}
        <GlassCard className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Carregando...
            </div>
          ) : filteredDraws.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhum sorteio encontrado</p>
              <Link to={createPageUrl('NewDraw')}>
                <GradientButton className="mt-4" icon={Plus}>
                  Criar primeiro sorteio
                </GradientButton>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verificável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDraws.map((draw, index) => {
                  const TypeIcon = typeIcons[draw.type] || Trophy;
                  return (
                    <motion.tr
                      key={draw.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                    >
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {draw.title}
                        </div>
                        {draw.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {draw.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-violet-500" />
                          <span className="text-sm">{typeLabels[draw.type]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-4 h-4 text-gray-400" />
                          {draw.participants_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {draw.executed_at 
                            ? format(new Date(draw.executed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : format(new Date(draw.created_date), "dd/MM/yyyy", { locale: ptBR })
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[draw.status]}>
                          {statusLabels[draw.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {draw.verification?.enabled ? (
                          <Shield className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDraw(draw)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {draw.status === 'executed' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportDraw(draw, 'csv')}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </GlassCard>

        {/* Detail Dialog */}
        <Dialog open={!!selectedDraw} onOpenChange={() => setSelectedDraw(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                {selectedDraw?.title}
              </DialogTitle>
            </DialogHeader>
            
            {selectedDraw && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Tipo</p>
                    <p className="font-medium">{typeLabels[selectedDraw.type]}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <Badge className={statusColors[selectedDraw.status]}>
                      {statusLabels[selectedDraw.status]}
                    </Badge>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Participantes</p>
                    <p className="font-medium">{selectedDraw.participants_count || 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Data</p>
                    <p className="font-medium">
                      {selectedDraw.executed_at 
                        ? format(new Date(selectedDraw.executed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : '—'
                      }
                    </p>
                  </div>
                </div>

                {selectedDraw.verification?.enabled && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-emerald-800 dark:text-emerald-200">
                        Sorteio Verificável
                      </span>
                    </div>
                    <div className="text-xs font-mono text-emerald-700 dark:text-emerald-300 space-y-1 break-all">
                      <p><strong>Hash:</strong> {selectedDraw.verification.commit_hash}</p>
                      <p><strong>Timestamp:</strong> {selectedDraw.verification.timestamp}</p>
                    </div>
                  </div>
                )}

                {selectedDraw.results && selectedDraw.results.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      Resultados
                    </h3>
                    <ScrollArea className="h-[200px] rounded-lg border">
                      <div className="p-3 space-y-2">
                        {selectedDraw.results.map((result, index) => (
                          <div 
                            key={index}
                            className={`flex items-center gap-3 p-2 rounded ${
                              index === 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                              ${index === 0 
                                ? 'bg-amber-400 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
                            `}>
                              {result.position}º
                            </div>
                            <span className="flex-1">{result.value}</span>
                            {result.team && (
                              <Badge variant="outline">Time {result.team}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => exportDraw(selectedDraw, 'csv')}>
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" onClick={() => exportDraw(selectedDraw, 'json')}>
                    <Download className="w-4 h-4 mr-2" />
                    JSON
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