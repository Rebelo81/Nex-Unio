"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Save,
  Mail, 
  MessageSquare, 
  Phone,
  Settings,
  Code,
  TestTube,
  Send,
  AlertCircle
} from 'lucide-react'

interface NotificationTemplate {
  id: string
  name: string
  description: string
  type: 'email' | 'sms' | 'whatsapp'
  event: string
  subject?: string
  content: string
  variables: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TemplateVariable {
  name: string
  description: string
  example: string
}

const availableVariables: TemplateVariable[] = [
  { name: '{{customer_name}}', description: 'Nome do cliente', example: 'João Silva' },
  { name: '{{customer_email}}', description: 'Email do cliente', example: 'joao@email.com' },
  { name: '{{customer_phone}}', description: 'Telefone do cliente', example: '(11) 99999-9999' },
  { name: '{{equipment_name}}', description: 'Nome do equipamento', example: 'Furadeira Elétrica' },
  { name: '{{rental_id}}', description: 'ID da locação', example: '#12345' },
  { name: '{{rental_start_date}}', description: 'Data de início da locação', example: '15/01/2024' },
  { name: '{{rental_end_date}}', description: 'Data de fim da locação', example: '20/01/2024' },
  { name: '{{rental_total}}', description: 'Valor total da locação', example: 'R$ 150,00' },
  { name: '{{payment_amount}}', description: 'Valor do pagamento', example: 'R$ 75,00' },
  { name: '{{payment_due_date}}', description: 'Data de vencimento', example: '25/01/2024' },
  { name: '{{company_name}}', description: 'Nome da empresa', example: 'Pro Rentals' },
  { name: '{{company_phone}}', description: 'Telefone da empresa', example: '(11) 3333-3333' },
  { name: '{{company_address}}', description: 'Endereço da empresa', example: 'Rua das Flores, 123' }
]

const eventOptions = [
  { value: 'rental_confirmed', label: 'Locação Confirmada' },
  { value: 'rental_started', label: 'Locação Iniciada' },
  { value: 'return_reminder', label: 'Lembrete de Devolução' },
  { value: 'rental_completed', label: 'Locação Finalizada' },
  { value: 'payment_received', label: 'Pagamento Recebido' },
  { value: 'payment_overdue', label: 'Pagamento em Atraso' },
  { value: 'equipment_maintenance', label: 'Manutenção de Equipamento' },
  { value: 'customer_birthday', label: 'Aniversário do Cliente' }
]

const mockTemplates: NotificationTemplate[] = [
  {
    id: 'template_1',
    name: 'Confirmação de Locação - Email',
    description: 'Email enviado quando uma locação é confirmada',
    type: 'email',
    event: 'rental_confirmed',
    subject: 'Locação Confirmada - {{equipment_name}}',
    content: `Olá {{customer_name}},\n\nSua locação foi confirmada com sucesso!\n\nDetalhes da locação:\n- Equipamento: {{equipment_name}}\n- Período: {{rental_start_date}} até {{rental_end_date}}\n- Valor total: {{rental_total}}\n\nEm caso de dúvidas, entre em contato conosco pelo telefone {{company_phone}}.\n\nAtenciosamente,\n{{company_name}}`,
    variables: ['{{customer_name}}', '{{equipment_name}}', '{{rental_start_date}}', '{{rental_end_date}}', '{{rental_total}}', '{{company_phone}}', '{{company_name}}'],
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'template_2',
    name: 'Lembrete de Devolução - WhatsApp',
    description: 'Mensagem de WhatsApp para lembrar da devolução',
    type: 'whatsapp',
    event: 'return_reminder',
    content: `🔔 *Lembrete de Devolução*\n\nOlá {{customer_name}}!\n\nLembramos que o equipamento *{{equipment_name}}* deve ser devolvido até {{rental_end_date}}.\n\nLocal de devolução: {{company_address}}\n\nDúvidas? Entre em contato: {{company_phone}}`,
    variables: ['{{customer_name}}', '{{equipment_name}}', '{{rental_end_date}}', '{{company_address}}', '{{company_phone}}'],
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'template_3',
    name: 'Pagamento Confirmado - SMS',
    description: 'SMS de confirmação de pagamento',
    type: 'sms',
    event: 'payment_received',
    content: `{{company_name}}: Pagamento de {{payment_amount}} confirmado para a locação {{rental_id}}. Obrigado!`,
    variables: ['{{company_name}}', '{{payment_amount}}', '{{rental_id}}'],
    isActive: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testData, setTestData] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<Partial<NotificationTemplate>>({
    name: '',
    description: '',
    type: 'email',
    event: '',
    subject: '',
    content: '',
    isActive: true
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTemplates(mockTemplates)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar templates',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.content || !formData.event) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const templateData: NotificationTemplate = {
        id: isCreating ? `template_${Date.now()}` : selectedTemplate!.id,
        name: formData.name!,
        description: formData.description!,
        type: formData.type!,
        event: formData.event!,
        subject: formData.subject,
        content: formData.content!,
        variables: extractVariables(formData.content!),
        isActive: formData.isActive!,
        createdAt: isCreating ? new Date().toISOString() : selectedTemplate!.createdAt,
        updatedAt: new Date().toISOString()
      }

      if (isCreating) {
        setTemplates(prev => [...prev, templateData])
        toast({
          title: 'Sucesso',
          description: 'Template criado com sucesso'
        })
      } else {
        setTemplates(prev => prev.map(t => t.id === templateData.id ? templateData : t))
        toast({
          title: 'Sucesso',
          description: 'Template atualizado com sucesso'
        })
      }

      resetForm()
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

  const handleDuplicateTemplate = (template: NotificationTemplate) => {
    const duplicated: NotificationTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setTemplates(prev => [...prev, duplicated])
    toast({
      title: 'Sucesso',
      description: 'Template duplicado com sucesso'
    })
  }

  const handleTestTemplate = async () => {
    if (!selectedTemplate) return

    setLoading(true)
    try {
      // Simular envio de teste
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Teste Enviado',
        description: 'Template de teste enviado com sucesso'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar teste',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const extractVariables = (content: string): string[] => {
    const regex = /{{([^}]+)}}/g
    const matches = content.match(regex) || []
    return [...new Set(matches)]
  }

  const renderPreview = (content: string, variables: Record<string, string> = {}) => {
    let preview = content
    
    // Substituir variáveis pelos valores de teste
    Object.entries(variables).forEach(([key, value]) => {
      const variable = `{{${key}}}`
      preview = preview.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
    })
    
    // Substituir variáveis restantes por valores de exemplo
    availableVariables.forEach(({ name, example }) => {
      preview = preview.replace(new RegExp(name.replace(/[{}]/g, '\\$&'), 'g'), example)
    })
    
    return preview
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'email',
      event: '',
      subject: '',
      content: '',
      isActive: true
    })
    setSelectedTemplate(null)
    setIsEditing(false)
    setIsCreating(false)
    setTestData({})
  }

  const startEdit = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setFormData(template)
    setIsEditing(true)
    setIsCreating(false)
  }

  const startCreate = () => {
    resetForm()
    setIsCreating(true)
    setIsEditing(true)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <Phone className="h-4 w-4" />
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  const getEventLabel = (event: string) => {
    return eventOptions.find(opt => opt.value === event)?.label || event
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Notificação</h1>
          <p className="text-muted-foreground">
            Crie e gerencie templates personalizados para suas notificações
          </p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Templates */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates ({templates.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(template.type)}
                        <span className="font-medium text-sm">{template.name}</span>
                        {!template.isActive && (
                          <Badge variant="secondary" className="text-xs">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getEventLabel(template.event)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              
              {templates.length === 0 && (
                <div className="text-center py-8">
                  <Settings className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum template criado ainda
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Editor/Visualizador */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isCreating ? 'Criar Novo Template' : 'Editar Template'}
                </CardTitle>
                <CardDescription>
                  Configure as informações do template de notificação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="config" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="config">Configuração</TabsTrigger>
                    <TabsTrigger value="content">Conteúdo</TabsTrigger>
                    <TabsTrigger value="preview">Visualização</TabsTrigger>
                  </TabsList>

                  <TabsContent value="config" className="space-y-4">
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
                        <Label htmlFor="type">Tipo *</Label>
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
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
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
                            {eventOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="isActive">Template ativo</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva quando este template será usado"
                        rows={2}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4">
                    {formData.type === 'email' && (
                      <div className="space-y-2">
                        <Label htmlFor="subject">Assunto do Email</Label>
                        <Input
                          id="subject"
                          value={formData.subject || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Ex: Locação Confirmada - {{equipment_name}}"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="content">Conteúdo da Mensagem *</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Digite o conteúdo da mensagem..."
                        rows={10}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Variáveis Disponíveis</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {availableVariables.map((variable) => (
                          <div
                            key={variable.name}
                            className="p-2 border rounded cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => {
                              const textarea = document.getElementById('content') as HTMLTextAreaElement
                              if (textarea) {
                                const start = textarea.selectionStart
                                const end = textarea.selectionEnd
                                const newContent = formData.content!.substring(0, start) + variable.name + formData.content!.substring(end)
                                setFormData(prev => ({ ...prev, content: newContent }))
                                
                                // Restaurar posição do cursor
                                setTimeout(() => {
                                  textarea.focus()
                                  textarea.setSelectionRange(start + variable.name.length, start + variable.name.length)
                                }, 0)
                              }
                            }}
                          >
                            <div className="font-mono text-sm text-primary">{variable.name}</div>
                            <div className="text-xs text-muted-foreground">{variable.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Visualização com dados de exemplo
                        </span>
                      </div>
                      
                      {formData.type === 'email' && formData.subject && (
                        <div className="space-y-2">
                          <Label>Assunto:</Label>
                          <div className="p-3 bg-muted rounded-md font-medium">
                            {renderPreview(formData.subject)}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Conteúdo:</Label>
                        <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                          {renderPreview(formData.content || '')}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Variáveis Detectadas:</Label>
                        <div className="flex flex-wrap gap-2">
                          {extractVariables(formData.content || '').map((variable) => (
                            <Badge key={variable} variant="outline">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveTemplate} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isCreating ? 'Criar Template' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getTypeIcon(selectedTemplate.type)}
                      {selectedTemplate.name}
                      {!selectedTemplate.isActive && (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDuplicateTemplate(selectedTemplate)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => startEdit(selectedTemplate)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="preview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="preview">Visualização</TabsTrigger>
                    <TabsTrigger value="code">Código</TabsTrigger>
                    <TabsTrigger value="test">Teste</TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>Tipo:</Label>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(selectedTemplate.type)}
                            {selectedTemplate.type.toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <Label>Evento:</Label>
                          <p>{getEventLabel(selectedTemplate.event)}</p>
                        </div>
                      </div>
                      
                      {selectedTemplate.subject && (
                        <div className="space-y-2">
                          <Label>Assunto:</Label>
                          <div className="p-3 bg-muted rounded-md font-medium">
                            {renderPreview(selectedTemplate.subject)}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Conteúdo:</Label>
                        <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                          {renderPreview(selectedTemplate.content)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Variáveis Utilizadas:</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.variables.map((variable) => (
                            <Badge key={variable} variant="outline">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="space-y-4">
                    {selectedTemplate.subject && (
                      <div className="space-y-2">
                        <Label>Assunto:</Label>
                        <div className="p-3 bg-muted rounded-md font-mono text-sm">
                          {selectedTemplate.subject}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label>Conteúdo:</Label>
                      <div className="p-4 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap">
                        {selectedTemplate.content}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="test" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Dados de Teste</Label>
                        <p className="text-sm text-muted-foreground">
                          Configure valores personalizados para testar o template
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedTemplate.variables.map((variable) => {
                          const varName = variable.replace(/[{}]/g, '')
                          const varInfo = availableVariables.find(v => v.name === variable)
                          
                          return (
                            <div key={variable} className="space-y-2">
                              <Label htmlFor={varName}>{variable}</Label>
                              <Input
                                id={varName}
                                value={testData[varName] || ''}
                                onChange={(e) => setTestData(prev => ({ ...prev, [varName]: e.target.value }))}
                                placeholder={varInfo?.example || 'Valor de teste'}
                              />
                            </div>
                          )
                        })}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Visualização do Teste:</Label>
                        <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                          {renderPreview(selectedTemplate.content, testData)}
                        </div>
                      </div>
                      
                      <Button onClick={handleTestTemplate} disabled={loading}>
                        <TestTube className="h-4 w-4 mr-2" />
                        Enviar Teste
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Selecione um Template</h3>
                  <p className="text-muted-foreground mb-4">
                    Escolha um template da lista para visualizar ou editar
                  </p>
                  <Button onClick={startCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}