import React, { useState } from 'react';
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Star, Upload, X, Heart } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

export default function TestimonialForm({ drawId, campaignId, prizeWon, onSuccess }) {
  const [formData, setFormData] = useState({
    author_name: '',
    rating: 5,
    title: '',
    content: '',
    prize_won: prizeWon || '',
    photo_url: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, photo_url: file_url });
      toast.success('Foto enviada com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.author_name || !formData.content) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      
      // Get organization from draw or campaign
      let organizationId = null;
      if (drawId) {
        const draws = await base44.entities.Draw.filter({ id: drawId });
        organizationId = draws[0]?.organization_id;
      } else if (campaignId) {
        const campaigns = await base44.entities.Campaign.filter({ id: campaignId });
        organizationId = campaigns[0]?.organization_id;
      }

      await base44.entities.Testimonial.create({
        ...formData,
        organization_id: organizationId,
        draw_id: drawId,
        campaign_id: campaignId,
        status: 'pending',
      });

      toast.success('Depoimento enviado! Aguarde aprovação da equipe.');
      
      setFormData({
        author_name: '',
        rating: 5,
        title: '',
        content: '',
        prize_won: prizeWon || '',
        photo_url: '',
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Erro ao enviar depoimento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="text-center mb-6">
        <Heart className="w-12 h-12 mx-auto mb-3 text-rose-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Deixe seu depoimento
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Conte sua experiência e ajude outros participantes!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <Label htmlFor="name">Seu nome *</Label>
          <Input
            id="name"
            value={formData.author_name}
            onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
            placeholder="Digite seu nome"
            required
          />
        </div>

        {/* Rating */}
        <div>
          <Label>Avaliação *</Label>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star })}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= formData.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Título (opcional)</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Experiência incrível!"
            maxLength={100}
          />
        </div>

        {/* Content */}
        <div>
          <Label htmlFor="content">Seu depoimento *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Conte como foi sua experiência..."
            className="min-h-[120px]"
            required
          />
        </div>

        {/* Prize */}
        <div>
          <Label htmlFor="prize">O que você ganhou?</Label>
          <Input
            id="prize"
            value={formData.prize_won}
            onChange={(e) => setFormData({ ...formData, prize_won: e.target.value })}
            placeholder="Ex: Vale-compras de R$ 500"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <Label>Foto com o prêmio (opcional)</Label>
          {formData.photo_url ? (
            <div className="relative mt-2">
              <img
                src={formData.photo_url}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setFormData({ ...formData, photo_url: '' })}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="mt-2 flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-violet-500 transition-colors">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isUploading ? 'Enviando...' : 'Clique para enviar uma foto'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          )}
        </div>

        <GradientButton
          type="submit"
          className="w-full"
          loading={isSubmitting}
          disabled={isUploading}
        >
          Enviar depoimento
        </GradientButton>

        <p className="text-xs text-gray-500 text-center">
          Seu depoimento será analisado antes de aparecer publicamente
        </p>
      </form>
    </GlassCard>
  );
}