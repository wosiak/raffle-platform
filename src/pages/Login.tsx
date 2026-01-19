import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { companySlug } = useParams<{ companySlug?: string }>();
  const navigate = useNavigate();
  const { login, isMaster } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      
      // Redirecionar baseado no tipo de usuário
      if (isMaster) {
        navigate('/master/companies');
      } else if (companySlug) {
        navigate(`/${companySlug}/dashboard`);
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-12 h-12 text-violet-500" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
              Sistema de Sorteios
            </h1>
            {companySlug && (
              <p className="text-gray-500 mt-2">
                Acessando: <span className="font-semibold">{companySlug}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <GradientButton
              type="submit"
              loading={loading}
              className="w-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Entrar
            </GradientButton>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Credenciais de teste:</p>
            <p className="mt-2">
              <strong>Master:</strong> master@admin.com / master123
            </p>
            <p>
              <strong>Admin:</strong> admin@empresa01.com / empresa01
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
