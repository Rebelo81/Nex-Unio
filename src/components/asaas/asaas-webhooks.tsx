'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAsaas } from '@/hooks/use-asaas';
import { 
  Webhook,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Settings,
  Send,
  Globe
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface WebhookData {
  id: string;
  name: string;
  url: string;
  email: string;
  enabled: boolean;
  interrupted: boolean;
  authToken: string;
  events: string[];
  apiVersion: number;
  dateCreated: string;
}

interface WebhookEvent {
  id: string;
  name: string;
  description: string;
}

const WEBHOOK_EVENTS: WebhookEvent[] = [
  { id: 'PAYMENT_CREATED', name: 'Cobrança Criada', description: 'Disparado quando uma cobrança é criada' },
  { id: 'PAYMENT_UPDATED', name: 'Cobrança Atualizada', description: 'Disparado quando uma cobrança é atualizada' },
  { id: 'PAYMENT_CONFIRMED', name: 'Cobrança Confirmada', description: 'Disparado quando uma cobrança é confirmada' },
  { id: 'PAYMENT_RECEIVED', name: 'Cobrança Recebida', description: 'Disparado quando uma cobrança é recebida' },
  { id: 'PAYMENT_OVERDUE', name: 'Cobrança Vencida', description: 'Disparado quando uma cobrança vence' },
  { id: 'PAYMENT_DELETED', name: 'Cobrança Removida', description: 'Disparado quando uma cobrança é removida' },
  { id: 'PAYMENT_RESTORED', name: 'Cobrança Restaurada', description: 'Disparado quando uma cobrança é restaurada' },
  { id: 'PAYMENT_REFUNDED', name: 'Cobrança Estornada', description: 'Disparado quando uma cobrança é estornada' },
  { id: 'PAYMENT_CHARGEBACK_REQUESTED', name: 'Chargeback Solicitado', description: 'Disparado quando um chargeback é solicitado' },
  { id: 'PAYMENT_CHARGEBACK_DISPUTE', name: 'Chargeback Contestado', description: 'Disparado quando um chargeback é contestado' }
];

export function AsaasWebhooks() {
  const { toast } = useToast();
  const { loading: isLoading } = useAsaas();

  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookData | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    email: '',
    enabled: true,
    events: [] as string[]
  });

  // Carregar webhooks
  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/asaas/webhooks');
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar webhooks',
        variant: 'destructive'
      });
    }
  };

  // Carregar webhooks na inicialização
  useEffect(() => {
    loadWebhooks();
  }, []);

  // Criar webhook
  const handleCreateWebhook = async () => {
    try {
      if (!formData.name || !formData.url || formData.events.length === 0) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch('/api/asaas/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Webhook criado com sucesso!'
        });
        setIsCreateDialogOpen(false);
        resetForm();
        loadWebhooks();
      } else {
        throw new Error('Erro ao criar webhook');
      }
    } catch (error) {
      console.error('Erro ao criar webhook:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar webhook',
        variant: 'destructive'
      });
    }
  };

  // Atualizar webhook
  const handleUpdateWebhook = async () => {
    if (!selectedWebhook) return;

    try {
      const response = await fetch(`/api/asaas/webhooks/${selectedWebhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Webhook atualizado com sucesso!'
        });
        setIsEditDialogOpen(false);
        setSelectedWebhook(null);
        resetForm();
        loadWebhooks();
      } else {
        throw new Error('Erro ao atualizar webhook');
      }
    } catch (error) {
      console.error('Erro ao atualizar webhook:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar webhook',
        variant: 'destructive'
      });
    }
  };

  // Excluir webhook
  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Tem certeza que deseja excluir este webhook?')) {
      return;
    }

    try {
      const response = await fetch(`/api/asaas/webhooks/${webhookId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Webhook excluído com sucesso!'
        });
        loadWebhooks();
      } else {
        throw new Error('Erro ao excluir webhook');
      }
    } catch (error) {
      console.error('Erro ao excluir webhook:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir webhook',
        variant: 'destructive'
      });
    }
  };

  // Testar webhook
  const handleTestWebhook = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/asaas/webhooks/${webhookId}`, {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Teste de webhook enviado com sucesso!'
        });
      } else {
        throw new Error('Erro ao testar webhook');
      }
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao testar webhook',
        variant: 'destructive'
      });
    }
  };

  // Abrir diálogo de criação
  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  // Abrir diálogo de edição
  const openEditDialog = (webhook: WebhookData) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      email: webhook.email,
      enabled: webhook.enabled,
      events: webhook.events
    });
    setIsEditDialogOpen(true);
  };

  // Abrir diálogo de visualização
  const openViewDialog = (webhook: WebhookData) => {
    setSelectedWebhook(webhook);
    setIsViewDialogOpen(true);
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      email: '',
      enabled: true,
      events: []
    });
  };

  // Toggle evento
  const toggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }));
  };

  // Copiar token
  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: 'Copiado!',
      description: 'Token copiado para a área de transferência'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhooks Asaas</h2>
          <p className="text-muted-foreground">Configure webhooks para receber notificações de eventos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadWebhooks} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={openCreateDialog}>
             <Plus className="h-4 w-4 mr-2" />
             Novo Webhook
           </Button>
         </div>
       </div>

      {/* Lista de Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados ({webhooks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Webhook className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{webhook.name}</div>
                        {webhook.email && (
                          <div className="text-xs text-muted-foreground">{webhook.email}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-mono text-sm truncate max-w-xs">{webhook.url}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {webhook.enabled ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Inativo
                        </Badge>
                      )}
                      {webhook.interrupted && (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Interrompido
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {webhook.events.length} evento(s)
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(new Date(webhook.dateCreated))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(webhook)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(webhook)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestWebhook(webhook.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {webhooks.length === 0 && (
             <div className="text-center py-8 text-muted-foreground">
               Nenhum webhook configurado
             </div>
           )}
         </CardContent>
       </Card>

      {/* Dialog de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Webhook</DialogTitle>
            <DialogDescription>
              Configure um webhook para receber notificações de eventos do Asaas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do webhook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">URL do Webhook *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://seu-site.com/webhook"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: !!checked }))}
              />
              <Label htmlFor="enabled">Webhook ativo</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Eventos *</Label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={event.id}
                      checked={formData.events.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor={event.id} className="text-sm font-medium">
                        {event.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione pelo menos um evento
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateWebhook} disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Webhook'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Webhook</DialogTitle>
            <DialogDescription>
              Atualize as configurações do webhook
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Nome *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do webhook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">E-mail</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editUrl">URL do Webhook *</Label>
              <Input
                id="editUrl"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://seu-site.com/webhook"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editEnabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: !!checked }))}
              />
              <Label htmlFor="editEnabled">Webhook ativo</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Eventos *</Label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`edit-${event.id}`}
                      checked={formData.events.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor={`edit-${event.id}`} className="text-sm font-medium">
                        {event.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
               <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                 Cancelar
               </Button>
               <Button onClick={handleUpdateWebhook} disabled={isLoading}>
                 {isLoading ? 'Atualizando...' : 'Atualizar'}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Webhook</DialogTitle>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ID</Label>
                  <p className="font-mono text-sm">{selectedWebhook.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                  <p>{selectedWebhook.name}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={selectedWebhook.url} readOnly className="font-mono text-sm" />
                  <Button size="sm" onClick={() => copyToken(selectedWebhook.url)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedWebhook.email && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">E-mail</Label>
                  <p>{selectedWebhook.email}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedWebhook.enabled ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Inativo
                      </Badge>
                    )}
                    {selectedWebhook.interrupted && (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Interrompido
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Versão da API</Label>
                  <p>v{selectedWebhook.apiVersion}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Token de Autenticação</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={selectedWebhook.authToken} 
                    readOnly 
                    type="password" 
                    className="font-mono text-sm" 
                  />
                  <Button size="sm" onClick={() => copyToken(selectedWebhook.authToken)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use este token para validar a autenticidade dos webhooks
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Eventos Configurados</Label>
                <div className="mt-2 space-y-2">
                  {selectedWebhook.events.map((eventId) => {
                    const event = WEBHOOK_EVENTS.find(e => e.id === eventId);
                    return event ? (
                      <div key={eventId} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Settings className="h-4 w-4" />
                        <div>
                          <div className="font-medium text-sm">{event.name}</div>
                          <div className="text-xs text-muted-foreground">{event.description}</div>
                        </div>
                      </div>
                    ) : (
                      <div key={eventId} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Settings className="h-4 w-4" />
                        <span className="text-sm">{eventId}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Criado em</Label>
                <p>{formatDate(new Date(selectedWebhook.dateCreated))}</p>
              </div>

              <Separator />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Certifique-se de que sua URL está acessível e pode receber requisições POST. 
                  Use o token de autenticação para validar a origem dos webhooks.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
                <Button 
                  onClick={() => handleTestWebhook(selectedWebhook.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Testar Webhook
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}