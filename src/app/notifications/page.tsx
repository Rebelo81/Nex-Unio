"use client"

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import NotificationSettings from '@/components/notifications/notification-settings'
import NotificationHistory from '@/components/notifications/notification-history'
import NotificationTemplates from '@/components/notifications/notification-templates'
import { 
  Bell, 
  Settings, 
  History, 
  FileText, 
  Mail, 
  MessageSquare, 
  Phone,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'

// Dados de exemplo para o dashboard
const dashboardStats = {
  totalSent: 1247,
  delivered: 1156,
  failed: 23,
  pending: 68,
  deliveryRate: 92.7,
  recentActivity: [
    {
      id: '1',
      type: 'email',
      event: 'Confirmação de Locação',
      recipient: 'João Silva',
      status: 'delivered',
      time: '2 min atrás'
    },
    {
      id: '2',
      type: 'whatsapp',
      event: 'Lembrete de Devolução',
      recipient: 'Maria Santos',
      status: 'sent',
      time: '5 min atrás'
    },
    {
      id: '3',
      type: 'sms',
      event: 'Pagamento Confirmado',
      recipient: 'Carlos Oliveira',
      status: 'failed',
      time: '10 min atrás'
    },
    {
      id: '4',
      type: 'email',
      event: 'Locação Finalizada',
      recipient: 'Ana Costa',
      status: 'delivered',
      time: '15 min atrás'
    }
  ]
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <Phone className="h-4 w-4" />
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'sent': return <Clock className="h-4 w-4 text-blue-500" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      delivered: 'default',
      sent: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    } as const

    const labels = {
      delivered: 'Entregue',
      sent: 'Enviado',
      failed: 'Falhou',
      pending: 'Pendente'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="text-xs">
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Sistema de Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie notificações automáticas para seus clientes
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Enviadas</p>
                    <p className="text-2xl font-bold">{dashboardStats.totalSent}</p>
                    <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
                  </div>
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Entregues</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardStats.delivered}</p>
                    <p className="text-xs text-green-600 mt-1">+12% vs mês anterior</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Falharam</p>
                    <p className="text-2xl font-bold text-red-600">{dashboardStats.failed}</p>
                    <p className="text-xs text-red-600 mt-1">-5% vs mês anterior</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Entrega</p>
                    <p className="text-2xl font-bold">{dashboardStats.deliveryRate}%</p>
                    <p className="text-xs text-green-600 mt-1">+2.3% vs mês anterior</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Atividade Recente */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>
                  Últimas notificações enviadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardStats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(activity.type)}
                        <div>
                          <p className="font-medium text-sm">{activity.event}</p>
                          <p className="text-xs text-muted-foreground">{activity.recipient}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(activity.status)}
                        {getStatusBadge(activity.status)}
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
                <CardDescription>
                  Notificações enviadas por canal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">Principal canal</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">687</p>
                      <p className="text-xs text-muted-foreground">55.1%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">WhatsApp</p>
                        <p className="text-sm text-muted-foreground">Lembretes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">423</p>
                      <p className="text-xs text-muted-foreground">33.9%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">SMS</p>
                        <p className="text-sm text-muted-foreground">Confirmações</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">137</p>
                      <p className="text-xs text-muted-foreground">11.0%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
              <CardDescription>
                Monitoramento dos serviços de notificação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Servidor de Email</p>
                      <p className="text-sm text-muted-foreground">Operacional</p>
                    </div>
                  </div>
                  <Badge variant="default">Online</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Gateway SMS</p>
                      <p className="text-sm text-muted-foreground">Operacional</p>
                    </div>
                  </div>
                  <Badge variant="default">Online</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">API WhatsApp</p>
                      <p className="text-sm text-muted-foreground">Limitado</p>
                    </div>
                  </div>
                  <Badge variant="outline">Limitado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="templates">
          <NotificationTemplates />
        </TabsContent>

        <TabsContent value="history">
          <NotificationHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}