'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard,
  Users,
  DollarSign,
  Webhook,
  Settings,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { AsaasBilling } from '@/components/asaas/asaas-billing';
import { AsaasCustomers } from '@/components/asaas/asaas-customers';
import { AsaasPayments } from '@/components/asaas/asaas-payments';
import { AsaasWebhooks } from '@/components/asaas/asaas-webhooks';

export default function AsaasPage() {
  const [activeTab, setActiveTab] = useState('billing');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Integração Asaas</h1>
            <p className="text-muted-foreground">
              Sistema completo de gestão de pagamentos e cobranças
            </p>
          </div>
        </div>
      </div>

      {/* Status da Integração */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Integração Ativa:</strong> Conectado com a API do Asaas. 
          Todas as funcionalidades estão disponíveis para uso.
        </AlertDescription>
      </Alert>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobranças</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ativo</div>
            <p className="text-xs text-muted-foreground">
              Sistema de cobrança integrado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gerenciado</div>
            <p className="text-xs text-muted-foreground">
              CRUD completo de clientes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PIX + Cartão</div>
            <p className="text-xs text-muted-foreground">
              Múltiplas formas de pagamento
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Configurado</div>
            <p className="text-xs text-muted-foreground">
              Notificações em tempo real
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funcionalidades Implementadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Funcionalidades Implementadas
          </CardTitle>
          <CardDescription>
            Visão geral das capacidades da integração com o Asaas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Gestão de Cobranças
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Criação de cobranças PIX, Cartão e Boleto</li>
                <li>• Parcelamento em cartão de crédito</li>
                <li>• Geração automática de QR Codes PIX</li>
                <li>• Integração com relatórios de avarias</li>
                <li>• Cálculo automático de taxas e descontos</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gestão de Clientes
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• CRUD completo de clientes</li>
                <li>• Validação de CPF/CNPJ</li>
                <li>• Busca e filtros avançados</li>
                <li>• Sincronização automática</li>
                <li>• Histórico de transações</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Processamento de Pagamentos
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Pagamentos via PIX instantâneo</li>
                <li>• Processamento de cartão de crédito</li>
                <li>• Geração de boletos bancários</li>
                <li>• Estornos e cancelamentos</li>
                <li>• Acompanhamento de status em tempo real</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                Webhooks e Notificações
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Configuração de webhooks personalizados</li>
                <li>• Eventos de pagamento em tempo real</li>
                <li>• Validação de autenticidade</li>
                <li>• Testes de conectividade</li>
                <li>• Logs de eventos detalhados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cobranças
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Cobranças</CardTitle>
              <CardDescription>
                Crie e gerencie cobranças integradas com o Asaas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AsaasBilling />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <AsaasCustomers />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <AsaasPayments />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <AsaasWebhooks />
        </TabsContent>
      </Tabs>

      {/* Informações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informações Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">API Endpoints</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• /api/asaas/customers</li>
                <li>• /api/asaas/payments</li>
                <li>• /api/asaas/webhooks</li>
                <li>• /api/damage-reports/[id]/billing</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Componentes</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• AsaasBilling</li>
                <li>• AsaasCustomers</li>
                <li>• AsaasPayments</li>
                <li>• AsaasWebhooks</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Recursos</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Hook useAsaas</li>
                <li>• Cliente HTTP configurado</li>
                <li>• Validação com Zod</li>
                <li>• Tratamento de erros</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}