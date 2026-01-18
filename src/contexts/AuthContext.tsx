import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  is_master: boolean;
  company_id: string | null;
  company_name?: string;
  company_slug?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isMaster: boolean;
  // Impersonate
  impersonatedCompanyId: string | null;
  impersonatedCompany: { id: string; name: string; slug: string } | null;
  impersonate: (companyId: string, companyName: string, companySlug: string) => void;
  exitImpersonate: () => void;
  // Helper para saber qual company usar nas queries
  getCurrentCompanyId: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);
  const [impersonatedCompany, setImpersonatedCompany] = useState<{ id: string; name: string; slug: string } | null>(null);

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedImpersonate = localStorage.getItem('impersonate');
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        
        if (storedImpersonate) {
          const imp = JSON.parse(storedImpersonate);
          setImpersonatedCompanyId(imp.id);
          setImpersonatedCompany(imp);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('impersonate');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase não configurado');
    }

    // Buscar usuário e verificar senha usando função do PostgreSQL
    const { data, error } = await supabase
      .rpc('login_user', { 
        p_email: email, 
        p_password: password 
      });

    if (error || !data || data.length === 0) {
      throw new Error('Email ou senha inválidos');
    }

    const userData = data[0];
    
    console.log('Login response:', userData); // Debug
    
    const userObj: User = {
      id: userData.user_id,              // Campo correto: user_id
      name: userData.user_name,          // Campo correto: user_name
      email: userData.user_email,        // Campo correto: user_email
      is_master: userData.user_role === 'master', // Derivado do role
      company_id: userData.company_id,
      company_name: userData.company_name,
      company_slug: userData.company_slug,
    };

    setUser(userObj);
    localStorage.setItem('user', JSON.stringify(userObj));
  };

  const logout = async () => {
    setUser(null);
    setImpersonatedCompanyId(null);
    setImpersonatedCompany(null);
    localStorage.removeItem('user');
    localStorage.removeItem('impersonate');
  };

  const impersonate = (companyId: string, companyName: string, companySlug: string) => {
    if (!user?.is_master) {
      console.error('Only masters can impersonate');
      return;
    }
    
    const imp = { id: companyId, name: companyName, slug: companySlug };
    setImpersonatedCompanyId(companyId);
    setImpersonatedCompany(imp);
    localStorage.setItem('impersonate', JSON.stringify(imp));
  };

  const exitImpersonate = () => {
    setImpersonatedCompanyId(null);
    setImpersonatedCompany(null);
    localStorage.removeItem('impersonate');
  };

  const getCurrentCompanyId = () => {
    // Se está impersonando, retorna o ID da empresa impersonada
    if (impersonatedCompanyId) {
      return impersonatedCompanyId;
    }
    // Se é admin, retorna o company_id do usuário
    if (user && !user.is_master) {
      return user.company_id;
    }
    // Se é master sem impersonate, retorna null (vê todas as empresas)
    return null;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isMaster: user?.is_master || false,
    impersonatedCompanyId,
    impersonatedCompany,
    impersonate,
    exitImpersonate,
    getCurrentCompanyId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
