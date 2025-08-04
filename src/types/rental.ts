// Tipos para o sistema de locações

import { Equipment } from './equipment';
import { Client, Partner } from './index';

export interface Rental {
  id: string;
  orderNumber: string;
  clientId: string;
  client?: Client;
  partnerId: string;
  partner?: Partner;
  
  // Produtos
  items: RentalItem[];
  
  // Datas
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Valores
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  securityDeposit: number;
  paidAmount: number;
  damageAmount?: number; // Valor de avarias
  
  // Status
  status: RentalStatus;
  paymentStatus: PaymentStatus;
  
  // Logística
  deliveryAddress: Address;
  pickupAddress?: Address;
  deliveryMethod: 'pickup' | 'delivery';
  lalamoveDeliveryId?: string;
  lalamovePickupId?: string;
  returnLalamoveOrderId?: string;
  trackingUrl?: string;
  returnTrackingUrl?: string;
  
  // Motorista e entrega
  driverInfo?: {
    name: string;
    phone: string;
    vehicleInfo: string;
  };
  
  // Recibos e fotos
  deliveryReceiptPhoto?: string;
  returnReceiptPhoto?: string;
  
  // Observações
  notes?: string;
  internalNotes?: string;
  
  // Checklist de entrega/devolução
  deliveryChecklist?: CompletedChecklistItem[];
  returnChecklist?: CompletedChecklistItem[];
  returnedAt?: Date;
  returnCondition?: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Avarias encontradas na conferência
  damages?: DamageReport[];
  
  // Status de conferência
  inspectionCompleted?: boolean;
  inspectedBy?: string;
  inspectionDate?: Date;
  
  // Controle de impressão
  receiptPrinted: boolean;
  receiptPrintedAt?: Date;
  receiptPrintedBy?: string;
}

// Status principais do Kanban
export type RentalStatus = 
  | 'separacao'           // Separar Pedido
  | 'pronto_envio'        // Pronto para Envio (após impressão)
  | 'solicitar_lalamove'  // Solicitar Lalamove
  | 'aguardando_lalamove' // Aguardando Aceite da Lalamove
  | 'aguardando_motorista' // Aguardando Motorista
  | 'indo_cliente'        // Indo ao Cliente
  | 'entregue'           // Entregue ao Cliente
  | 'em_uso'             // Em Uso pelo Cliente
  | 'devolucao_solicitada' // Devolução Solicitada
  | 'aguardando_aceite_devolucao' // Aguardando Aceite Devolução
  | 'motorista_indo_cliente' // Motorista Indo ao Cliente (devolução)
  | 'voltando_loja'      // Voltando para Loja
  | 'conferencia'        // Em Conferência
  | 'finalizado'         // Finalizado
  | 'cancelado';         // Cancelado

export type PaymentStatus = 
  | 'pending'     // Pendente
  | 'paid'        // Pago
  | 'partial'     // Parcial
  | 'refunded'    // Reembolsado
  | 'failed';     // Falhou

export interface RentalItem {
  id: string;
  equipmentId: string;
  equipment?: Equipment;
  quantity: number;
  dailyRate: number;
  days: number;
  discountApplied?: {
    id: string;
    minDays: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    description?: string;
  };
  subtotal: number;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CompletedChecklistItem {
  id: string;
  checklistItemId: string;
  description: string;
  completed: boolean;
  notes?: string;
  completedBy?: string;
  completedAt?: Date;
}

// Interface para relatório de avarias
export interface DamageReport {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  damageValue: number;
  photos: string[];
  reportedBy: string;
  reportedAt: Date;
  status: 'pending' | 'charged' | 'waived';
  asaasChargeId?: string; // ID da cobrança no Asaas
}

// Configuração das colunas do Kanban
export interface KanbanColumn {
  id: RentalStatus;
  title: string;
  description: string;
  color: string;
  order: number;
  allowedTransitions: RentalStatus[];
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'separacao',
    title: 'Separação',
    description: 'Pedidos aguardando separação dos produtos',
    color: 'bg-yellow-100 border-yellow-300',
    order: 1,
    allowedTransitions: ['pronto_envio', 'cancelado']
  },
  {
    id: 'pronto_envio',
    title: 'Pronto p/ Envio',
    description: 'Produtos separados, recibo impresso',
    color: 'bg-blue-100 border-blue-300',
    order: 2,
    allowedTransitions: ['solicitar_lalamove', 'separacao', 'cancelado']
  },
  {
    id: 'solicitar_lalamove',
    title: 'Solicitar Lalamove',
    description: 'Pronto para solicitar entrega',
    color: 'bg-purple-100 border-purple-300',
    order: 3,
    allowedTransitions: ['aguardando_lalamove', 'pronto_envio']
  },
  {
    id: 'aguardando_lalamove',
    title: 'Aguardando Lalamove',
    description: 'Aguardando aceite do entregador',
    color: 'bg-orange-100 border-orange-300',
    order: 4,
    allowedTransitions: ['aguardando_motorista', 'solicitar_lalamove']
  },
  {
    id: 'aguardando_motorista',
    title: 'Aguardando Motorista',
    description: 'Aguardando motorista chegar na loja',
    color: 'bg-amber-100 border-amber-300',
    order: 5,
    allowedTransitions: ['indo_cliente', 'aguardando_lalamove']
  },
  {
    id: 'indo_cliente',
    title: 'Indo ao Cliente',
    description: 'Motorista a caminho do cliente',
    color: 'bg-indigo-100 border-indigo-300',
    order: 6,
    allowedTransitions: ['entregue', 'aguardando_motorista']
  },
  {
    id: 'entregue',
    title: 'Entregue',
    description: 'Produto entregue ao cliente',
    color: 'bg-green-100 border-green-300',
    order: 7,
    allowedTransitions: ['em_uso']
  },
  {
    id: 'em_uso',
    title: 'Em Uso',
    description: 'Cliente utilizando o produto',
    color: 'bg-teal-100 border-teal-300',
    order: 8,
    allowedTransitions: ['devolucao_solicitada']
  },
  {
    id: 'devolucao_solicitada',
    title: 'Devolução Solicitada',
    description: 'Devolução solicitada pelo cliente',
    color: 'bg-pink-100 border-pink-300',
    order: 9,
    allowedTransitions: ['aguardando_aceite_devolucao', 'em_uso']
  },
  {
    id: 'aguardando_aceite_devolucao',
    title: 'Aguardando Aceite Devolução',
    description: 'Aguardando aceite da transportadora para devolução',
    color: 'bg-violet-100 border-violet-300',
    order: 10,
    allowedTransitions: ['motorista_indo_cliente', 'devolucao_solicitada']
  },
  {
    id: 'motorista_indo_cliente',
    title: 'Motorista Indo ao Cliente',
    description: 'Motorista a caminho do cliente para coleta',
    color: 'bg-sky-100 border-sky-300',
    order: 11,
    allowedTransitions: ['voltando_loja', 'aguardando_aceite_devolucao']
  },
  {
    id: 'voltando_loja',
    title: 'Voltando para Loja',
    description: 'Produto sendo trazido de volta para a loja',
    color: 'bg-cyan-100 border-cyan-300',
    order: 12,
    allowedTransitions: ['conferencia', 'motorista_indo_cliente']
  },
  {
    id: 'conferencia',
    title: 'Conferência',
    description: 'Produto em conferência de devolução',
    color: 'bg-lime-100 border-lime-300',
    order: 13,
    allowedTransitions: ['finalizado', 'voltando_loja']
  },
  {
    id: 'finalizado',
    title: 'Finalizado',
    description: 'Locação concluída',
    color: 'bg-gray-100 border-gray-300',
    order: 14,
    allowedTransitions: []
  },
  {
    id: 'cancelado',
    title: 'Cancelado',
    description: 'Pedidos cancelados',
    color: 'bg-red-100 border-red-300',
    order: 15,
    allowedTransitions: []
  }
];

// Filtros para locações
export interface RentalFilters {
  search?: string;
  status?: RentalStatus[];
  paymentStatus?: PaymentStatus[];
  partnerId?: string;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'orderNumber' | 'createdAt' | 'startDate' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

// Resposta da API
export interface RentalListResponse {
  rentals: Rental[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Stats de locações
export interface RentalStats {
  total: number;
  byStatus: Record<RentalStatus, number>;
  totalRevenue: number;
  averageOrderValue: number;
  completionRate: number;
}

// Ações disponíveis para cada status
export interface RentalAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export const RENTAL_ACTIONS: Record<RentalStatus, RentalAction[]> = {
  separacao: [
    {
      id: 'print_receipt',
      label: 'Imprimir Recibo',
      icon: 'printer',
      color: 'blue'
    },
    {
      id: 'cancel',
      label: 'Cancelar',
      icon: 'x',
      color: 'red',
      requiresConfirmation: true,
      confirmationMessage: 'Tem certeza que deseja cancelar este pedido?'
    }
  ],
  pronto_envio: [
    {
      id: 'request_lalamove',
      label: 'Solicitar Lalamove',
      icon: 'truck',
      color: 'purple'
    }
  ],
  solicitar_lalamove: [
    {
      id: 'confirm_lalamove',
      label: 'Confirmar Solicitação',
      icon: 'check',
      color: 'green'
    }
  ],
  aguardando_lalamove: [
    {
      id: 'check_status',
      label: 'Verificar Status',
      icon: 'refresh',
      color: 'blue'
    }
  ],
  em_transporte: [
    {
      id: 'track_delivery',
      label: 'Rastrear Entrega',
      icon: 'map-pin',
      color: 'blue'
    }
  ],
  entregue: [
    {
      id: 'confirm_delivery',
      label: 'Confirmar Entrega',
      icon: 'check-circle',
      color: 'green'
    }
  ],
  em_uso: [
    {
      id: 'schedule_pickup',
      label: 'Agendar Coleta',
      icon: 'calendar',
      color: 'blue'
    }
  ],
  coleta_agendada: [
    {
      id: 'request_pickup',
      label: 'Solicitar Coleta',
      icon: 'truck',
      color: 'purple'
    }
  ],
  em_retorno: [
    {
      id: 'track_pickup',
      label: 'Rastrear Coleta',
      icon: 'map-pin',
      color: 'blue'
    }
  ],
  finalizado: [],
  cancelado: []
};