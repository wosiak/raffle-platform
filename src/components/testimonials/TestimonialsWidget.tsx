import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TestimonialCard from './TestimonialCard';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TestimonialsWidget({ limit = 6, featuredOnly = false }) {
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['public-testimonials', featuredOnly],
    queryFn: async () => {
      let query = { status: 'approved' };
      if (featuredOnly) {
        query.featured = true;
      }
      const results = await base44.entities.Testimonial.filter(query, '-created_date', limit);
      return results;
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Carregando depoimentos...</p>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 rounded-full mb-4"
        >
          <MessageSquare className="w-5 h-5 text-violet-600" />
          <span className="text-violet-700 dark:text-violet-300 font-medium">Depoimentos</span>
        </motion.div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          O que nossos vencedores dizem
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Confira a experiência de quem já ganhou em nossos sorteios
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <TestimonialCard 
              testimonial={testimonial} 
              featured={testimonial.featured}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}