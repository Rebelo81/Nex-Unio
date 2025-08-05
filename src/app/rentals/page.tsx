'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Permission } from '@/lib/auth/permissions';
import { ProtectedRoute, PermissionGuard, RoleBasedContent } from '@/components/auth/ProtectedRoute';
import { 
  Rental, 
  RentalStatus, 
  KANBAN_COLUMNS, 
  RENTAL_ACTIONS,
  RentalStats 
} from '@/types/rental';
import { InspectionModal } from '@/components/modals/inspection-modal';
import { useLalamove } from '@/hooks/use-lalamove';
import { RentalLalamoveIntegration } from '@/lib/lalamove';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  TruckIcon,
  CheckIcon,
  ArrowPathIcon as RefreshCwIcon,
  MapPinIcon,
  CheckCircleIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'sonner';

export default function RentalsPage() {
  const { isMarketplaceUser, isPartnerUser, partnerId } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [stats, setStats] = useState<RentalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<RentalStatus | 'all'>('all');
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [selectedRentalForInspection, setSelectedRentalForInspection] = useState<Rental | null>(null);
  
  // Hook do Lalamove
  const { 
    requestDelivery, 
    requestPickup, 
    trackOrder, 
    cancelOrder, 
    getTrackingUrl, 
    isLoading: lalamoveLoading 
  } = useLalamove();

  // Mock data para demonstração
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock rentals - versão simplificada
      const mockRentals: Rental[] = [
        {
          id: '1',
          orderNumber: 'LOC-2024-001',
          clientId: '1',
          client: {
            id: '1',
            name: 'João Silva',
            email: 'joao@email.com',
            phone: '(11) 99999-9999',
            status: 'active',
            totalRentals: 5,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          partnerId: partnerId || '1',
          items: [],
          startDate: new Date('2024-01-25'),
          endDate: new Date('2024-01-28'),
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20'),
          subtotal: 75.00,
          discountAmount: 0,
          totalAmount: 75.00,
          securityDeposit: 100.00,
          paidAmount: 75.00,
          status: 'separacao',
          paymentStatus: 'paid',
          deliveryMethod: 'delivery',
          deliveryAddress: {
            street: 'Rua das Flores',
            number: '123',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567'
          },
          receiptPrinted: false
        },
        {
          id: '2',
          orderNumber: 'LOC-2024-002',
          clientId: '2',
          client: {
            id: '2',
            name: 'Maria Santos',
            email: 'maria@email.com',
            phone: '(11) 88888-8888',
            status: 'active',
            totalRentals: 3,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          partnerId: partnerId || '1',
          items: [],
          startDate: new Date('2024-01-26'),
          endDate: new Date('2024-01-28'),
          createdAt: new Date('2024-01-21'),
          updatedAt: new Date('2024-01-21'),
          subtotal: 70.00,
          discountAmount: 0,
          totalAmount: 70.00,
          securityDeposit: 150.00,
          paidAmount: 70.00,
          status: 'em_uso',
          paymentStatus: 'paid',
          deliveryMethod: 'delivery',
          deliveryAddress: {
            street: 'Av. Paulista',
            number: '1000',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01310-100'
          },
          receiptPrinted: true
        }
      ];
      
      // Mock stats
      const mockStats: RentalStats = {
        total: mockRentals.length,
        byStatus: {
          separacao: 1,
          pronto_envio: 0,
          solicitar_lalamove: 1,
          aguardando_lalamove: 1,
          aguardando_motorista: 1,
          indo_cliente: 1,
          entregue: 0,
          em_uso: 0,
          devolucao_solicitada: 1,
          aguardando_aceite_devolucao: 0,
          motorista_indo_cliente: 0,
          voltando_loja: 1,
          conferencia: 1,
          finalizado: 0,
          cancelado: 0
        },
        totalRevenue: mockRentals.reduce((sum, r) => sum + r.totalAmount, 0),
        averageOrderValue: mockRentals.reduce((sum, r) => sum + r.totalAmount, 0) / mockRentals.length,
        completionRate: 85
      };
      
      setRentals(mockRentals);
      setStats(mockStats);
      setLoading(false);
    };
    
    loadData();
  }, [partnerId]);

  const handlePrintReceipt = (rentalId: string) => {
    // Implementar impressão do recibo
    console.log('Imprimir recibo para:', rentalId);
    // Atualizar status para pronto_envio
    setRentals(prev => prev.map(rental => 
      rental.id === rentalId 
        ? { 
            ...rental, 
            receiptPrinted: true, 
            receiptPrintedAt: new Date(),
            receiptPrintedBy: 'Usuário Atual',
            status: 'pronto_envio' as RentalStatus
          }
        : rental
    ));
  };

  const handleRequestLalamove = (rentalId: string) => {
    // Implementar solicitação Lalamove
    console.log('Solicitar Lalamove para:', rentalId);
    setRentals(prev => prev.map(rental => 
      rental.id === rentalId 
        ? { ...rental, status: 'aguardando_lalamove' as RentalStatus }
        : rental
    ));
  };

  const handleLalamoveRequest = async (rentalId: string) => {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) return;
    
    try {
      const result = await requestDelivery(rental);
      if (result) {
        // Atualizar rental com dados do Lalamove
        setRentals(prev => prev.map(r => 
          r.id === rentalId 
            ? { 
                ...r, 
                status: 'aguardando_motorista' as RentalStatus,
                lalamoveDeliveryId: result.orderId,
                lalamoveStatus: 'ASSIGNING',
                trackingUrl: getTrackingUrl(result.orderId),
                deliveryFee: parseFloat(result.quotation.totalFee)
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Erro ao solicitar Lalamove:', error);
    }
  };

  const handleCancelLalamove = async (rentalId: string) => {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental?.lalamoveDeliveryId) return;
    
    const success = await cancelOrder(rental.lalamoveDeliveryId);
    if (success) {
      setRentals(prev => prev.map(r => 
        r.id === rentalId 
          ? { 
              ...r, 
              status: 'solicitar_lalamove' as RentalStatus,
              lalamoveDeliveryId: undefined,
              lalamoveStatus: undefined,
              trackingUrl: undefined
            }
          : r
      ));
    }
  };

  const handleTrackDelivery = (rentalId: string) => {
    const rental = rentals.find(r => r.id === rentalId);
    if (rental?.trackingUrl) {
      window.open(rental.trackingUrl, '_blank');
    } else {
      toast.error('URL de rastreamento não disponível');
    }
  };

  const handleRequestPickup = async (rentalId: string) => {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) return;
    
    try {
      const result = await requestPickup(rental);
      if (result) {
        setRentals(prev => prev.map(r => 
          r.id === rentalId 
            ? { 
                ...r, 
                status: 'aguardando_aceite_devolucao' as RentalStatus,
                returnLalamoveOrderId: result.orderId,
                returnTrackingUrl: getTrackingUrl(result.orderId),
                returnRequestedAt: new Date()
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Erro ao solicitar coleta:', error);
    }
  };

  const handleTrackReturn = (rentalId: string) => {
    const rental = rentals.find(r => r.id === rentalId);
    if (rental?.returnTrackingUrl) {
      window.open(rental.returnTrackingUrl, '_blank');
    } else {
      toast.error('URL de rastreamento de retorno não disponível');
    }
  };

  // Função para atualizar status baseado no Lalamove
  const updateRentalFromLalamove = async (rentalId: string) => {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental?.lalamoveDeliveryId) return;
    
    try {
      const order = await trackOrder(rental.lalamoveDeliveryId);
      if (order) {
        const mappedStatus = RentalLalamoveIntegration.mapLalamoveStatus(order.status);
        
        setRentals(prev => prev.map(r => 
          r.id === rentalId 
            ? { 
                ...r, 
                status: mappedStatus.status as RentalStatus,
                driverInfo: order.driverInfo ? {
                  name: order.driverInfo.name,
                  phone: order.driverInfo.phone,
                  vehicleInfo: order.driverInfo.plateNumber || 'N/A'
                } : undefined
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Erro ao atualizar status do Lalamove:', error);
    }
  };

  const handleStartInspection = (rentalId: string) => {
    const rental = rentals.find(r => r.id === rentalId);
    if (rental) {
      setSelectedRentalForInspection(rental);
      setInspectionModalOpen(true);
    }
  };

  const handleInspectionComplete = (inspectionData: any) => {
    if (!selectedRentalForInspection) return;
    
    console.log('Conferência concluída para:', selectedRentalForInspection.id, inspectionData);
    
    // Atualizar o status da locação para finalizado
    setRentals(prev => prev.map(rental => 
      rental.id === selectedRentalForInspection.id 
        ? { 
            ...rental, 
            status: 'finalizado' as RentalStatus,
            inspectionCompleted: true,
            inspectedBy: inspectionData.inspectedBy,
            inspectionDate: new Date(),
            damages: inspectionData.damages,
            damageAmount: inspectionData.totalDamageAmount
          }
        : rental
    ));
    
    // Simular envio de e-mail de conclusão
    console.log('Enviando e-mail de conclusão para:', selectedRentalForInspection.client?.email);
    
    // Se houver avarias, simular cobrança via Asaas
    if (inspectionData.totalDamageAmount > 0) {
      console.log('Processando cobrança via Asaas:', inspectionData.totalDamageAmount);
    }
    
    setInspectionModalOpen(false);
    setSelectedRentalForInspection(null);
  };

  const handleViewDetails = (rentalId: string) => {
    console.log('Visualizando detalhes de:', rentalId);
    // Aqui seria aberto um modal ou página com os detalhes
  };

  const handleStatusChange = (rentalId: string, newStatus: RentalStatus) => {
    setRentals(prev => prev.map(rental => 
      rental.id === rentalId 
        ? { ...rental, status: newStatus }
        : rental
    ));
  };

  const filteredRentals = rentals.filter(rental => {
    if (searchTerm && !rental.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !rental.client?.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedStatus !== 'all' && rental.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const getRentalsByStatus = (status: RentalStatus) => {
    return filteredRentals.filter(rental => rental.status === status);
  };

  const getActionIcon = (actionId: string) => {
    switch (actionId) {
      case 'print_receipt': return <PrinterIcon className="h-4 w-4" />;
      case 'request_lalamove': return <TruckIcon className="h-4 w-4" />;
      case 'confirm_lalamove': return <CheckIcon className="h-4 w-4" />;
      case 'check_status': return <RefreshCwIcon className="h-4 w-4" />;
      case 'track_delivery': return <MapPinIcon className="h-4 w-4" />;
      case 'confirm_delivery': return <CheckCircleIcon className="h-4 w-4" />;
      case 'schedule_pickup': return <CalendarIcon className="h-4 w-4" />;
      case 'request_pickup': return <TruckIcon className="h-4 w-4" />;
      case 'track_pickup': return <MapPinIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const getAvailableActions = (rental: any) => {
    const actions = [];
    
    switch (rental.status) {
      case 'separacao':
        actions.push({
          label: 'Marcar como Pronto',
          action: () => handleStatusChange(rental.id, 'solicitar_lalamove'),
          variant: 'primary'
        });
        break;
        
      case 'solicitar_lalamove':
        actions.push({
          label: 'Solicitar Lalamove',
          action: () => handleLalamoveRequest(rental.id),
          variant: 'primary'
        });
        if (!rental.receiptPrinted) {
          actions.push({
            label: 'Imprimir Recibo',
            action: () => handlePrintReceipt(rental.id),
            variant: 'outline'
          });
        }
        break;
        
      case 'aguardando_lalamove':
        actions.push({
          label: 'Cancelar Solicitação',
          action: () => handleCancelLalamove(rental.id),
          variant: 'outline'
        });
        break;
        
      case 'aguardando_motorista':
        actions.push({
          label: 'Motorista Chegou',
          action: () => handleStatusChange(rental.id, 'indo_cliente'),
          variant: 'primary'
        });
        break;
        
      case 'indo_cliente':
        actions.push({
          label: 'Acompanhar Entrega',
          action: () => handleTrackDelivery(rental.id),
          variant: 'outline'
        });
        actions.push({
          label: 'Marcar como Entregue',
          action: () => handleStatusChange(rental.id, 'entregue'),
          variant: 'primary'
        });
        break;
        
      case 'entregue':
        actions.push({
          label: 'Confirmar Entrega',
          action: () => handleStatusChange(rental.id, 'em_uso'),
          variant: 'primary'
        });
        break;
        
      case 'em_uso':
        actions.push({
          label: 'Cliente Solicitou Devolução',
          action: () => handleStatusChange(rental.id, 'devolucao_solicitada'),
          variant: 'outline'
        });
        break;
        
      case 'devolucao_solicitada':
        actions.push({
          label: 'Solicitar Coleta',
          action: () => handleRequestPickup(rental.id),
          variant: 'primary'
        });
        break;
        
      case 'aguardando_aceite_devolucao':
        actions.push({
          label: 'Cancelar Coleta',
          action: () => handleStatusChange(rental.id, 'em_uso'),
          variant: 'outline'
        });
        break;
        
      case 'motorista_indo_cliente':
        actions.push({
          label: 'Motorista Coletou',
          action: () => handleStatusChange(rental.id, 'voltando_loja'),
          variant: 'primary'
        });
        break;
        
      case 'voltando_loja':
        actions.push({
          label: 'Produto Chegou',
          action: () => handleStatusChange(rental.id, 'conferencia'),
          variant: 'primary'
        });
        actions.push({
          label: 'Acompanhar Retorno',
          action: () => handleTrackReturn(rental.id),
          variant: 'outline'
        });
        break;
        
      case 'conferencia':
        actions.push({
          label: 'Iniciar Conferência',
          action: () => handleStartInspection(rental.id),
          variant: 'primary'
        });
        break;
    }
    
    // Ação sempre disponível
    actions.push({
      label: 'Ver Detalhes',
      action: () => handleViewDetails(rental.id),
      variant: 'ghost'
    });
    
    return actions;
  };

  const handleAction = (actionId: string, rentalId: string) => {
    switch (actionId) {
      case 'print_receipt':
        handlePrintReceipt(rentalId);
        break;
      case 'request_lalamove':
        handleRequestLalamove(rentalId);
        break;
      default:
        console.log(`Ação ${actionId} para locação ${rentalId}`);
    }
  };

  return (
    <ProtectedRoute requiredPermissions={[Permission.RENTALS_VIEW]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Locações</h1>
            <p className="text-gray-600">
              <RoleBasedContent
                marketplaceContent="Visualize todas as locações da plataforma"
                partnerContent="Gerencie suas locações"
              />
            </p>
          </div>
          
          <PermissionGuard permission={Permission.RENTALS_CREATE}>
            <Link
              href="/rentals/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Nova Locação
            </Link>
          </PermissionGuard>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total de Locações</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-green-600">
                R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-600">Receita Total</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-purple-600">
                R$ {stats.averageOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-600">Ticket Médio</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-orange-600">{stats.completionRate}%</div>
              <div className="text-sm text-gray-600">Taxa de Conclusão</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por número do pedido ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="min-w-[200px]">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as RentalStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os Status</option>
                {KANBAN_COLUMNS.map(column => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="bg-white rounded-lg shadow border p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-6 min-w-max pb-4">
                {KANBAN_COLUMNS.map(column => {
                  const columnRentals = getRentalsByStatus(column.id);
                  
                  return (
                    <div key={column.id} className="flex-shrink-0 w-80">
                      {/* Column Header */}
                      <div className={`rounded-lg border-2 ${column.color} p-3 mb-4`}>
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-gray-900">{column.title}</h3>
                          <span className="bg-white text-gray-700 text-sm px-2 py-1 rounded-full">
                            {columnRentals.length}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{column.description}</p>
                      </div>
                      
                      {/* Column Cards */}
                      <div className="space-y-3">
                        {columnRentals.map(rental => (
                          <div key={rental.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">{rental.orderNumber}</h4>
                                <p className="text-sm text-gray-600">{rental.client?.name}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                rental.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                rental.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {rental.paymentStatus === 'paid' ? 'Pago' :
                                 rental.paymentStatus === 'pending' ? 'Pendente' : 'Falhou'}
                              </span>
                            </div>
                            
                            {/* Card Content */}
                            <div className="space-y-2 mb-3">
                              <div className="text-sm text-gray-600">
                                <strong>Período:</strong> {new Date(rental.startDate).toLocaleDateString('pt-BR')} - {new Date(rental.endDate).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-sm text-gray-600">
                                <strong>Valor:</strong> R$ {rental.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-sm text-gray-600">
                                <strong>Itens:</strong> {rental.items.length} produto(s)
                              </div>
                              {rental.receiptPrinted && (
                                <div className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckIcon className="h-3 w-3" />
                                  Recibo impresso
                                </div>
                              )}
                              {rental.substatus && (
                                <div className="text-xs text-blue-600">
                                  <strong>Status:</strong> {
                                    rental.substatus === 'driver_assigned' ? 'Motorista designado' :
                                    rental.substatus === 'on_the_way' ? 'A caminho' :
                                    rental.substatus === 'arrived' ? 'Chegou ao destino' :
                                    rental.substatus === 'delivered' ? 'Entregue' :
                                    rental.substatus
                                  }
                                </div>
                              )}
                              {rental.lalamoveDeliveryId && (
                                <div className="text-xs text-purple-600">
                                  <strong>ID Lalamove:</strong> {rental.lalamoveDeliveryId}
                                </div>
                              )}
                              {rental.returnLalamoveOrderId && (
                                <div className="text-xs text-orange-600">
                                  <strong>Retorno:</strong> {rental.returnLalamoveOrderId}
                                </div>
                              )}
                              {rental.driverInfo && (
                                <div className="text-xs text-green-600">
                                  <strong>Motorista:</strong> {rental.driverInfo.name} - {rental.driverInfo.phone}
                                </div>
                              )}
                              {rental.trackingUrl && (
                                <div className="text-xs text-indigo-600 flex items-center gap-2">
                                  <a href={rental.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline flex items-center gap-1">
                                    <ExternalLinkIcon className="h-3 w-3" />
                                    Acompanhar entrega
                                  </a>
                                  {rental.lalamoveDeliveryId && (
                                    <button
                                      onClick={() => updateRentalFromLalamove(rental.id)}
                                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                      title="Atualizar status"
                                      disabled={lalamoveLoading}
                                    >
                                      <RefreshCwIcon className={`h-3 w-3 ${lalamoveLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                  )}
                                </div>
                              )}
                              {rental.returnTrackingUrl && (
                                 <div className="text-xs text-indigo-600 flex items-center gap-2">
                                   <a href={rental.returnTrackingUrl} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline flex items-center gap-1">
                                     <ExternalLinkIcon className="h-3 w-3" />
                                     Acompanhar retorno
                                   </a>
                                   {rental.returnLalamoveOrderId && (
                                     <button
                                       onClick={() => updateRentalFromLalamove(rental.id)}
                                       className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                       title="Atualizar status"
                                       disabled={lalamoveLoading}
                                     >
                                       <RefreshCwIcon className={`h-3 w-3 ${lalamoveLoading ? 'animate-spin' : ''}`} />
                                     </button>
                                   )}
                                 </div>
                               )}
                               {rental.status === 'conferencia' && (
                                 <div className="text-xs text-purple-600">
                                   <strong>Status:</strong> {rental.inspectionStarted ? 'Conferência em andamento' : 'Aguardando conferência'}
                                   {rental.returnedAt && (
                                     <div>Retornado em: {new Date(rental.returnedAt).toLocaleString('pt-BR')}</div>
                                   )}
                                 </div>
                               )}
                               {rental.returnRequestedAt && (
                                 <div className="text-xs text-orange-600">
                                   <strong>Devolução solicitada:</strong> {new Date(rental.returnRequestedAt).toLocaleString('pt-BR')}
                                 </div>
                               )}
                            </div>
                            
                            {/* Card Actions */}
                            <div className="flex flex-wrap gap-2">
                              {RENTAL_ACTIONS[rental.status]?.map(action => (
                                <button
                                  key={action.id}
                                  onClick={() => handleAction(action.id, rental.id)}
                                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors ${
                                    action.color === 'blue' ? 'border-blue-300 text-blue-700 hover:bg-blue-50' :
                                    action.color === 'green' ? 'border-green-300 text-green-700 hover:bg-green-50' :
                                    action.color === 'purple' ? 'border-purple-300 text-purple-700 hover:bg-purple-50' :
                                    action.color === 'red' ? 'border-red-300 text-red-700 hover:bg-red-50' :
                                    'border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {getActionIcon(action.id)}
                                  {action.label}
                                </button>
                              ))}
                              <Link
                                href={`/rentals/${rental.id}`}
                                className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Ver Detalhes
                              </Link>
                            </div>
                          </div>
                        ))}
                        
                        {columnRentals.length === 0 && (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            Nenhuma locação neste status
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Inspection Modal */}
        {selectedRentalForInspection && (
          <InspectionModal
            isOpen={inspectionModalOpen}
            onClose={() => {
              setInspectionModalOpen(false);
              setSelectedRentalForInspection(null);
            }}
            rental={selectedRentalForInspection}
            onComplete={handleInspectionComplete}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}