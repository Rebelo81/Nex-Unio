'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Permission, getAvailableMenuItems } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  Calendar,
  DollarSign,
  Settings,
  Building,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertTriangle
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// Mapeamento de ícones
const iconMap = {
  home: LayoutDashboard,
  package: Package,
  calendar: Calendar,
  users: UserCheck,
  building: Building,
  'dollar-sign': DollarSign,
  'user-plus': UserPlus,
  settings: Settings,
  'alert-triangle': AlertTriangle
};

// Menu items com permissões
const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'home',
    requiredPermissions: [Permission.DASHBOARD_VIEW]
  },
  {
    id: 'products',
    label: 'Produtos',
    path: '/equipment',
    icon: 'package',
    requiredPermissions: [Permission.PRODUCTS_VIEW]
  },
  {
    id: 'rentals',
    label: 'Locações',
    path: '/rentals',
    icon: 'calendar',
    requiredPermissions: [Permission.RENTALS_VIEW]
  },
  {
    id: 'damage-reports',
    label: 'Relatórios de Avarias',
    path: '/damage-reports',
    icon: 'alert-triangle',
    requiredPermissions: [Permission.RENTALS_VIEW] // Usando a mesma permissão de locações por enquanto
  },
  {
    id: 'clients',
    label: 'Clientes',
    path: '/clients',
    icon: 'users',
    requiredPermissions: [Permission.CLIENTS_VIEW]
  },
  {
    id: 'partners',
    label: 'Parceiros',
    path: '/partners',
    icon: 'building',
    requiredPermissions: [Permission.PARTNERS_VIEW]
  },
  {
    id: 'financial',
    label: 'Financeiro',
    path: '/financial',
    icon: 'dollar-sign',
    requiredPermissions: [Permission.FINANCIAL_VIEW]
  },
  {
    id: 'users',
    label: 'Usuários',
    path: '/users',
    icon: 'user-plus',
    requiredPermissions: [Permission.USERS_VIEW]
  },
  {
    id: 'settings',
    label: 'Configurações',
    path: '/settings',
    icon: 'settings',
    requiredPermissions: [Permission.SETTINGS_VIEW]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Filtrar menu items baseado nas permissões do usuário
  const availableMenuItems = getAvailableMenuItems(user?.permissions || []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div
      className={cn(
        'bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col h-full',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="w-12 h-12 flex items-center justify-center relative">
              <Image 
                src="/ProRentals.png" 
                alt="Pro Rentals" 
                fill
                className="object-contain cursor-pointer transform transition-all duration-300 hover:scale-105 hover:brightness-110" 
                title="Ir para Dashboard"
                priority
              />
            </Link>
            <div className="flex flex-col">
              <span className="font-semibold text-neutral-900">Pro Rentals</span>
              {user && (
                <span className="text-xs text-gray-500 capitalize">
                  {user.role.toLowerCase().replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {availableMenuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          const IconComponent = iconMap[item.icon as keyof typeof iconMap];

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              )}
              title={collapsed ? item.label : undefined}
            >
              <IconComponent className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-primary-700' : 'text-neutral-400')} />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {user && !collapsed && (
          <div className="text-xs text-gray-600 mb-2">
            <div className="font-medium truncate">{user.name}</div>
            <div className="text-gray-500 truncate">{user.email}</div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full',
            'text-red-600 hover:bg-red-50 hover:text-red-700'
          )}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && (
            <span className="truncate">Sair</span>
          )}
        </button>
        
        {!collapsed && (
          <div className="text-xs text-gray-500 text-center mt-2">
            Pro Rentals Admin v1.0
          </div>
        )}
      </div>
    </div>
  );
};

export { Sidebar };