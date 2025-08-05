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
        'transition-all duration-300 ease-in-out flex flex-col h-full border-r border-gray-800',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{ backgroundColor: '#000000', color: '#d4a017' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between" style={{ backgroundColor: '#000000' }}>
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-lg flex items-center justify-center font-bold text-black text-lg shadow-lg">
              PR
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg" style={{ color: '#d4a017' }}>Pro Rentals</span>
              <span className="text-xs font-medium" style={{ color: '#b8941a' }}>
                Sistema Executivo
              </span>
              {user && (
                <span className="text-xs capitalize" style={{ color: '#996f1a' }}>
                  {user.role.toLowerCase().replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-gray-900 transition-colors"
          style={{ color: '#d4a017' }}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1" style={{ backgroundColor: '#000000' }}>
        {availableMenuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          const IconComponent = iconMap[item.icon as keyof typeof iconMap];

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'border-l-4 border-yellow-500 shadow-lg'
                  : 'hover:border-l-4 hover:border-yellow-600 hover:shadow-md'
              )}
              style={{
                backgroundColor: isActive ? '#1a1a0d' : 'transparent',
                color: isActive ? '#d4a017' : '#b8941a',
                borderRadius: '8px'
              }}
              title={collapsed ? item.label : undefined}
            >
              <IconComponent className={cn(
                'h-5 w-5 flex-shrink-0', 
                isActive ? 'text-yellow-500' : 'text-yellow-600'
              )} />
              {!collapsed && (
                <span className="truncate font-semibold">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-2 h-2 bg-yellow-500 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800 space-y-3" style={{ backgroundColor: '#000000' }}>
        {user && !collapsed && (
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
            <div className="font-semibold truncate" style={{ color: '#d4a017' }}>{user.name}</div>
            <div className="text-xs truncate" style={{ color: '#996f1a' }}>{user.email}</div>
            <div className="text-xs font-medium mt-1 capitalize" style={{ color: '#b8941a' }}>
              {user.role.toLowerCase().replace('_', ' ')}
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full border border-red-800 hover:border-red-600 hover:bg-red-900/20'
          )}
          style={{ color: '#ef4444' }}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && (
            <span className="truncate font-semibold">Sair do Sistema</span>
          )}
        </button>
        
        {!collapsed && (
          <div className="text-xs text-center py-2 border-t border-gray-800" style={{ color: '#996f1a' }}>
            <div className="font-semibold">Pro Rentals Admin</div>
            <div className="text-xs">Sistema Executivo v2.0</div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Sidebar };