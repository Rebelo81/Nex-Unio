'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DamageRegistry } from '@/components/damage/damage-registry';
import { DamageItem, DamageReport } from '@/types/damage';
import {
  ArrowLeft,
  Save,
  Send,
  AlertTriangle,
  FileText,
  Building,
  User,
  Calendar,
  DollarSign,
  RefreshCw
} from 'lucide-react';

import { DamageItem, DamageReport } from '@/types/damage';

export default function NewDamageReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<DamageReport>({
    rentalId: '',
    damages: [],
    notes: '',
    createdBy: 'current-user' // Em um sistema real, pegar do contexto de autenticação
  });
  
  const [damages, setDamages] = useState<DamageItem[]>([]);
  const [searchRental, setSearchRental] = useState('');
  const [rentalInfo, setRentalInfo] = useState<any>(null);
  const [searchingRental, setSearchingRental] = useState(false);

  const handleSearchRental = async () => {
    if (!searchRental.trim()) {
      toast.error('Digite o ID da locação');
      return;
    }

    try {
      setSearchingRental(true);
      // Simulação de busca de locação
      // Em um sistema real, faria uma chamada para a API
      const mockRentalInfo = {
        id: searchRental,
        customerName: 'João Silva',
        customerEmail: 'joao@email.com',
        customerPhone: '(11) 99999-9999',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        status: 'active',
        items: [
          { name: 'Mesa Redonda 1.5m', quantity: 2 },
          { name: 'Cadeira Tiffany Branca', quantity: 8 },
          { name: 'Toalha Branca 3m', quantity: 2 }
        ],
        totalValue: 850.00
      };
      
      setRentalInfo(mockRentalInfo);
      setReportData({ ...reportData, rentalId: searchRental });
      toast.success('Locação encontrada');
    } catch (error) {
      console.error('Erro ao buscar locação:', error);
      toast.error('Erro ao buscar locação');
    } finally {
      setSearchingRental(false);
    }
  };

  const handleDamagesChange = (newDamages: DamageItem[]) => {
    setDamages(newDamages);
    setReportData({ ...reportData, damages: newDamages });
  };

  const calculateTotalCost = () => {
    return damages.reduce((total, damage) => total + damage.repairCost, 0);
  };

  const getSeverityStats = () => {
    const stats = { low: 0, medium: 0, high: 0, critical: 0 };
    damages.forEach(damage => {
      stats[damage.severity]++;
    });
    return stats;
  };

  const handleSaveDraft = async () => {
    if (!reportData.rentalId) {
      toast.error('Selecione uma locação');
      return;
    }

    if (damages.length === 0) {
      toast.error('Adicione pelo menos uma avaria');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/damage-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportData,
          status: 'draft'
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Rascunho salvo com sucesso');
        router.push(`/damage-reports/${result.report.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar rascunho');
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      toast.error('Erro ao salvar rascunho');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportData.rentalId) {
      toast.error('Selecione uma locação');
      return;
    }

    if (damages.length === 0) {
      toast.error('Adicione pelo menos uma avaria');
      return;
    }

    // Validar se todas as avarias têm informações completas
    const incompleteItems = damages.filter(damage => 
      !damage.itemName.trim() || 
      !damage.description.trim() || 
      damage.repairCost <= 0 ||
      damage.photos.length === 0
    );

    if (incompleteItems.length > 0) {
      toast.error('Todas as avarias devem ter nome, descrição, custo e pelo menos uma foto');
      return;
    }

    try {
      setLoading(true);
      
      // Primeiro criar o relatório
      const createResponse = await fetch('/api/damage-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportData,
          status: 'draft'
        })
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || 'Erro ao criar relatório');
      }

      const createResult = await createResponse.json();
      const reportId = createResult.report.id;

      // Depois submeter para aprovação
      const submitResponse = await fetch(`/api/damage-reports/${reportId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (submitResponse.ok) {
        toast.success('Relatório submetido para aprovação');
        router.push(`/damage-reports/${reportId}`);
      } else {
        const error = await submitResponse.json();
        toast.error(error.error || 'Erro ao submeter relatório');
        // Mesmo com erro na submissão, redirecionar para o relatório criado
        router.push(`/damage-reports/${reportId}`);
      }
    } catch (error) {
      console.error('Erro ao submeter relatório:', error);
      toast.error('Erro ao submeter relatório');
    } finally {
      setLoading(false);
    }
  };

  const severityStats = getSeverityStats();
  const totalCost = calculateTotalCost();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Relatório de Avarias</h1>
          <p className="text-muted-foreground">
            Registre avarias encontradas em equipamentos de locação
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações da Locação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informações da Locação
              </CardTitle>
              <CardDescription>
                Busque e selecione a locação para registrar as avarias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="rental-search">ID da Locação</Label>
                  <Input
                    id="rental-search"
                    placeholder="Digite o ID da locação"
                    value={searchRental}
                    onChange={(e) => setSearchRental(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchRental()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleSearchRental}
                    disabled={searchingRental || !searchRental.trim()}
                  >
                    {searchingRental ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Buscar'
                    )}
                  </Button>
                </div>
              </div>

              {rentalInfo && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Locação #{rentalInfo.id}</h4>
                    <Badge variant="default">{rentalInfo.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cliente:</span>
                      <div className="font-medium">{rentalInfo.customerName}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Período:</span>
                      <div className="font-medium">
                        {new Date(rentalInfo.startDate).toLocaleDateString('pt-BR')} - {new Date(rentalInfo.endDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">E-mail:</span>
                      <div className="font-medium">{rentalInfo.customerEmail}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Telefone:</span>
                      <div className="font-medium">{rentalInfo.customerPhone}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Itens da Locação:</span>
                    <div className="mt-1 space-y-1">
                      {rentalInfo.items.map((item: any, index: number) => (
                        <div key={index} className="text-sm">
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registro de Avarias */}
          {rentalInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Registro de Avarias
                </CardTitle>
                <CardDescription>
                  Adicione as avarias encontradas nos equipamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DamageRegistry
                  damages={damages}
                  onChange={handleDamagesChange}
                  rentalId={reportData.rentalId}
                />
              </CardContent>
            </Card>
          )}

          {/* Observações Gerais */}
          {rentalInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Observações Gerais
                </CardTitle>
                <CardDescription>
                  Informações adicionais sobre o relatório
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="report-notes">Observações</Label>
                  <Textarea
                    id="report-notes"
                    placeholder="Observações gerais sobre as avarias, contexto, condições de uso, etc."
                    value={reportData.notes}
                    onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar com Resumo */}
        <div className="space-y-6">
          {/* Resumo do Relatório */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumo do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total de Avarias:</span>
                  <span className="font-medium">{damages.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo Total:</span>
                  <span className="font-medium text-green-600">
                    R$ {totalCost.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo Médio:</span>
                  <span className="font-medium">
                    R$ {damages.length > 0 ? (totalCost / damages.length).toLocaleString('pt-BR') : '0,00'}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Severidade das Avarias</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Baixa:</span>
                    <Badge variant="secondary" className="text-xs">{severityStats.low}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Média:</span>
                    <Badge variant="default" className="text-xs">{severityStats.medium}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Alta:</span>
                    <Badge variant="destructive" className="text-xs">{severityStats.high}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Crítica:</span>
                    <Badge variant="destructive" className="text-xs">{severityStats.critical}</Badge>
                  </div>
                </div>
              </div>

              {rentalInfo && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Informações da Locação</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Building className="h-3 w-3" />
                        {rentalInfo.id}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        {rentalInfo.customerName}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(rentalInfo.startDate).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        R$ {rentalInfo.totalValue.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          {rentalInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={loading || damages.length === 0}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Rascunho
                </Button>
                
                <Button
                  className="w-full"
                  onClick={handleSubmitReport}
                  disabled={loading || damages.length === 0}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submeter para Aprovação
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Após submeter, o relatório será enviado para aprovação e não poderá mais ser editado.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}