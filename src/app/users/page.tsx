'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission, Role } from '@/lib/auth/permissions';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  Shield,
  Building
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  partnerId?: string;
  partnerName?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  lastLogin?: Date;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: Role;
  partnerId?: string;
}

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: Role.PARTNER_EMPLOYEE,
    partnerId: undefined
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mock data - em produção viria da API
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Administrador Pro Rentals',
      email: 'admin@prorentals.com',
      role: Role.SUPER_ADMIN,
      status: 'active',
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date()
    },
    {
      id: '2',
      name: 'João Silva',
      email: 'joao@parceiro1.com',
      role: Role.PARTNER_ADMIN,
      partnerId: '1',
      partnerName: 'Parceiro Exemplo',
      status: 'active',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Maria Santos',
      email: 'maria@parceiro1.com',
      role: Role.PARTNER_MANAGER,
      partnerId: '1',
      partnerName: 'Parceiro Exemplo',
      status: 'active',
      createdAt: new Date('2024-02-01'),
      lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '4',
      name: 'Carlos Oliveira',
      email: 'carlos@parceiro1.com',
      role: Role.PARTNER_EMPLOYEE,
      partnerId: '1',
      partnerName: 'Parceiro Exemplo',
      status: 'inactive',
      createdAt: new Date('2024-02-15'),
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    // Simular carregamento de dados
    const loadUsers = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filtrar usuários baseado no role do usuário atual
      let filteredUsers = mockUsers;
      
      if (currentUser?.role === Role.PARTNER_ADMIN || currentUser?.role === Role.PARTNER_MANAGER) {
        // Parceiros só veem usuários da própria empresa
        filteredUsers = mockUsers.filter(u => u.partnerId === currentUser.partnerId);
      }
      
      setUsers(filteredUsers);
      setLoading(false);
    };

    loadUsers();
  }, [currentUser]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: Role.PARTNER_EMPLOYEE,
      partnerId: currentUser?.partnerId
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      partnerId: user.partnerId
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = 'Nome é obrigatório';
    if (!formData.email) errors.email = 'Email é obrigatório';
    if (!editingUser && !formData.password) errors.password = 'Senha é obrigatória';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingUser) {
        // Atualizar usuário existente
        setUsers(prev => prev.map(u => 
          u.id === editingUser.id 
            ? { ...u, name: formData.name, email: formData.email, role: formData.role }
            : u
        ));
      } else {
        // Criar novo usuário
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          partnerId: formData.partnerId,
          partnerName: formData.partnerId ? 'Parceiro Exemplo' : undefined,
          status: 'active',
          createdAt: new Date()
        };
        setUsers(prev => [...prev, newUser]);
      }
      
      setShowCreateModal(false);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        // Simular chamada de API
        await new Promise(resolve => setTimeout(resolve, 500));
        setUsers(prev => prev.filter(u => u.id !== userId));
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
      }
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return 'bg-red-100 text-red-800';
      case Role.MARKETPLACE_ADMIN:
        return 'bg-purple-100 text-purple-800';
      case Role.MARKETPLACE_MANAGER:
        return 'bg-blue-100 text-blue-800';
      case Role.PARTNER_ADMIN:
        return 'bg-green-100 text-green-800';
      case Role.PARTNER_MANAGER:
        return 'bg-yellow-100 text-yellow-800';
      case Role.PARTNER_EMPLOYEE:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return 'Super Admin';
      case Role.MARKETPLACE_ADMIN:
        return 'Admin Marketplace';
      case Role.MARKETPLACE_MANAGER:
        return 'Gerente Marketplace';
      case Role.PARTNER_ADMIN:
        return 'Admin Parceiro';
      case Role.PARTNER_MANAGER:
        return 'Gerente Parceiro';
      case Role.PARTNER_EMPLOYEE:
        return 'Funcionário';
      default:
        return role;
    }
  };

  const getAvailableRoles = () => {
    if (currentUser?.role === Role.SUPER_ADMIN) {
      return Object.values(Role);
    }
    if (currentUser?.role === Role.MARKETPLACE_ADMIN) {
      return [Role.MARKETPLACE_MANAGER, Role.PARTNER_ADMIN, Role.PARTNER_MANAGER, Role.PARTNER_EMPLOYEE];
    }
    if (currentUser?.role === Role.PARTNER_ADMIN) {
      return [Role.PARTNER_MANAGER, Role.PARTNER_EMPLOYEE];
    }
    return [Role.PARTNER_EMPLOYEE];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[Permission.USERS_VIEW]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
            <p className="text-gray-600">Gerencie os usuários do sistema</p>
          </div>
          <Button onClick={handleCreateUser} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Parceiros</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(users.filter(u => u.partnerId).map(u => u.partnerId)).size}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={roleFilter}
              onChange={(value) => setRoleFilter(value as Role | 'all')}
              options={[
                { value: 'all', label: 'Todos os Roles' },
                ...Object.values(Role).map(role => ({
                  value: role,
                  label: getRoleLabel(role)
                }))
              ]}
            />
            
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}
              options={[
                { value: 'all', label: 'Todos os Status' },
                { value: 'active', label: 'Ativo' },
                { value: 'inactive', label: 'Inativo' }
              ]}
            />
            
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <Table
            columns={[
              {
                key: 'name',
                label: 'Nome',
                render: (user: User) => (
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                )
              },
              {
                key: 'role',
                label: 'Role',
                render: (user: User) => (
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                )
              },
              {
                key: 'partner',
                label: 'Parceiro',
                render: (user: User) => (
                  user.partnerName ? (
                    <span className="text-sm text-gray-900">{user.partnerName}</span>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (user: User) => (
                  <Badge className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {user.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                )
              },
              {
                key: 'lastLogin',
                label: 'Último Login',
                render: (user: User) => (
                  user.lastLogin ? (
                    <span className="text-sm text-gray-900">
                      {user.lastLogin.toLocaleDateString('pt-BR')}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Nunca</span>
                  )
                )
              },
              {
                key: 'actions',
                label: 'Ações',
                render: (user: User) => (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {user.id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              }
            ]}
            data={filteredUsers}
            loading={loading}
          />
        </Card>

        {/* Create/Edit User Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              required
            />
            
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              error={formErrors.email}
              required
            />
            
            {!editingUser && (
              <Input
                label="Senha"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                error={formErrors.password}
                required
              />
            )}
            
            <Select
              label="Role"
              value={formData.role}
              onChange={(value) => setFormData(prev => ({ ...prev, role: value as Role }))}
              options={getAvailableRoles().map(role => ({
                value: role,
                label: getRoleLabel(role)
              }))}
              required
            />
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingUser ? 'Atualizar' : 'Criar'} Usuário
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
};

export default UsersPage;