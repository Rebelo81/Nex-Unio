'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Aqui você implementaria a lógica para alternar o tema
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // Implementar busca global
    const query = searchQuery.toLowerCase().trim();
    
    // Dados simulados para busca
    const searchableData = [
      // Parceiros
      { type: 'partner', id: '1', name: 'João Silva', email: 'joao@exemplo.com', url: '/partners' },
      { type: 'partner', id: '2', name: 'Maria Santos', email: 'maria@exemplo.com', url: '/partners' },
      { type: 'partner', id: '3', name: 'Pedro Costa', email: 'pedro@exemplo.com', url: '/partners' },
      
      // Equipamentos
      { type: 'equipment', id: '1', name: 'Escavadeira CAT 320', category: 'Escavadeiras', url: '/equipment' },
      { type: 'equipment', id: '2', name: 'Retroescavadeira JCB', category: 'Retroescavadeiras', url: '/equipment' },
      { type: 'equipment', id: '3', name: 'Guindaste Liebherr', category: 'Guindastes', url: '/equipment' },
      
      // Páginas
      { type: 'page', id: 'dashboard', name: 'Dashboard', description: 'Visão geral do sistema', url: '/dashboard' },
      { type: 'page', id: 'partners', name: 'Parceiros', description: 'Gerenciar parceiros', url: '/partners' },
      { type: 'page', id: 'equipment', name: 'Equipamentos', description: 'Gerenciar equipamentos', url: '/equipment' },
      { type: 'page', id: 'rentals', name: 'Locações', description: 'Gerenciar locações', url: '/rentals' },
    ];
    
    // Filtrar resultados
    const results = searchableData.filter(item => 
      item.name.toLowerCase().includes(query) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
    
    if (results.length > 0) {
      // Se houver apenas um resultado, navegar diretamente
      if (results.length === 1) {
        window.location.href = results[0].url;
      } else {
        // Mostrar resultados (por enquanto, navegar para o primeiro)
        console.log('Resultados da busca:', results);
        alert(`Encontrados ${results.length} resultados. Navegando para: ${results[0].name}`);
        window.location.href = results[0].url;
      }
    } else {
      alert('Nenhum resultado encontrado para: ' + searchQuery);
    }
    
    // Limpar busca
    setSearchQuery('');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-9 w-9"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative hover:bg-primary-50"
          >
            <Bell className="h-4 w-4 text-neutral-600" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 p-2 hover:bg-primary-50"
            >
              <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center shadow-pro">
                <User className="h-4 w-4 text-white" />
              </div>
              {user && (
                <div className="hidden md:block text-left">
                  <div className="font-medium text-neutral-900">{user.name}</div>
                  <div className="text-xs text-neutral-500">{user.role}</div>
                </div>
              )}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-200">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
                
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="h-4 w-4 mr-3" />
                  Meu Perfil
                </button>
                
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Configurações
                </button>
                
                <div className="border-t border-neutral-200">
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-error-700 hover:bg-error-50"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export { Header };