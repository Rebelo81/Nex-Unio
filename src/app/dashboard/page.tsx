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
  Activity,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPie, Cell, BarChart, Bar } from 'recharts';

const DashboardPage: React.FC = () => {
  // Dados executivos para o dashboard
  const executiveStats = {
    totalRevenue: 2250000,
    monthlyGrowth: 18.5,
    activePartners: 127,
    totalClients: 3456,
    equipmentUtilization: 89.2,
    profitMargin: 34.7
  };

  const kpiData = [
    {
      title: 'Receita Total',
      value: formatCurrency(executiveStats.totalRevenue),
      change: +18.5,
      icon: DollarSign,
      description: 'vs. trimestre anterior',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Parceiros Ativos',
      value: executiveStats.activePartners,
      change: +12.3,
      icon: Building2,
      description: 'crescimento mensal',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Base de Clientes',
      value: executiveStats.totalClients.toLocaleString(),
      change: +24.1,
      icon: Users,
      description: 'clientes ativos',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Taxa de Utilização',
      value: `${executiveStats.equipmentUtilization}%`,
      change: +5.7,
      icon: Target,
      description: 'eficiência operacional',
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 185000, target: 180000, equipments: 145 },
    { month: 'Fev', revenue: 192000, target: 185000, equipments: 158 },
    { month: 'Mar', revenue: 208000, target: 190000, equipments: 172 },
    { month: 'Abr', revenue: 225000, target: 195000, equipments: 186 },
    { month: 'Mai', revenue: 238000, target: 200000, equipments: 194 },
    { month: 'Jun', revenue: 255000, target: 210000, equipments: 203 }
  ];

  const categoryPerformance = [
    { category: 'Construção Civil', revenue: 890000, percentage: 39.5, color: '#d4a017' },
    { category: 'Jardinagem', revenue: 520000, percentage: 23.1, color: '#22c55e' },
    { category: 'Eventos', revenue: 380000, percentage: 16.9, color: '#0ea5e9' },
    { category: 'Limpeza Industrial', revenue: 280000, percentage: 12.4, color: '#8b5cf6' },
    { category: 'Outros', revenue: 180000, percentage: 8.0, color: '#737373' }
  ];

  const topPartners = [
    { name: 'Construtora Prime', revenue: 125000, growth: 25.4, trend: 'up' },
    { name: 'Jardins Executivos', revenue: 98500, growth: 18.7, trend: 'up' },
    { name: 'Eventos Elite', revenue: 87200, growth: -5.2, trend: 'down' },
    { name: 'Industrial Clean', revenue: 76800, growth: 32.1, trend: 'up' },
    { name: 'Obras & Cia', revenue: 65300, growth: 12.8, trend: 'up' }
  ];

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#000000' }}>
      {/* Executive Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#d4a017' }}>
              Dashboard Executivo
            </h1>
            <p className="text-lg" style={{ color: '#b8941a' }}>
              Pro Rentals - Visão Estratégica do Negócio
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="px-4 py-2 text-sm font-semibold bg-green-900 border-green-700" style={{ color: '#22c55e' }}>
              Sistema Online
            </Badge>
            <div className="text-right">
              <p className="text-sm font-medium" style={{ color: '#996f1a' }}>Última atualização</p>
              <p className="text-sm" style={{ color: '#b8941a' }}>{new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="border border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300" style={{ backgroundColor: '#0a0a0a' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${kpi.gradient} shadow-lg`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  {kpi.change > 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-400" />
                  )}
                  <span className={`text-sm font-bold ${kpi.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Math.abs(kpi.change)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#996f1a' }}>{kpi.title}</p>
                <p className="text-2xl font-bold mb-1" style={{ color: '#d4a017' }}>{kpi.value}</p>
                <p className="text-xs" style={{ color: '#7a6f1a' }}>{kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card className="border border-gray-800 shadow-xl" style={{ backgroundColor: '#0a0a0a' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" style={{ color: '#d4a017' }}>
              <BarChart3 className="h-5 w-5" />
              <span>Performance de Receita</span>
            </CardTitle>
            <CardDescription style={{ color: '#b8941a' }}>
              Análise mensal vs metas estabelecidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#d4a017' }}
                  axisLine={{ stroke: '#d4a017' }}
                />
                <YAxis 
                  tick={{ fill: '#d4a017' }}
                  axisLine={{ stroke: '#d4a017' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #d4a017',
                    borderRadius: '8px',
                    color: '#d4a017'
                  }}
                  formatter={(value, name) => [
                    `${formatCurrency(Number(value))}`,
                    name === 'revenue' ? 'Receita' : 'Meta'
                  ]}
                />
                <Bar dataKey="revenue" fill="#d4a017" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="#996f1a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card className="border border-gray-800 shadow-xl" style={{ backgroundColor: '#0a0a0a' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" style={{ color: '#d4a017' }}>
              <PieChart className="h-5 w-5" />
              <span>Performance por Categoria</span>
            </CardTitle>
            <CardDescription style={{ color: '#b8941a' }}>
              Distribuição de receita por segmento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryPerformance.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-800" style={{ backgroundColor: '#1a1a1a' }}>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div>
                      <p className="font-medium" style={{ color: '#d4a017' }}>{category.category}</p>
                      <p className="text-sm" style={{ color: '#996f1a' }}>{category.percentage}% do total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: '#d4a017' }}>{formatCurrency(category.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Partners */}
      <Card className="border border-gray-800 shadow-xl" style={{ backgroundColor: '#0a0a0a' }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2" style={{ color: '#d4a017' }}>
            <Building2 className="h-5 w-5" />
            <span>Top Parceiros de Performance</span>
          </CardTitle>
          <CardDescription style={{ color: '#b8941a' }}>
            Ranking dos principais geradores de receita
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPartners.map((partner, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-500 font-bold text-black">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#d4a017' }}>{partner.name}</p>
                    <p className="text-sm" style={{ color: '#996f1a' }}>Receita mensal</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="font-bold" style={{ color: '#d4a017' }}>{formatCurrency(partner.revenue)}</p>
                    <div className="flex items-center space-x-1">
                      {partner.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-400" />
                      )}
                      <span className={`text-sm font-medium ${partner.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.abs(partner.growth)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;