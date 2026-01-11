import React from 'react';
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Trophy, Quote } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TestimonialCard({ testimonial, featured = false }) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className={`p-6 h-full ${featured ? 'border-2 border-violet-500/50' : ''}`}>
        {/* Featured Badge */}
        {featured && (
          <Badge className="mb-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white">
            ⭐ Destaque
          </Badge>
        )}

        {/* Quote Icon */}
        <Quote className="w-10 h-10 text-violet-500/20 mb-4" />

        {/* Rating */}
        <div className="flex gap-1 mb-3">
          {renderStars(testimonial.rating)}
        </div>

        {/* Title */}
        {testimonial.title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {testimonial.title}
          </h3>
        )}

        {/* Content */}
        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {testimonial.content}
        </p>

        {/* Prize Won */}
        {testimonial.prize_won && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-amber-900 dark:text-amber-100">
              Ganhou: {testimonial.prize_won}
            </span>
          </div>
        )}

        {/* Photo */}
        {testimonial.photo_url && (
          <div className="mb-4">
            <img
              src={testimonial.photo_url}
              alt="Foto do prêmio"
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Avatar>
            <AvatarImage src={testimonial.author_photo_url} />
            <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-500 text-white">
              {testimonial.author_name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">
              {testimonial.author_name}
            </p>
            {testimonial.created_date && (
              <p className="text-xs text-gray-500">
                {format(new Date(testimonial.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}