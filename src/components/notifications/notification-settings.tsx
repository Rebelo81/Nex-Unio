"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Phone, 
  Settings, 
  Clock, 
  Users, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Send
} from 'lucide-react'

interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms' | 'whatsapp'
  event: string
  subject?: string
  message: string
  enabled: boolean
  variables: string[]
  createdAt: string
  updatedAt: string
}

interface NotificationEvent {
  id: string
  name: string
  description: string
  category: 'rental' | 'payment' | 'maintenance' | 'customer'
  variables: string[]
}

const notificationEvents: NotificationEvent[] = [
  {
    id: 'rental_created',
    name: 'Locação Criada',
    description: 'Quando uma nova locação é criada',
    category: 'rental',
    variables: ['customer_name', 'equipment_name', 'rental_date', 'return_date', 'total_amount']
  },
  {
    id: 'rental_confirmed',
    name: 'Locação Confirmada',
    description: 'Quando uma locação é confirmada',
    category: 'rental',
    variables: ['customer_name', 'equipment_name', 'rental_date', 'pickup_address']
  },
  {
    id: 'rental_reminder',
    name: 'Lembrete de Locação',
    description: 'Lembrete enviado antes da data de locação',
    category: 'rental',
    variables: ['customer_name', 'equipment_name', 'rental_date', 'pickup_time']
  },
  {
    id: 'return_reminder',
    name: 'Lembrete de Devolução',
    description: 'Lembrete enviado antes da data de devolução',
    category: 'rental',
    variables: ['customer_name', 'equipment_name', 'return_date', 'return_address']
  },
  {
    id: 'payment_received',
    name: 'Pagamento Recebido',
    description: 'Quando um pagamento é confirmado',
    category: 'payment',
    variables: ['customer_name', 'amount', 'payment_method', 'rental_id']
  },
  {
    id: 'payment_overdue',
    name: 'Pagamento em Atraso',
    description: 'Quando um pagamento está em atraso',
    category: 'payment',
    variables: ['customer_name', 'amount', 'due_date', 'days_overdue']
  },
  {
    id: 'maintenance_scheduled',
    name: 'Manutenção Agendada',
    description: 'Quando uma manutenção é agendada',
    category: 'maintenance',
    variables: ['equipment_name', 'maintenance_date', 'technician_name', 'description']
  },
  {
    id: 'customer_birthday',
    name: 'Aniversário do Cliente',
    description: 'No aniversário do cliente',
    category: 'customer',
    variables: ['customer_name', 'birthday_date', 'discount_code']
  }
]

const defaultTemplates: Partial<NotificationTemplate>[] = [
  {
    name: 'Confirmação de Locação - Email',
    type: 'email',
    event: 'rental_confirmed',
    subject: 'Locação Confirmada - {{equipment_name}}',
    message: `Olá {{customer_name}},\n\nSua locação foi confirmada!\n\nDetalhes:\n- Equipamento: {{equipment_name}}\n- Data: {{rental_date}}\n- Local de retirada: {{pickup_address}}\n\nObrigado por escolher nossos serviços!`,
    enabled: true
  },
  {
    name: 'Lembrete de Devolução - WhatsApp',
    type: 'whatsapp',
    event: 'return_reminder',
    message: `Olá {{customer_name}}! 👋\n\nLembramos que o equipamento {{equipment_name}} deve ser devolvido em {{return_date}}.\n\nLocal: {{return_address}}\n\nQualquer dúvida, entre em contato conosco!`,
    enabled: true
  },
  {
    name: 'Pagamento Confirmado - SMS',
    type: 'sms',
    event: 'payment_received',
    message: `Pagamento de R$ {{amount}} confirmado para a locação {{rental_id}}. Obrigado {{customer_name}}!`,
    enabled: true
  }
]

export default function NotificationSettings() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'whatsapp',
    event: '',
    subject: '',
    message: '',
    enabled: true
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      // Simular carregamento de templates
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockTemplates: NotificationTemplate[] = defaultTemplates.map((template, index) => ({
        id: `template_${index + 1}`,
        ...template,
        variables: notificationEvents.find(e => e.id === template.event)?.variables || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })) as NotificationTemplate[]
      
      setTemplates(mockTemplates)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar templates de notificação',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setFormData({
      name: '',
      type: 'email',
      event: '',
      subject: '',
      message: '',
      enabled: true
    })
    setIsCreating(true)
    setIsEditing(false)
    setSelectedTemplate(null)
  }

  const handleEditTemplate = (template: NotificationTemplate) => {
    setFormData({
      name: template.name,
      type: template.type,
      event: template.event,
      subject: template.subject || '',
      message: template.message,
      enabled: template.enabled
    })
    setSelectedTemplate(template)
    setIsEditing(true)
    setIsCreating(false)
  }

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.event || !formData.message) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const eventData = notificationEvents.find(e => e.id === formData.event)
      
      if (isCreating) {
        const newTemplate: NotificationTemplate = {
          id: `template_${Date.now()}`,
          ...formData,
          variables: eventData?.variables || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setTemplates(prev => [...prev, newTemplate])
        toast({
          title: 'Sucesso',
          description: 'Template criado com sucesso'
        })
      } else if (selectedTemplate) {
        const updatedTemplate: NotificationTemplate = {
          ...selectedTemplate,
          ...formData,
          variables: eventData?.variables || [],
          updatedAt: new Date().toISOString()
        }
        setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t))
        toast({
          title: 'Sucesso',
          description: 'Template atualizado com sucesso'
        })
      }
      
      setIsCreating(false)
      setIsEditing(false)
      setSelectedTemplate(null)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar template',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return
    
    setLoading(true)
    try {
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      toast({
        title: 'Sucesso',
        description: 'Template excluído com sucesso'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir template',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTemplate = async (templateId: string, enabled: boolean) => {
    setLoading(true)
    try {
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...t, enabled, updatedAt: new Date().toISOString() } : t
      ))
      toast({
        title: 'Sucesso',
        description: `Template ${enabled ? 'ativado' : 'desativado'} com sucesso`
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar template',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestNotification = async (template: NotificationTemplate) => {
    setLoading(true)
    try {
      // Simular envio de notificação de teste
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({
        title: 'Teste Enviado',
        description: `Notificação de teste enviada via ${template.type.toUpperCase()}`
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar notificação de teste',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <Phone className="h-4 w-4" />
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rental': return <Calendar className="h-4 w-4" />
      case 'payment': return <CheckCircle className="h-4 w-4" />
      case 'maintenance': return <Settings className="h-4 w-4" />
      case 'customer': return <Users className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const selectedEvent = notificationEvents.find(e => e.id === formData.event)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notificações Automáticas</h1>
          <p className="text-muted-foreground">
            Configure notificações automáticas para manter seus clientes informados
          </p>
        </div>
        <Button onClick={handleCreateTemplate} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {(isCreating || isEditing) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isCreating ? 'Criar Novo Template' : 'Editar Template'}
                </CardTitle>
                <CardDescription>
                  Configure o template de notificação para um evento específico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Template *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Confirmação de Locação"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Notificação *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'email' | 'sms' | 'whatsapp') => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="sms">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            SMS
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event">Evento *</Label>
                  <Select
                    value={formData.event}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, event: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(event.category)}
                            <div>
                              <div className="font-medium">{event.name}</div>
                              <div className="text-sm text-muted-foreground">{event.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto do Email</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Ex: Confirmação de Locação - {{equipment_name}}"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Digite a mensagem da notificação..."
                    rows={6}
                  />
                </div>

                {selectedEvent && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Variáveis disponíveis:</strong> {selectedEvent.variables.map(v => `{{${v}}}`).join(', ')}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="enabled">Template ativo</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveTemplate} disabled={loading}>
                    {loading ? 'Salvando...' : (isCreating ? 'Criar Template' : 'Salvar Alterações')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false)
                      setIsEditing(false)
                      setSelectedTemplate(null)
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {templates.map((template) => {
              const event = notificationEvents.find(e => e.id === template.event)
              return (
                <Card key={template.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant={template.enabled ? 'default' : 'secondary'}>
                            {template.enabled ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(template.type)}
                            {template.type.toUpperCase()}
                          </div>
                          {event && (
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(event.category)}
                              {event.name}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={template.enabled}
                          onCheckedChange={(checked) => handleToggleTemplate(template.id, checked)}
                          disabled={loading}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestNotification(template)}
                          disabled={loading}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {templates.length === 0 && !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum template configurado</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie seu primeiro template de notificação para começar a enviar mensagens automáticas
                  </p>
                  <Button onClick={handleCreateTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Disponíveis</CardTitle>
              <CardDescription>
                Lista de eventos do sistema que podem disparar notificações automáticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {notificationEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-md">
                        {getCategoryIcon(event.category)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{event.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {event.variables.map((variable) => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificação</CardTitle>
              <CardDescription>
                Configure as preferências gerais do sistema de notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificações por Email</h4>
                    <p className="text-sm text-muted-foreground">Enviar notificações via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificações por SMS</h4>
                    <p className="text-sm text-muted-foreground">Enviar notificações via SMS</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificações por WhatsApp</h4>
                    <p className="text-sm text-muted-foreground">Enviar notificações via WhatsApp</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Horário de Envio</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Das</Label>
                      <Input type="time" defaultValue="08:00" />
                    </div>
                    <div>
                      <Label className="text-sm">Até</Label>
                      <Input type="time" defaultValue="18:00" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Notificações só serão enviadas dentro deste horário
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Limite de Tentativas</Label>
                  <Select defaultValue="3">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 tentativa</SelectItem>
                      <SelectItem value="2">2 tentativas</SelectItem>
                      <SelectItem value="3">3 tentativas</SelectItem>
                      <SelectItem value="5">5 tentativas</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Número máximo de tentativas de envio em caso de falha
                  </p>
                </div>
              </div>
              
              <Button>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}