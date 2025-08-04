'use client';

import { useAuth } from '@/lib/auth/context';
import { Permission } from '@/lib/auth/permissions';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // Se true, precisa de todas as permissões. Se false, precisa de pelo menos uma
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requireAll = false,
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Ainda carregando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Não autenticado
  if (!isAuthenticated) {
    return fallback || null;
  }

  // Verificar permissões se especificadas
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every(permission => hasPermission(permission))
      : requiredPermissions.some(permission => hasPermission(permission));

    if (!hasRequiredPermissions) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Acesso Negado
              </h1>
              <p className="text-gray-600 mb-6">
                Você não tem permissão para acessar esta página.
              </p>
              <button
                onClick={() => router.back()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Voltar
              </button>
            </div>
          </div>
        )
      );
    }
  }

  return <>{children}</>;
}

// Componente para proteger elementos específicos
interface PermissionGuardProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
}

export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Componente para proteger com múltiplas permissões
interface MultiPermissionGuardProps {
  children: ReactNode;
  permissions: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function MultiPermissionGuard({
  children,
  permissions,
  requireAll = false,
  fallback = null
}: MultiPermissionGuardProps) {
  const { hasPermission } = useAuth();

  const hasRequiredPermissions = requireAll
    ? permissions.every(permission => hasPermission(permission))
    : permissions.some(permission => hasPermission(permission));

  if (!hasRequiredPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Componente para mostrar conteúdo diferente baseado no tipo de usuário
interface RoleBasedContentProps {
  marketplaceContent?: ReactNode;
  partnerContent?: ReactNode;
  fallback?: ReactNode;
}

export function RoleBasedContent({
  marketplaceContent,
  partnerContent,
  fallback = null
}: RoleBasedContentProps) {
  const { isMarketplaceUser, isPartnerUser } = useAuth();

  if (isMarketplaceUser && marketplaceContent) {
    return <>{marketplaceContent}</>;
  }

  if (isPartnerUser && partnerContent) {
    return <>{partnerContent}</>;
  }

  return <>{fallback}</>;
}