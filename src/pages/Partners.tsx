import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit,
  Trash2,
  Star,
  ArrowLeft,
  Instagram,
  Facebook,
  ExternalLink
} from "lucide-react";

const categoryLabels = {
  food: 'Alimentação',
  beauty: 'Beleza',
  health: 'Saúde',
  entertainment: 'Entretenimento',
  shopping: 'Compras',
  travel: 'Viagens',
  services: 'Serviços',
  education: 'Educação',
  other: 'Outros'
};

const categoryColors = {
  food: 'bg-orange-100 text-orange-700',
  beauty: 'bg-pink-100 text-pink-700',
  health: 'bg-emerald-100 text-emerald-700',
  entertainment: 'bg-purple-100 text-purple-700',
  shopping: 'bg-blue-100 text-blue-700',
  travel: 'bg-cyan-100 text-cyan-700',
  services: 'bg-indigo-100 text-indigo-700',
  education: 'bg-amber-100 text-amber-700',
  other: 'bg-gray-100 text-gray-700'
};

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-700'
};

export default function Partners() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [newPartner, setNewPartner] = useState({
    name: '',
    description: '',
    category: 'other',
    contact_email: '',
    contact_phone: '',
    address: '',
    website: '',
    social_links: { instagram: '', facebook: '' },
    redemption_rules: {
      min_credits: 10,
      max_credits_per_transaction: 1000,
      credits_to_currency_rate: 1,
      terms: ''
    },
    status: 'pending',
    featured: false
  });

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.filter({}, '-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Partner.create({
      ...data,
      organization_id: 'default'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setShowCreateDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Partner.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setEditingPartner(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Partner.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    }
  });

  const resetForm = () => {
    setNewPartner({
      name: '',
      description: '',
      category: 'other',
      contact_email: '',
      contact_phone: '',
      address: '',
      website: '',
      social_links: { instagram: '', facebook: '' },
      redemption_rules: {
        min_credits: 10,
        max_credits_per_transaction: 1000,
        credits_to_currency_rate: 1,
        terms: ''
      },
      status: 'pending',
      featured: false
    });
  };

  const currentPartner = editingPartner || newPartner;
  const setCurrentPartner = editingPartner ? setEditingPartner : setNewPartner;

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
                <Building2 className="w-6 h-6 text-emerald-500" />
                Parceiros
              </h1>
              <p className="text-sm text-gray-500">
                Gerencie os parceiros onde os créditos podem ser utilizados
              </p>
            </div>
          </div>
          <GradientButton icon={Plus} onClick={() => setShowCreateDialog(true)}>
            Novo Parceiro
          </GradientButton>
        </div>

        {/* Partners Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : partners.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum parceiro cadastrado
            </h3>
            <p className="text-gray-500 mb-6">
              Cadastre parceiros para que os membros possam resgatar seus créditos
            </p>
            <GradientButton icon={Plus} onClick={() => setShowCreateDialog(true)}>
              Cadastrar primeiro parceiro
            </GradientButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 h-full flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    {partner.logo_url ? (
                      <img 
                        src={partner.logo_url} 
                        alt={partner.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {partner.name}
                        </h3>
                        {partner.featured && (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge className={categoryColors[partner.category]}>
                          {categoryLabels[partner.category]}
                        </Badge>
                        <Badge className={statusColors[partner.status]}>
                          {partner.status === 'active' ? 'Ativo' : partner.status === 'pending' ? 'Pendente' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {partner.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {partner.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4 flex-1">
                    {partner.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{partner.address}</span>
                      </div>
                    )}
                    {partner.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-4 h-4" />
                        {partner.contact_phone}
                      </div>
                    )}
                    {partner.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{partner.contact_email}</span>
                      </div>
                    )}
                  </div>

                  {/* Social links */}
                  <div className="flex gap-2 mb-4">
                    {partner.social_links?.instagram && (
                      <a href={`https://instagram.com/${partner.social_links.instagram}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon" className="w-8 h-8">
                          <Instagram className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {partner.social_links?.facebook && (
                      <a href={partner.social_links.facebook} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon" className="w-8 h-8">
                          <Facebook className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {partner.website && (
                      <a href={partner.website} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon" className="w-8 h-8">
                          <Globe className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>

                  {/* Redemption info */}
                  {partner.redemption_rules && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mb-4 text-sm">
                      <p className="text-emerald-700 dark:text-emerald-300">
                        Mín: {partner.redemption_rules.min_credits} créditos • 
                        Taxa: {partner.redemption_rules.credits_to_currency_rate}:1
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingPartner(partner)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-rose-500 hover:text-rose-600"
                      onClick={() => deleteMutation.mutate(partner.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog || !!editingPartner} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingPartner(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                {editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome *</Label>
                  <Input
                    value={currentPartner.name}
                    onChange={(e) => setCurrentPartner({ ...currentPartner, name: e.target.value })}
                    placeholder="Nome do parceiro"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={currentPartner.description}
                    onChange={(e) => setCurrentPartner({ ...currentPartner, description: e.target.value })}
                    placeholder="Descrição do parceiro..."
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={currentPartner.category}
                    onValueChange={(category) => setCurrentPartner({ ...currentPartner, category })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={currentPartner.status}
                    onValueChange={(status) => setCurrentPartner({ ...currentPartner, status })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={currentPartner.contact_email}
                    onChange={(e) => setCurrentPartner({ ...currentPartner, contact_email: e.target.value })}
                    placeholder="contato@parceiro.com"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={currentPartner.contact_phone}
                    onChange={(e) => setCurrentPartner({ ...currentPartner, contact_phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={currentPartner.address}
                    onChange={(e) => setCurrentPartner({ ...currentPartner, address: e.target.value })}
                    placeholder="Rua, número - Cidade/UF"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={currentPartner.website}
                    onChange={(e) => setCurrentPartner({ ...currentPartner, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={currentPartner.social_links?.instagram || ''}
                    onChange={(e) => setCurrentPartner({ 
                      ...currentPartner, 
                      social_links: { ...currentPartner.social_links, instagram: e.target.value } 
                    })}
                    placeholder="@usuario"
                  />
                </div>
              </div>

              {/* Redemption Rules */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Regras de Resgate</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mínimo de créditos</Label>
                    <Input
                      type="number"
                      value={currentPartner.redemption_rules?.min_credits || 10}
                      onChange={(e) => setCurrentPartner({ 
                        ...currentPartner, 
                        redemption_rules: { 
                          ...currentPartner.redemption_rules, 
                          min_credits: parseInt(e.target.value) || 0 
                        } 
                      })}
                    />
                  </div>
                  <div>
                    <Label>Máximo por transação</Label>
                    <Input
                      type="number"
                      value={currentPartner.redemption_rules?.max_credits_per_transaction || 1000}
                      onChange={(e) => setCurrentPartner({ 
                        ...currentPartner, 
                        redemption_rules: { 
                          ...currentPartner.redemption_rules, 
                          max_credits_per_transaction: parseInt(e.target.value) || 0 
                        } 
                      })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Taxa (créditos para 1 unidade monetária)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentPartner.redemption_rules?.credits_to_currency_rate || 1}
                      onChange={(e) => setCurrentPartner({ 
                        ...currentPartner, 
                        redemption_rules: { 
                          ...currentPartner.redemption_rules, 
                          credits_to_currency_rate: parseFloat(e.target.value) || 1 
                        } 
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                setEditingPartner(null);
                resetForm();
              }}>
                Cancelar
              </Button>
              <GradientButton
                onClick={() => {
                  if (editingPartner) {
                    updateMutation.mutate({ id: editingPartner.id, data: editingPartner });
                  } else {
                    createMutation.mutate(newPartner);
                  }
                }}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingPartner ? 'Salvar' : 'Cadastrar'}
              </GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}