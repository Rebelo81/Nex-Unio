'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  Package, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const DashboardPage: React.FC = () => {
  // Dados simulados para o dashboard
  const stats = {
    totalPartners: 45,
    totalClients: 1234,
    totalEquipment: 567,
    activeRentals: 89,
    monthlyRevenue: 125000,
    revenueGrowth: 12.5,
    equipmentUtilization: 78.5,
    utilizationGrowth: -2.3
  };

  const revenueData = [
    { month: 'Jan', revenue: 85000, rentals: 65 },
    { month: 'Fev', revenue: 92000, rentals: 72 },
    { month: 'Mar', revenue: 98000, rentals: 78 },
    { month: 'Abr', revenue: 105000, rentals: 82 },
    { month: 'Mai', revenue: 118000, rentals: 89 },
    { month: 'Jun', revenue: 125000, rentals: 95 }
  ];

  const equipmentData = [
    { category: 'Construção', count: 180, color: '#f97316' }, // Primary orange
    { category: 'Jardinagem', count: 120, color: '#22c55e' }, // Success green
    { category: 'Limpeza', count: 95, color: '#0ea5e9' }, // Secondary blue
    { category: 'Eventos', count: 85, color: '#8b5cf6' }, // Purple for events
    { category: 'Outros', count: 87, color: '#737373' } // Neutral gray
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'rental',
      description: 'Nova locação criada - Betoneira 400L',
      user: 'João Silva',
      time: '2 min atrás',
      status: 'success'
    },
    {
      id: 2,
      type: 'payment',
      description: 'Pagamento recebido - R$ 450,00',
      user: 'Maria Santos',
      time: '15 min atrás',
      status: 'success'
    },
    {
      id: 3,
      type: 'equipment',
      description: 'Equipamento retornado com avaria',
      user: 'Pedro Costa',
      time: '1h atrás',
      status: 'warning'
    },
    {
      id: 4,
      type: 'partner',
      description: 'Novo parceiro cadastrado',
      user: 'Ana Oliveira',
      time: '2h atrás',
      status: 'info'
    }
  ];

  const topPartners = [
    { name: 'Construções ABC', revenue: 25000, growth: 15.2 },
    { name: 'Jardins & Cia', revenue: 18500, growth: 8.7 },
    { name: 'Eventos Premium', revenue: 16200, growth: -3.1 },
    { name: 'Limpeza Total', revenue: 14800, growth: 22.4 },
    { name: 'Obras Express', revenue: 12300, growth: 5.9 }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'rental': return <Calendar className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'equipment': return <Package className="h-4 w-4" />;
      case 'partner': return <Building2 className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-success-600 bg-success-100';
      case 'warning': return 'text-warning-600 bg-warning-100';
      case 'error': return 'text-destructive-600 bg-destructive-100';
      case 'info': return 'text-primary-600 bg-primary-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-2">
          Visão geral do marketplace de locação de equipamentos
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total de Parceiros</p>
                <p className="text-3xl font-bold text-neutral-900">{stats.totalPartners}</p>
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total de Clientes</p>
                <p className="text-3xl font-bold text-neutral-900">{stats.totalClients.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-success-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Equipamentos</p>
                <p className="text-3xl font-bold text-neutral-900">{stats.totalEquipment}</p>
              </div>
              <div className="h-12 w-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Aluguéis Ativos</p>
                <p className="text-3xl font-bold text-neutral-900">{stats.activeRentals}</p>
              </div>
              <div className="h-12 w-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-secondary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-neutral-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.monthlyRevenue)}</p>
              </div>
              <div className={`flex items-center space-x-1 ${stats.revenueGrowth > 0 ? 'text-success-600' : 'text-destructive-600'}`}>
                {stats.revenueGrowth > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">{Math.abs(stats.revenueGrowth)}%</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500">vs. mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-neutral-600">Taxa de Utilização</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.equipmentUtilization}%</p>
              </div>
              <div className={`flex items-center space-x-1 ${stats.utilizationGrowth > 0 ? 'text-success-600' : 'text-destructive-600'}`}>
                {stats.utilizationGrowth > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">{Math.abs(stats.utilizationGrowth)}%</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500">dos equipamentos em uso</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de receita */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Evolução da receita nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Receita']} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de equipamentos por categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Equipamentos por Categoria</CardTitle>
            <CardDescription>Distribuição do inventário</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={equipmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#f97316"
                  dataKey="count"
                  label={({ category, count }) => `${category}: ${count}`}
                >
                  {equipmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Atividades recentes e top parceiros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{activity.description}</p>
                    <p className="text-xs text-neutral-500">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top parceiros */}
        <Card>
          <CardHeader>
            <CardTitle>Top Parceiros</CardTitle>
            <CardDescription>Parceiros com maior receita este mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPartners.map((partner, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-neutral-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-neutral-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{partner.name}</p>
                      <p className="text-xs text-neutral-500">{formatCurrency(partner.revenue)}</p>
                    </div>
                  </div>
                  <Badge variant={partner.growth > 0 ? 'success' : 'destructive'}>
                    {partner.growth > 0 ? '+' : ''}{partner.growth}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;