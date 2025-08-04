'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Permission } from '@/lib/auth/permissions';
import { ProtectedRoute, PermissionGuard } from '@/components/auth/ProtectedRoute';
import { Equipment, EquipmentFilters, EquipmentStats } from '@/types/equipment';
import { Category } from '@/types/equipment';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function EquipmentPage() {
  const { isPartnerUser, partnerId } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EquipmentFilters>({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Mock data para demonstração
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock categories
      const mockCategories: Category[] = [
        {
          id: '1',
          name: 'Ferramentas Elétricas',
          description: 'Furadeiras, parafusadeiras, serras, etc.',
          active: true,
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Equipamentos de Jardim',
          description: 'Cortadores de grama, motosserras, etc.',
          active: true,
          createdAt: new Date()
        },
        {
          id: '3',
          name: 'Equipamentos de Construção',
          description: 'Betoneiras, andaimes, etc.',
          active: true,
          createdAt: new Date()
        }
      ];
      
      // Mock equipments
      const mockEquipments: Equipment[] = [
        {
          id: '1',
          name: 'Furadeira de Impacto Bosch',
          description: 'Furadeira de impacto profissional com bateria de lítio',
          categoryId: '1',
          partnerId: partnerId || '1',
          dailyRate: 25.00,
          discountOptions: [
            {
              id: '1',
              minDays: 3,
              discountType: 'percentage',
              discountValue: 10,
              description: '10% de desconto para 3+ dias'
            }
          ],
          securityDeposit: 100.00,
          stockQuantity: 5,
          minStockAlert: 2,
          currentStock: 3,
          dimensions: {
            length: 25,
            width: 8,
            height: 20,
            weight: 1.5,
            lalamoveValidated: true,
            validatedAt: new Date()
          },
          images: ['/images/furadeira-bosch.jpg'],
          barcode: '7891234567890',
          returnChecklist: [
            {
              id: '1',
              description: 'Verificar funcionamento do motor',
              required: true,
              order: 1
            },
            {
              id: '2',
              description: 'Conferir acessórios inclusos',
              required: true,
              order: 2
            }
          ],
          status: 'active',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20')
        },
        {
          id: '2',
          name: 'Cortador de Grama Elétrico',
          description: 'Cortador de grama elétrico 1200W com cesto coletor',
          categoryId: '2',
          partnerId: partnerId || '1',
          dailyRate: 35.00,
          discountOptions: [],
          securityDeposit: 150.00,
          stockQuantity: 3,
          minStockAlert: 1,
          currentStock: 1,
          dimensions: {
            length: 120,
            width: 45,
            height: 100,
            weight: 12.5,
            lalamoveValidated: false
          },
          images: ['/images/cortador-grama.jpg'],
          returnChecklist: [
            {
              id: '1',
              description: 'Verificar lâminas',
              required: true,
              order: 1
            }
          ],
          status: 'active',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18')
        }
      ];
      
      // Mock stats
      const mockStats: EquipmentStats = {
        total: mockEquipments.length,
        active: mockEquipments.filter(e => e.status === 'active').length,
        inactive: mockEquipments.filter(e => e.status === 'inactive').length,
        maintenance: mockEquipments.filter(e => e.status === 'maintenance').length,
        lowStock: mockEquipments.filter(e => e.currentStock <= e.minStockAlert).length,
        totalValue: mockEquipments.reduce((sum, e) => sum + (e.dailyRate * 30), 0)
      };
      
      setCategories(mockCategories);
      setEquipments(mockEquipments);
      setStats(mockStats);
      setLoading(false);
    };
    
    loadData();
  }, [partnerId]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleCategoryFilter = (categoryId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      categoryId: categoryId === 'all' ? undefined : categoryId 
    }));
  };

  const handleStatusFilter = (status: Equipment['status']) => {
    setFilters(prev => ({ 
      ...prev, 
      status: status === 'all' ? undefined : status 
    }));
  };

  const filteredEquipments = equipments.filter(equipment => {
    if (filters.search && !equipment.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.categoryId && equipment.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.status && equipment.status !== filters.status) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Equipment['status']) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'maintenance': return 'Manutenção';
      default: return status;
    }
  };

  return (
    <ProtectedRoute requiredPermissions={[Permission.PRODUCTS_VIEW]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
            <p className="text-gray-600">
              {isPartnerUser ? 'Gerencie seus produtos' : 'Visualize todos os produtos'}
            </p>
          </div>
          
          <PermissionGuard permission={Permission.PRODUCTS_CREATE}>
            <Link
              href="/equipment/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Novo Produto
            </Link>
          </PermissionGuard>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total de Produtos</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Ativos</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
              <div className="text-sm text-gray-600">Em Manutenção</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
              <div className="text-sm text-gray-600">Estoque Baixo</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-purple-600">
                R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-600">Valor Total (30 dias)</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="min-w-[200px]">
              <select
                value={filters.categoryId || 'all'}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status Filter */}
            <div className="min-w-[150px]">
              <select
                value={filters.status || 'all'}
                onChange={(e) => handleStatusFilter(e.target.value as Equipment['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="maintenance">Manutenção</option>
              </select>
            </div>
          </div>
        </div>

        {/* Equipment List */}
        <div className="bg-white rounded-lg shadow border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredEquipments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">Nenhum produto encontrado</div>
              <PermissionGuard permission={Permission.PRODUCTS_CREATE}>
                <Link
                  href="/equipment/create"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Criar primeiro produto
                </Link>
              </PermissionGuard>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diária
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estoque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEquipments.map((equipment) => {
                    const category = categories.find(c => c.id === equipment.categoryId);
                    const isLowStock = equipment.currentStock <= equipment.minStockAlert;
                    
                    return (
                      <tr key={equipment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-gray-500 text-xs">IMG</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {equipment.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {equipment.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R$ {equipment.dailyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${isLowStock ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                              {equipment.currentStock}/{equipment.stockQuantity}
                            </span>
                            {isLowStock && (
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" title="Estoque baixo" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(equipment.status)}`}>
                            {getStatusLabel(equipment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/equipment/${equipment.id}`}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Ver
                            </Link>
                            <PermissionGuard permission={Permission.PRODUCTS_EDIT}>
                              <Link
                                href={`/equipment/${equipment.id}/edit`}
                                className="text-green-600 hover:text-green-700"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Link>
                            </PermissionGuard>
                            <PermissionGuard permission={Permission.PRODUCTS_DELETE}>
                              <button className="text-red-600 hover:text-red-700">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </PermissionGuard>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}