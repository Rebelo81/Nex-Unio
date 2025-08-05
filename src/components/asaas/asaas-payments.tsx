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
import { useToast } from '@/hooks/use-toast';
import { useAsaas } from '@/hooks/use-asaas';
import { 
  CreditCard,
  QrCode,
  FileText,
  DollarSign,
  Calendar,
  Search,
  Eye,
  RefreshCw,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Payment {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  netValue: number;
  status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED';
  dueDate: string;
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  description: string;
  externalReference?: string;
  invoiceUrl: string;
  invoiceNumber: string;
  dateCreated: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value: number;
    dueDateLimitDays: number;
  };
  fine?: {
    value: number;
  };
  interest?: {
    value: number;
  };
}

interface PaymentFilters {
  status?: string;
  billingType?: string;
  customer?: string;
  dateCreatedGe?: string;
  dateCreatedLe?: string;
  dueDateGe?: string;
  dueDateLe?: string;
  externalReference?: string;
}

export function AsaasPayments() {
  const { toast } = useToast();
  const { 
    listPayments, 
    getPayment, 
    deletePayment, 
    refundPayment,
    payWithCreditCard,
    getPixQrCode,
    getBankSlip,
    formatCurrency: asaasFormatCurrency,
    loading: isLoading 
  } = useAsaas();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string>('');
  const [boletoUrl, setBoletoUrl] = useState<string>('');
  const [refundValue, setRefundValue] = useState<number>(0);
  const [refundDescription, setRefundDescription] = useState<string>('');
  
  const [filters, setFilters] = useState<PaymentFilters>({
    status: '',
    billingType: '',
    customer: '',
    externalReference: ''
  });

  // Carregar pagamentos
  const loadPayments = async () => {
    try {
      const response = await listPayments(filters);
      setPayments(response as unknown as Payment[] || []);
      setFilteredPayments(response as unknown as Payment[] || []);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar pagamentos',
        variant: 'destructive'
      });
    }
  };

  // Carregar pagamentos na inicialização
  useEffect(() => {
    loadPayments();
  }, []);

  // Aplicar filtros
  const applyFilters = () => {
    loadPayments();
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      status: '',
      billingType: '',
      customer: '',
      externalReference: ''
    });
  };

  // Abrir diálogo de visualização
  const openViewDialog = async (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
    
    // Carregar dados específicos do pagamento
    if (payment.billingType === 'PIX') {
      try {
        const pixData = await getPixQrCode(payment.id);
        setPixQrCode(pixData?.payload || '');
      } catch (error) {
        console.warn('Erro ao carregar QR Code PIX:', error);
      }
    }
    
    if (payment.billingType === 'BOLETO') {
      try {
        const boleto = await getBankSlip(payment.id);
        setBoletoUrl(boleto?.bankSlipUrl || '');
      } catch (error) {
        console.warn('Erro ao carregar boleto:', error);
      }
    }
  };

  // Abrir diálogo de estorno
  const openRefundDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setRefundValue(payment.value);
    setRefundDescription(`Estorno do pagamento ${payment.id}`);
    setIsRefundDialogOpen(true);
  };

  // Processar estorno
  const handleRefund = async () => {
    if (!selectedPayment) return;

    try {
      if (refundValue <= 0 || refundValue > selectedPayment.value) {
        toast({
          title: 'Erro',
          description: 'Valor de estorno inválido',
          variant: 'destructive'
        });
        return;
      }

      await refundPayment(selectedPayment.id, {
        value: refundValue,
        description: refundDescription
      });
      
      toast({
        title: 'Sucesso',
        description: 'Estorno processado com sucesso!'
      });
      
      setIsRefundDialogOpen(false);
      setSelectedPayment(null);
      loadPayments();
    } catch (error) {
      console.error('Erro ao processar estorno:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar estorno',
        variant: 'destructive'
      });
    }
  };

  // Excluir pagamento
  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) {
      return;
    }

    try {
      await deletePayment(paymentId);
      
      toast({
        title: 'Sucesso',
        description: 'Pagamento excluído com sucesso!'
      });
      
      loadPayments();
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir pagamento. Apenas pagamentos pendentes podem ser excluídos.',
        variant: 'destructive'
      });
    }
  };

  // Atualizar status do pagamento
  const refreshPaymentStatus = async (paymentId: string) => {
    try {
      const updatedPayment = await getPayment(paymentId);
      
      // Atualizar na lista
      setPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));
      setFilteredPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));
      
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

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'RECEIVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'RECEIVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4" />;
      case 'CANCELLED':
      case 'REFUNDED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Obter ícone do tipo de cobrança
  const getBillingTypeIcon = (billingType: string) => {
    switch (billingType) {
      case 'PIX':
        return <QrCode className="h-4 w-4" />;
      case 'CREDIT_CARD':
        return <CreditCard className="h-4 w-4" />;
      case 'BOLETO':
        return <FileText className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pagamentos Asaas</h2>
          <p className="text-muted-foreground">Gerencie os pagamentos criados no Asaas</p>
        </div>
        <Button variant="outline" onClick={loadPayments} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="RECEIVED">Recebido</SelectItem>
                  <SelectItem value="OVERDUE">Vencido</SelectItem>
                  <SelectItem value="REFUNDED">Estornado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Cobrança</Label>
              <Select value={filters.billingType} onValueChange={(value) => setFilters(prev => ({ ...prev, billingType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input
                placeholder="ID do cliente"
                value={filters.customer || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Referência Externa</Label>
              <Input
                placeholder="Referência"
                value={filters.externalReference || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, externalReference: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-sm">
                    {payment.id}
                    {payment.externalReference && (
                      <div className="text-xs text-muted-foreground">
                        Ref: {payment.externalReference}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getBillingTypeIcon(payment.billingType)}
                      <span className="text-sm">
                        {payment.billingType === 'CREDIT_CARD' ? 'Cartão' : payment.billingType}
                      </span>
                    </div>
                    {payment.installmentCount && payment.installmentCount > 1 && (
                      <div className="text-xs text-muted-foreground">
                        {payment.installmentCount}x de {formatCurrency(payment.installmentValue || 0)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(payment.value)}</div>
                    {payment.netValue !== payment.value && (
                      <div className="text-xs text-muted-foreground">
                        Líquido: {formatCurrency(payment.netValue)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payment.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(payment.status)}
                        {getStatusLabel(payment.status)}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>{formatDate(new Date(payment.dueDate))}</div>
                    {payment.paymentDate && (
                      <div className="text-xs text-muted-foreground">
                        Pago em: {formatDate(new Date(payment.paymentDate))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {payment.customer}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(payment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refreshPaymentStatus(payment.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      {(payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRefundDialog(payment)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {payment.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePayment(payment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pagamento encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ID</Label>
                  <p className="font-mono text-sm">{selectedPayment.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedPayment.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedPayment.status)}
                      {getStatusLabel(selectedPayment.status)}
                    </div>
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Valor</Label>
                  <p className="font-medium text-lg">{formatCurrency(selectedPayment.value)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Valor Líquido</Label>
                  <p className="font-medium">{formatCurrency(selectedPayment.netValue)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Vencimento</Label>
                  <p>{formatDate(new Date(selectedPayment.dueDate))}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Criado em</Label>
                  <p>{formatDate(new Date(selectedPayment.dateCreated))}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                <p>{selectedPayment.description}</p>
              </div>

              {selectedPayment.externalReference && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Referência Externa</Label>
                  <p>{selectedPayment.externalReference}</p>
                </div>
              )}

              {selectedPayment.installmentCount && selectedPayment.installmentCount > 1 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Parcelamento</Label>
                  <p>{selectedPayment.installmentCount}x de {formatCurrency(selectedPayment.installmentValue || 0)}</p>
                </div>
              )}

              {/* PIX */}
              {selectedPayment.billingType === 'PIX' && pixQrCode && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Código PIX</Label>
                  <div className="flex items-center gap-2">
                    <Input value={pixQrCode} readOnly className="font-mono text-xs" />
                    <Button size="sm" onClick={copyPixCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Boleto */}
              {selectedPayment.billingType === 'BOLETO' && boletoUrl && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Boleto</Label>
                  <div className="mt-2">
                    <Button asChild>
                      <a href={boletoUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Visualizar Boleto
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
                {selectedPayment.invoiceUrl && (
                  <Button asChild>
                    <a href={selectedPayment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Fatura
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Estorno */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estornar Pagamento</DialogTitle>
            <DialogDescription>
              Processe o estorno total ou parcial do pagamento
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Valor máximo para estorno: {formatCurrency(selectedPayment.value)}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="refundValue">Valor do Estorno</Label>
                <Input
                  id="refundValue"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedPayment.value}
                  value={refundValue}
                  onChange={(e) => setRefundValue(parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refundDescription">Motivo do Estorno</Label>
                <Input
                  id="refundDescription"
                  value={refundDescription}
                  onChange={(e) => setRefundDescription(e.target.value)}
                  placeholder="Descreva o motivo do estorno"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleRefund} 
                  disabled={isLoading || refundValue <= 0 || refundValue > selectedPayment.value}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? 'Processando...' : 'Estornar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}