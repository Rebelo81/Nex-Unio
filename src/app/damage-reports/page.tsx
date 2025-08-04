'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar,
  User,
  Building,
  RefreshCw,
  Download,
  Plus
} from 'lucide-react';

interface DamageReport {
  id: string;
  rentalId: string;
  damages: any[];
  totalCost: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'billed';
  createdAt: Date;
  createdBy: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  billedAt?: Date;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  billingReference?: string;
  notes?: string;
  version: number;
}

interface DamageReportStats {
  total: number;
  byStatus: Record<string, number>;
  totalValue: number;
  averageProcessingTime: number;
  approvalRate: number;
  monthlyTrend: Array<{ month: string; count: number; value: number }>;
}

export default function DamageReportsPage() {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [stats, setStats] = useState<DamageReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Estados para formulários
  const [approvalData, setApprovalData] = useState({
    notes: '',
    partialApproval: false,
    adjustments: [] as any[]
  });

  const [rejectionData, setRejectionData] = useState({
    reason: '',
    category: 'insufficient_evidence',
    feedback: '',
    allowResubmission: true,
    requiresInspection: false
  });

  const [billingData, setBillingData] = useState({
    billingMethod: 'asaas',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    installments: 1,
    discount: 0,
    additionalFees: [] as any[],
    notes: '',
    sendNotification: true
  });

  useEffect(() => {
    loadReports();
    loadStats();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/damage-reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Erro ao carregar relatórios de avarias');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/damage-reports?stats=true');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedReport) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/damage-reports/${selectedReport.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...approvalData,
          approvedBy: 'current-user' // Em um sistema real, pegar do contexto de autenticação
        })
      });

      if (response.ok) {
        toast.success('Relatório aprovado com sucesso');
        setShowApprovalDialog(false);
        loadReports();
        loadStats();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao aprovar relatório');
      }
    } catch (error) {
      console.error('Erro ao aprovar relatório:', error);
      toast.error('Erro ao aprovar relatório');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReport) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/damage-reports/${selectedReport.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rejectionData,
          rejectedBy: 'current-user' // Em um sistema real, pegar do contexto de autenticação
        })
      });

      if (response.ok) {
        toast.success('Relatório rejeitado com sucesso');
        setShowRejectionDialog(false);
        loadReports();
        loadStats();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao rejeitar relatório');
      }
    } catch (error) {
      console.error('Erro ao rejeitar relatório:', error);
      toast.error('Erro ao rejeitar relatório');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateBilling = async () => {
    if (!selectedReport) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/damage-reports/${selectedReport.id}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...billingData,
          billedBy: 'current-user' // Em um sistema real, pegar do contexto de autenticação
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Cobrança gerada com sucesso');
        setShowBillingDialog(false);
        loadReports();
        loadStats();
        
        // Mostrar informações da cobrança
        if (result.billing?.paymentUrl) {
          toast.info('Link de pagamento gerado', {
            action: {
              label: 'Copiar Link',
              onClick: () => navigator.clipboard.writeText(result.billing.paymentUrl)
            }
          });
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao gerar cobrança');
      }
    } catch (error) {
      console.error('Erro ao gerar cobrança:', error);
      toast.error('Erro ao gerar cobrança');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const, icon: FileText },
      submitted: { label: 'Submetido', variant: 'default' as const, icon: Clock },
      approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
      billed: { label: 'Cobrado', variant: 'default' as const, icon: DollarSign }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.rentalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Avarias</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe relatórios de avarias das locações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadReports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.byStatus.submitted || 0} aguardando aprovação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.totalValue.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor médio: R$ {(stats.totalValue / (stats.total || 1)).toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvalRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.byStatus.approved || 0} aprovados de {stats.total}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageProcessingTime}h</div>
              <p className="text-xs text-muted-foreground">
                Tempo de processamento
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID do relatório, locação ou criador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="submitted">Submetido</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="billed">Cobrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Relatórios */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Relatório #{report.id.slice(-8)}</h3>
                    {getStatusBadge(report.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      Locação: {report.rentalId}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Criado por: {report.createdBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">
                      {report.damages.length} avaria(s)
                    </span>
                    <span className="font-medium text-green-600">
                      R$ {report.totalCost.toLocaleString('pt-BR')}
                    </span>
                    {report.billingReference && (
                      <span className="text-blue-600">
                        Cobrança: {report.billingReference}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Relatório #{report.id.slice(-8)}</DialogTitle>
                        <DialogDescription>
                          Locação: {report.rentalId} • Criado em {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <div className="mt-1">{getStatusBadge(report.status)}</div>
                          </div>
                          <div>
                            <Label>Valor Total</Label>
                            <div className="mt-1 font-semibold text-green-600">
                              R$ {report.totalCost.toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Avarias ({report.damages.length})</Label>
                          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                            {report.damages.map((damage, index) => (
                              <div key={index} className="p-2 border rounded text-sm">
                                <div className="font-medium">{damage.itemName}</div>
                                <div className="text-muted-foreground">{damage.description}</div>
                                <div className="text-green-600 font-medium">
                                  R$ {damage.repairCost.toLocaleString('pt-BR')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {report.notes && (
                          <div>
                            <Label>Observações</Label>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {report.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {report.status === 'submitted' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowApprovalDialog(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowRejectionDialog(true);
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  {report.status === 'approved' && !report.billingReference && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => {
                        setSelectedReport(report);
                        setShowBillingDialog(true);
                      }}
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Ainda não há relatórios de avarias criados'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Aprovação */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Relatório</DialogTitle>
            <DialogDescription>
              Aprovar relatório #{selectedReport?.id.slice(-8)} da locação {selectedReport?.rentalId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-notes">Observações da Aprovação</Label>
              <Textarea
                id="approval-notes"
                placeholder="Observações sobre a aprovação (opcional)"
                value={approvalData.notes}
                onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Aprovar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Relatório</DialogTitle>
            <DialogDescription>
              Rejeitar relatório #{selectedReport?.id.slice(-8)} da locação {selectedReport?.rentalId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-category">Categoria da Rejeição</Label>
              <Select
                value={rejectionData.category}
                onValueChange={(value) => setRejectionData({ ...rejectionData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insufficient_evidence">Evidências Insuficientes</SelectItem>
                  <SelectItem value="pre_existing_damage">Avaria Pré-existente</SelectItem>
                  <SelectItem value="normal_wear">Desgaste Normal</SelectItem>
                  <SelectItem value="incorrect_assessment">Avaliação Incorreta</SelectItem>
                  <SelectItem value="missing_documentation">Documentação Faltante</SelectItem>
                  <SelectItem value="policy_violation">Violação de Política</SelectItem>
                  <SelectItem value="duplicate_report">Relatório Duplicado</SelectItem>
                  <SelectItem value="other">Outros Motivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Descreva detalhadamente o motivo da rejeição"
                value={rejectionData.reason}
                onChange={(e) => setRejectionData({ ...rejectionData, reason: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="rejection-feedback">Feedback para Correção</Label>
              <Textarea
                id="rejection-feedback"
                placeholder="Orientações para correção do relatório (opcional)"
                value={rejectionData.feedback}
                onChange={(e) => setRejectionData({ ...rejectionData, feedback: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectionDialog(false)}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={actionLoading || !rejectionData.reason.trim()}
                variant="destructive"
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Rejeitar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cobrança */}
      <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Cobrança</DialogTitle>
            <DialogDescription>
              Gerar cobrança para o relatório #{selectedReport?.id.slice(-8)} da locação {selectedReport?.rentalId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billing-method">Método de Cobrança</Label>
                <Select
                  value={billingData.billingMethod}
                  onValueChange={(value) => setBillingData({ ...billingData, billingMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asaas">Asaas (PIX/Boleto)</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                    <SelectItem value="manual">Cobrança Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="billing-due-date">Data de Vencimento</Label>
                <Input
                  id="billing-due-date"
                  type="date"
                  value={billingData.dueDate}
                  onChange={(e) => setBillingData({ ...billingData, dueDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billing-installments">Parcelas</Label>
                <Select
                  value={billingData.installments.toString()}
                  onValueChange={(value) => setBillingData({ ...billingData, installments: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}x {num > 1 ? 'parcelas' : 'à vista'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="billing-discount">Desconto (%)</Label>
                <Input
                  id="billing-discount"
                  type="number"
                  min="0"
                  max="100"
                  value={billingData.discount}
                  onChange={(e) => setBillingData({ ...billingData, discount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="billing-notes">Observações</Label>
              <Textarea
                id="billing-notes"
                placeholder="Observações sobre a cobrança (opcional)"
                value={billingData.notes}
                onChange={(e) => setBillingData({ ...billingData, notes: e.target.value })}
              />
            </div>
            
            {selectedReport && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Resumo da Cobrança</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {selectedReport.totalCost.toLocaleString('pt-BR')}</span>
                  </div>
                  {billingData.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Desconto ({billingData.discount}%):</span>
                      <span>-R$ {((selectedReport.totalCost * billingData.discount) / 100).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>R$ {(selectedReport.totalCost * (1 - billingData.discount / 100)).toLocaleString('pt-BR')}</span>
                  </div>
                  {billingData.installments > 1 && (
                    <div className="text-muted-foreground">
                      {billingData.installments}x de R$ {((selectedReport.totalCost * (1 - billingData.discount / 100)) / billingData.installments).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBillingDialog(false)}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateBilling}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                Gerar Cobrança
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}