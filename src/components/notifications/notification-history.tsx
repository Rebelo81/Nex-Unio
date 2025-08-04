"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Calendar
} from 'lucide-react'

interface NotificationLog {
  id: string
  templateId: string
  templateName: string
  type: 'email' | 'sms' | 'whatsapp'
  event: string
  recipient: {
    name: string
    email?: string
    phone?: string
  }
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  subject?: string
  message: string
  sentAt: string
  deliveredAt?: string
  failureReason?: string
  retryCount: number
  metadata: {
    customerId?: string
    rentalId?: string
    paymentId?: string
  }
}

const mockNotificationLogs: NotificationLog[] = [
  {
    id: 'log_1',
    templateId: 'template_1',
    templateName: 'Confirmação de Locação - Email',
    type: 'email',
    event: 'rental_confirmed',
    recipient: {
      name: 'João Silva',
      email: 'joao@email.com'
    },
    status: 'delivered',
    subject: 'Locação Confirmada - Furadeira Elétrica',
    message: 'Olá João Silva, sua locação foi confirmada!',
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000).toISOString(),
    retryCount: 0,
    metadata: {
      customerId: 'customer_1',
      rentalId: 'rental_1'
    }
  },
  {
    id: 'log_2',
    templateId: 'template_2',
    templateName: 'Lembrete de Devolução - WhatsApp',
    type: 'whatsapp',
    event: 'return_reminder',
    recipient: {
      name: 'Maria Santos',
      phone: '+5511999999999'
    },
    status: 'sent',
    message: 'Olá Maria Santos! Lembramos que o equipamento deve ser devolvido amanhã.',
    sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    retryCount: 0,
    metadata: {
      customerId: 'customer_2',
      rentalId: 'rental_2'
    }
  },
  {
    id: 'log_3',
    templateId: 'template_3',
    templateName: 'Pagamento Confirmado - SMS',
    type: 'sms',
    event: 'payment_received',
    recipient: {
      name: 'Carlos Oliveira',
      phone: '+5511888888888'
    },
    status: 'failed',
    message: 'Pagamento de R$ 150,00 confirmado para a locação #123.',
    sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    failureReason: 'Número de telefone inválido',
    retryCount: 2,
    metadata: {
      customerId: 'customer_3',
      paymentId: 'payment_1'
    }
  },
  {
    id: 'log_4',
    templateId: 'template_1',
    templateName: 'Confirmação de Locação - Email',
    type: 'email',
    event: 'rental_confirmed',
    recipient: {
      name: 'Ana Costa',
      email: 'ana@email.com'
    },
    status: 'pending',
    subject: 'Locação Confirmada - Betoneira',
    message: 'Olá Ana Costa, sua locação foi confirmada!',
    sentAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    retryCount: 1,
    metadata: {
      customerId: 'customer_4',
      rentalId: 'rental_3'
    }
  }
]

export default function NotificationHistory() {
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<NotificationLog[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null)
  const { toast } = useToast()

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    loadNotificationLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, filters])

  const loadNotificationLogs = async () => {
    setLoading(true)
    try {
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLogs(mockNotificationLogs)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar histórico de notificações',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    // Filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(log => 
        log.recipient.name.toLowerCase().includes(searchLower) ||
        log.templateName.toLowerCase().includes(searchLower) ||
        log.message.toLowerCase().includes(searchLower) ||
        (log.recipient.email && log.recipient.email.toLowerCase().includes(searchLower)) ||
        (log.recipient.phone && log.recipient.phone.includes(searchLower))
      )
    }

    // Filtro de tipo
    if (filters.type !== 'all') {
      filtered = filtered.filter(log => log.type === filters.type)
    }

    // Filtro de status
    if (filters.status !== 'all') {
      filtered = filtered.filter(log => log.status === filters.status)
    }

    // Filtro de data
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(log => new Date(log.sentAt) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(log => new Date(log.sentAt) <= toDate)
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())

    setFilteredLogs(filtered)
  }

  const handleRetryNotification = async (logId: string) => {
    setLoading(true)
    try {
      // Simular reenvio
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setLogs(prev => prev.map(log => 
        log.id === logId 
          ? { ...log, status: 'sent' as const, retryCount: log.retryCount + 1, sentAt: new Date().toISOString() }
          : log
      ))
      
      toast({
        title: 'Sucesso',
        description: 'Notificação reenviada com sucesso'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao reenviar notificação',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ['Data/Hora', 'Template', 'Tipo', 'Destinatário', 'Status', 'Evento'].join(','),
      ...filteredLogs.map(log => [
        formatDateTime(log.sentAt),
        log.templateName,
        log.type.toUpperCase(),
        log.recipient.name,
        log.status,
        log.event
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `notificacoes_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'sent': return <Clock className="h-4 w-4 text-blue-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
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
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <Phone className="h-4 w-4" />
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Notificações</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as notificações enviadas aos seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={loadNotificationLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, email, telefone..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Enviadas</p>
                <p className="text-2xl font-bold">{filteredLogs.length}</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entregues</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredLogs.filter(log => log.status === 'delivered').length}
                </p>
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
                <p className="text-2xl font-bold text-red-600">
                  {filteredLogs.filter(log => log.status === 'failed').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">
                  {filteredLogs.length > 0 
                    ? Math.round((filteredLogs.filter(log => log.status === 'delivered').length / filteredLogs.length) * 100)
                    : 0}%
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações Enviadas</CardTitle>
          <CardDescription>
            {filteredLogs.length} de {logs.length} notificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {formatDateTime(log.sentAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.templateName}</div>
                    <div className="text-sm text-muted-foreground">{log.event}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(log.type)}
                      {log.type.toUpperCase()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.recipient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.recipient.email || log.recipient.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                    {log.failureReason && (
                      <div className="text-xs text-red-500 mt-1">
                        {log.failureReason}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {log.retryCount + 1}x
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Notificação</DialogTitle>
                            <DialogDescription>
                              Informações completas sobre a notificação enviada
                            </DialogDescription>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Template</Label>
                                  <p className="text-sm">{selectedLog.templateName}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Tipo</Label>
                                  <div className="flex items-center gap-2">
                                    {getTypeIcon(selectedLog.type)}
                                    {selectedLog.type.toUpperCase()}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Destinatário</Label>
                                  <p className="text-sm">{selectedLog.recipient.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {selectedLog.recipient.email || selectedLog.recipient.phone}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(selectedLog.status)}
                                    {getStatusBadge(selectedLog.status)}
                                  </div>
                                </div>
                              </div>
                              
                              {selectedLog.subject && (
                                <div>
                                  <Label className="text-sm font-medium">Assunto</Label>
                                  <p className="text-sm">{selectedLog.subject}</p>
                                </div>
                              )}
                              
                              <div>
                                <Label className="text-sm font-medium">Mensagem</Label>
                                <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                                  {selectedLog.message}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label className="text-sm font-medium">Enviado em</Label>
                                  <p>{formatDateTime(selectedLog.sentAt)}</p>
                                </div>
                                {selectedLog.deliveredAt && (
                                  <div>
                                    <Label className="text-sm font-medium">Entregue em</Label>
                                    <p>{formatDateTime(selectedLog.deliveredAt)}</p>
                                  </div>
                                )}
                              </div>
                              
                              {selectedLog.failureReason && (
                                <div>
                                  <Label className="text-sm font-medium text-red-600">Motivo da Falha</Label>
                                  <p className="text-sm text-red-600">{selectedLog.failureReason}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {log.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryNotification(log.id)}
                          disabled={loading}
                        >
                          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredLogs.length === 0 && !loading && (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma notificação encontrada</h3>
              <p className="text-muted-foreground">
                {filters.search || filters.type !== 'all' || filters.status !== 'all' || filters.dateFrom || filters.dateTo
                  ? 'Tente ajustar os filtros para ver mais resultados'
                  : 'Ainda não há notificações enviadas'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}