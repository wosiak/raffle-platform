import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import { ArrowLeft, Settings, Construction } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-violet-500" />
              Configurações
            </h1>
          </div>
        </div>

        <GlassCard className="p-12 text-center">
          <Construction className="w-16 h-16 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Em construção
          </h2>
          <p className="text-gray-500">
            As configurações avançadas estarão disponíveis em breve.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}