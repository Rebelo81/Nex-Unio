'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Role, Permission, hasPermission, isMarketplaceRole, isPartnerRole } from './permissions';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  partnerId?: string; // Para usuários de parceiros
  partnerName?: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  isMarketplaceUser: boolean;
  isPartnerUser: boolean;
  partnerId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se há token salvo e validar
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (token) {
          // Validar token com o backend
          const response = await fetch('/api/auth/validate', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token inválido, remover
            localStorage.removeItem('auth-token');
          }
        }
      } catch (error) {
        console.error('Erro ao validar token:', error);
        localStorage.removeItem('auth-token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        return false; // Login falhou
      }

      const { user: userData, token } = await response.json();
      
      // Salvar token
      localStorage.setItem('auth-token', token);
      
      // Atualizar estado do usuário
      setUser(userData);
      return true; // Login bem-sucedido
    } catch (error) {
      console.error('Erro no login:', error);
      return false; // Login falhou
    }
  };

  const logout = () => {
    localStorage.removeItem('auth-token');
    setUser(null);
    
    // Redirecionar para login
    window.location.href = '/login';
  };

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const isMarketplaceUser = user ? isMarketplaceRole(user.role) : false;
  const isPartnerUser = user ? isPartnerRole(user.role) : false;

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission: checkPermission,
    isMarketplaceUser,
    isPartnerUser,
    partnerId: user?.partnerId
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para verificar permissões específicas
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

// Hook para verificar múltiplas permissões
export function usePermissions(permissions: Permission[]): boolean[] {
  const { hasPermission } = useAuth();
  return permissions.map(permission => hasPermission(permission));
}

// Hook para verificar se tem todas as permissões
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const { hasPermission } = useAuth();
  return permissions.every(permission => hasPermission(permission));
}

// Hook para verificar se tem pelo menos uma permissão
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { hasPermission } = useAuth();
  return permissions.some(permission => hasPermission(permission));
}