'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAsaas } from '@/hooks/use-asaas';
import { 
  CreditCard, 
  QrCode, 
  FileText, 
  DollarSign, 
  Calendar, 
  User, 
  Mail, 
  Phone,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AsaasBillingProps {
  reportId?: string;
  rentalId?: string;
  totalAmount?: number;
  damages?: Array<{
    id: string;
    itemName: string;
    description: string;
    repairCost: number;
  }>;
  onBillingGenerated?: (billing: any) => void;
}

interface BillingData {
  billingMethod: 'asaas';
  dueDate: string;
  description?: string;
  installments: number;
  discount: number;
  additionalFees: Array<{
    name: string;
    amount: number;
    description?: string;
  }>;
  notes?: string;
  sendNotification: boolean;
  billedBy: string;
}

interface CustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  address?: {
    address: string;
    addressNumber: string;
    complement?: string;
    province: string;
    postalCode: string;
  };
}

export function AsaasBilling({ 
  reportId, 
  rentalId, 
  totalAmount, 
  damages, 
  onBillingGenerated 
}: AsaasBillingProps) {
  const { toast } = useToast();
  const { 
    createCustomer, 
    createPayment, 
    getPayment, 
    getPixQrCode, 
    getBoleto,
    formatCurrency: asaasFormatCurrency,
    isLoading 
  } = useAsaas();

  const [step, setStep] = useState<'customer' | 'billing' | 'payment'>('customer');
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    cpfCnpj: '',
    email: '',
    phone: ''
  });
  const [billingData, setBillingData] = useState<BillingData>({
    billingMethod: 'asaas',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    installments: 1,
    discount: 0,
    additionalFees: [],
    sendNotification: true,
    billedBy: 'Sistema'
  });
  const [generatedPayment, setGeneratedPayment] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [pixQrCode, setPixQrCode] = useState<string>('');
  const [boletoUrl, setBoletoUrl] = useState<string>('');

  // Calcular valores
  const subtotal = totalAmount;
  const discountAmount = (subtotal * billingData.discount) / 100;
  const feesAmount = billingData.additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
  const finalAmount = subtotal - discountAmount + feesAmount;

  // Adicionar taxa adicional
  const addFee = () => {
    setBillingData(prev => ({
      ...prev,
      additionalFees: [
        ...prev.additionalFees,
        { name: '', amount: 0, description: '' }
      ]
    }));
  };

  // Remover taxa adicional
  const removeFee = (index: number) => {
    setBillingData(prev => ({
      ...prev,
      additionalFees: prev.additionalFees.filter((_, i) => i !== index)
    }));
  };

  // Atualizar taxa adicional
  const updateFee = (index: number, field: string, value: any) => {
    setBillingData(prev => ({
      ...prev,
      additionalFees: prev.additionalFees.map((fee, i) => 
        i === index ? { ...fee, [field]: value } : fee
      )
    }));
  };

  // Gerar cobrança
  const handleGenerateBilling = async () => {
    try {
      if (finalAmount <= 0) {
        toast({
          title: 'Erro',
          description: 'O valor final deve ser maior que zero',
          variant: 'destructive'
        });
        return;
      }

      // Criar cliente no Asaas
      const customer = await createCustomer({
        name: customerData.name,
        cpfCnpj: customerData.cpfCnpj,
        email: customerData.email,
        phone: customerData.phone,
        externalReference: rentalId,
        notificationDisabled: !billingData.sendNotification,
        additionalEmails: '',
        municipalInscription: '',
        stateInscription: '',
        observations: `Cliente da locação ${rentalId} - Cobrança de avarias`,
        ...(customerData.address && {
          address: customerData.address.address,
          addressNumber: customerData.address.addressNumber,
          complement: customerData.address.complement,
          province: customerData.address.province,
          postalCode: customerData.address.postalCode
        })
      });

      // Determinar tipo de cobrança
      const billingType = billingData.installments > 1 ? 'CREDIT_CARD' : 'PIX';

      // Criar pagamento
      const payment = await createPayment({
        customer: customer.id,
        billingType,
        value: finalAmount,
        dueDate: billingData.dueDate,
        description: billingData.description || `Cobrança de avarias - Locação ${rentalId}`,
        externalReference: `DAM-${reportId}-${Date.now()}`,
        installmentCount: billingData.installments > 1 ? billingData.installments : undefined,
        installmentValue: billingData.installments > 1 ? 
          Math.round((finalAmount / billingData.installments) * 100) / 100 : undefined,
        discount: billingData.discount > 0 ? {
          value: discountAmount,
          dueDateLimitDays: 0
        } : undefined,
        fine: {
          value: 2.0
        },
        interest: {
          value: 1.0
        },
        postalService: false
      });

      setGeneratedPayment(payment);
      setPaymentStatus(payment);
      setStep('payment');

      // Gerar QR Code PIX se necessário
      if (billingType === 'PIX') {
        try {
          const pixData = await getPixQrCode(payment.id);
          setPixQrCode(pixData.payload);
        } catch (error) {
          console.warn('Erro ao gerar QR Code PIX:', error);
        }
      }

      // Gerar boleto
      try {
        const boleto = await getBoleto(payment.id);
        setBoletoUrl(boleto.bankSlipUrl);
      } catch (error) {
        console.warn('Erro ao gerar boleto:', error);
      }

      toast({
        title: 'Sucesso',
        description: 'Cobrança gerada com sucesso!'
      });

      onBillingGenerated?.(payment);

    } catch (error) {
      console.error('Erro ao gerar cobrança:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar cobrança. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  // Atualizar status do pagamento
  const refreshPaymentStatus = async () => {
    if (!generatedPayment) return;

    try {
      const updatedPayment = await getPayment(generatedPayment.id);
      setPaymentStatus(updatedPayment);
      
      toast({
        title: 'Status atualizado',
        description: `Status: ${getStatusLabel(updatedPayment.status)}`
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do pagamento',
        variant: 'destructive'
      });
    }
  };

  // Copiar código PIX
  const copyPixCode = () => {
    navigator.clipboard.writeText(pixQrCode);
    toast({
      title: 'Copiado!',
      description: 'Código PIX copiado para a área de transferência'
    });
  };

  // Obter label do status
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pendente',
      'CONFIRMED': 'Confirmado',
      'RECEIVED': 'Recebido',
      'OVERDUE': 'Vencido',
      'REFUNDED': 'Estornado',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'RECEIVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'CANCELLED':
      case 'REFUNDED':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Renderizar etapa do cliente
  const renderCustomerStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Dados do Cliente
        </CardTitle>
        <CardDescription>
          Informe os dados do cliente para gerar a cobrança
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={customerData.name}
              onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do cliente"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
            <Input
              id="cpfCnpj"
              value={customerData.cpfCnpj}
              onChange={(e) => setCustomerData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
              placeholder="000.000.000-00"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={customerData.email}
              onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="cliente@exemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={customerData.phone}
              onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={() => setStep('billing')}
            disabled={!customerData.name || !customerData.cpfCnpj || !customerData.email}
          >
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Renderizar etapa de cobrança
  const renderBillingStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configuração da Cobrança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={billingData.dueDate}
                onChange={(e) => setBillingData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installments">Parcelas</Label>
              <Select
                value={billingData.installments.toString()}
                onValueChange={(value) => setBillingData(prev => ({ ...prev, installments: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x {num > 1 && `de ${formatCurrency(finalAmount / num)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={billingData.description || ''}
              onChange={(e) => setBillingData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição da cobrança"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount">Desconto (%)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              value={billingData.discount}
              onChange={(e) => setBillingData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Taxas Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Taxas Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {billingData.additionalFees.map((fee, index) => (
            <div key={index} className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Nome da taxa"
                value={fee.name}
                onChange={(e) => updateFee(index, 'name', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Valor"
                value={fee.amount}
                onChange={(e) => updateFee(index, 'amount', parseFloat(e.target.value) || 0)}
              />
              <Button variant="outline" size="sm" onClick={() => removeFee(index)}>
                Remover
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addFee}>
            Adicionar Taxa
          </Button>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Cobrança</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {billingData.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto ({billingData.discount}%):</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {feesAmount > 0 && (
              <div className="flex justify-between">
                <span>Taxas adicionais:</span>
                <span>+{formatCurrency(feesAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(finalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('customer')}>Voltar</Button>
        <Button onClick={handleGenerateBilling} disabled={isLoading || finalAmount <= 0}>
          {isLoading ? 'Gerando...' : 'Gerar Cobrança'}
        </Button>
      </div>
    </div>
  );

  // Renderizar etapa de pagamento
  const renderPaymentStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Cobrança Gerada com Sucesso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <Badge variant={paymentStatus?.status === 'RECEIVED' ? 'default' : 'secondary'}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(paymentStatus?.status)}
                  {getStatusLabel(paymentStatus?.status)}
                </div>
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Valor:</span>
              <span className="font-bold">{formatCurrency(finalAmount)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Vencimento:</span>
              <span>{formatDate(new Date(billingData.dueDate))}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>ID do Pagamento:</span>
              <span className="font-mono text-sm">{generatedPayment?.id}</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshPaymentStatus}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar Status
              </Button>
              {generatedPayment?.invoiceUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={generatedPayment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver Fatura
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PIX */}
      {pixQrCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Pagamento via PIX
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Escaneie o QR Code ou copie o código PIX para realizar o pagamento
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center gap-2">
                <Input value={pixQrCode} readOnly className="font-mono text-xs" />
                <Button size="sm" onClick={copyPixCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boleto */}
      {boletoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Boleto Bancário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href={boletoUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                Visualizar Boleto
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Indicador de etapas */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center gap-2 ${step === 'customer' ? 'text-blue-600' : step === 'billing' || step === 'payment' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'customer' ? 'bg-blue-100 text-blue-600' : step === 'billing' || step === 'payment' ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}>
            1
          </div>
          <span>Cliente</span>
        </div>
        <div className="w-8 h-px bg-gray-300" />
        <div className={`flex items-center gap-2 ${step === 'billing' ? 'text-blue-600' : step === 'payment' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'billing' ? 'bg-blue-100 text-blue-600' : step === 'payment' ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}>
            2
          </div>
          <span>Cobrança</span>
        </div>
        <div className="w-8 h-px bg-gray-300" />
        <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}>
            3
          </div>
          <span>Pagamento</span>
        </div>
      </div>

      {/* Conteúdo da etapa */}
      {step === 'customer' && renderCustomerStep()}
      {step === 'billing' && renderBillingStep()}
      {step === 'payment' && renderPaymentStep()}
    </div>
  );
}