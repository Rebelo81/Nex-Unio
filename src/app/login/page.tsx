'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { isValidEmail } from '@/lib/utils';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { user, login, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Login bem-sucedido, o contexto já redirecionará
        router.push('/dashboard');
      } else {
        setErrors({ general: 'Email ou senha incorretos. Tente novamente.' });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setErrors({ general: 'Erro ao fazer login. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo e título */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center">
            <Image 
              src="/ProRentals.png" 
              alt="Pro Rentals" 
              width={96}
              height={96}
              className="h-24 w-auto cursor-pointer transform transition-all duration-300 hover:scale-110 hover:rotate-3 hover:drop-shadow-lg" 
              onClick={() => router.push('/dashboard')}
              title="Ir para Dashboard"
              priority
            />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-neutral-900">
            Pro Rentals Admin
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Faça login para acessar o painel administrativo
          </p>
        </div>

        {/* Formulário de login */}
        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Erro geral */}
              {errors.general && (
                <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md text-sm">
                  {errors.general}
                </div>
              )}

              {/* Email */}
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                icon={Mail}
                placeholder="seu@email.com"
                required
              />

              {/* Senha */}
              <div className="relative">
                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  error={errors.password}
                  icon={Lock}
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Lembrar-me e esqueci a senha */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-900">
                    Lembrar-me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Esqueceu a senha?
                  </a>
                </div>
              </div>

              {/* Botão de login */}
              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>


          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;