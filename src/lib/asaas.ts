import { z } from 'zod';

// Schemas de validação
export const AsaasCustomerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  complement: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('Brasil'),
  observations: z.string().optional(),
});

export const AsaasPaymentSchema = z.object({
  customer: z.string().min(1, 'Cliente é obrigatório'),
  billingType: z.enum(['BOLETO', 'CREDIT_CARD', 'PIX', 'UNDEFINED']),
  value: z.number().positive('Valor deve ser positivo'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  description: z.string().optional(),
  externalReference: z.string().optional(),
  installmentCount: z.number().optional(),
  installmentValue: z.number().optional(),
  discount: z.object({
    value: z.number().optional(),
    dueDateLimitDays: z.number().optional(),
    type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
  }).optional(),
  interest: z.object({
    value: z.number().optional(),
    type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
  }).optional(),
  fine: z.object({
    value: z.number().optional(),
    type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
  }).optional(),
  postalService: z.boolean().optional(),
  split: z.array(z.object({
    walletId: z.string(),
    fixedValue: z.number().optional(),
    percentualValue: z.number().optional(),
  })).optional(),
});

export const AsaasCreditCardSchema = z.object({
  holderName: z.string().min(1, 'Nome do portador é obrigatório'),
  number: z.string().min(13, 'Número do cartão inválido'),
  expiryMonth: z.string().length(2, 'Mês deve ter 2 dígitos'),
  expiryYear: z.string().length(4, 'Ano deve ter 4 dígitos'),
  ccv: z.string().min(3, 'CCV inválido'),
});

// Tipos TypeScript
export type AsaasCustomer = z.infer<typeof AsaasCustomerSchema>;
export type AsaasPayment = z.infer<typeof AsaasPaymentSchema>;
export type AsaasCreditCard = z.infer<typeof AsaasCreditCardSchema>;

export interface AsaasCustomerResponse {
  object: 'customer';
  id: string;
  dateCreated: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  country: string;
  observations?: string;
  deleted: boolean;
  additionalEmails?: string;
  externalReference?: string;
  notificationDisabled: boolean;
  cityInscription?: string;
  stateInscription?: string;
  canDelete: boolean;
  cannotBeDeletedReason?: string;
  canEdit: boolean;
  cannotEditReason?: string;
}

export interface AsaasPaymentResponse {
  object: 'payment';
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  value: number;
  netValue: number;
  originalValue?: number;
  interestValue?: number;
  description?: string;
  billingType: string;
  pixTransaction?: any;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'REFUND_IN_PROGRESS' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  dueDate: string;
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  invoiceUrl: string;
  invoiceNumber: string;
  externalReference?: string;
  deleted: boolean;
  anticipated: boolean;
  anticipable: boolean;
  creditDate?: string;
  estimatedCreditDate?: string;
  transactionReceiptUrl?: string;
  nossoNumero?: string;
  bankSlipUrl?: string;
  lastInvoiceViewedDate?: string;
  lastBankSlipViewedDate?: string;
  discount?: {
    value: number;
    limitDate?: string;
    dueDateLimitDays: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  postalService: boolean;
  custody?: string;
  refunds?: any[];
}

export interface AsaasWebhookEvent {
  event: string;
  payment: AsaasPaymentResponse;
  dateCreated: string;
}

// Configuração da API
const ASAAS_BASE_URL = process.env.ASAAS_ENVIRONMENT === 'production' 
  ? 'https://www.asaas.com/api/v3'
  : 'https://sandbox.asaas.com/api/v3';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || 'demo_key';

// Aviso se a API key não estiver configurada
if (!process.env.ASAAS_API_KEY) {
  console.warn('⚠️  ASAAS_API_KEY não configurada. Configure no arquivo .env.local para usar a integração real.');
}

// Cliente HTTP para Asaas
class AsaasClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = ASAAS_BASE_URL;
    this.apiKey = ASAAS_API_KEY!;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erro na API Asaas: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    return response.json();
  }

  // Métodos para Clientes
  async createCustomer(customerData: AsaasCustomer): Promise<AsaasCustomerResponse> {
    const validatedData = AsaasCustomerSchema.parse(customerData);
    return this.request<AsaasCustomerResponse>('/customers', {
      method: 'POST',
      body: JSON.stringify(validatedData),
    });
  }

  async getCustomer(customerId: string): Promise<AsaasCustomerResponse> {
    return this.request<AsaasCustomerResponse>(`/customers/${customerId}`);
  }

  async updateCustomer(
    customerId: string,
    customerData: Partial<AsaasCustomer>
  ): Promise<AsaasCustomerResponse> {
    return this.request<AsaasCustomerResponse>(`/customers/${customerId}`, {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async listCustomers(params?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    groupName?: string;
    externalReference?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ object: string; hasMore: boolean; totalCount: number; limit: number; offset: number; data: AsaasCustomerResponse[] }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/customers${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async deleteCustomer(customerId: string): Promise<{ deleted: boolean; id: string }> {
    return this.request(`/customers/${customerId}`, {
      method: 'DELETE',
    });
  }

  // Métodos para Pagamentos
  async createPayment(paymentData: AsaasPayment): Promise<AsaasPaymentResponse> {
    const validatedData = AsaasPaymentSchema.parse(paymentData);
    return this.request<AsaasPaymentResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify(validatedData),
    });
  }

  async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>(`/payments/${paymentId}`);
  }

  async updatePayment(
    paymentId: string,
    paymentData: Partial<AsaasPayment>
  ): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>(`/payments/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async deletePayment(paymentId: string): Promise<{ deleted: boolean; id: string }> {
    return this.request(`/payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  async listPayments(params?: {
    customer?: string;
    customerGroupName?: string;
    billingType?: string;
    status?: string;
    subscription?: string;
    installment?: string;
    externalReference?: string;
    paymentDate?: string;
    estimatedCreditDate?: string;
    pixQrCodeId?: string;
    anticipated?: boolean;
    dateCreated?: string;
    dueDate?: string;
    user?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ object: string; hasMore: boolean; totalCount: number; limit: number; offset: number; data: AsaasPaymentResponse[] }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/payments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Métodos para Pagamento com Cartão de Crédito
  async payWithCreditCard(
    paymentId: string,
    creditCardData: AsaasCreditCard,
    creditCardHolderInfo?: {
      name: string;
      email: string;
      cpfCnpj: string;
      postalCode: string;
      addressNumber: string;
      addressComplement?: string;
      phone: string;
      mobilePhone?: string;
    },
    remoteIp?: string
  ): Promise<AsaasPaymentResponse> {
    const validatedCreditCard = AsaasCreditCardSchema.parse(creditCardData);
    
    const payload: any = {
      creditCard: validatedCreditCard,
    };

    if (creditCardHolderInfo) {
      payload.creditCardHolderInfo = creditCardHolderInfo;
    }

    if (remoteIp) {
      payload.remoteIp = remoteIp;
    }

    return this.request<AsaasPaymentResponse>(`/payments/${paymentId}/payWithCreditCard`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Métodos para PIX
  async getPixQrCode(paymentId: string): Promise<{
    encodedImage: string;
    payload: string;
    expirationDate: string;
  }> {
    return this.request(`/payments/${paymentId}/pixQrCode`);
  }

  // Métodos para Boleto
  async getBankSlip(paymentId: string): Promise<{
    identificationField: string;
    nossoNumero: string;
    barCode: string;
    bankSlipUrl: string;
  }> {
    return this.request(`/payments/${paymentId}/identificationField`);
  }

  // Métodos para Estorno
  async refundPayment(
    paymentId: string,
    value?: number,
    description?: string
  ): Promise<{
    object: string;
    id: string;
    dateCreated: string;
    status: string;
    value: number;
    description?: string;
    transactionReceiptUrl?: string;
  }> {
    const payload: any = {};
    if (value) payload.value = value;
    if (description) payload.description = description;

    return this.request(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Métodos para Webhooks
  async listWebhooks(): Promise<{
    object: string;
    hasMore: boolean;
    totalCount: number;
    limit: number;
    offset: number;
    data: Array<{
      object: string;
      id: string;
      name: string;
      url: string;
      email: string;
      enabled: boolean;
      interrupted: boolean;
      authToken?: string;
      events: string[];
    }>;
  }> {
    return this.request('/webhooks');
  }

  async createWebhook(webhookData: {
    name: string;
    url: string;
    email: string;
    events: string[];
    authToken?: string;
    enabled?: boolean;
  }): Promise<{
    object: string;
    id: string;
    name: string;
    url: string;
    email: string;
    enabled: boolean;
    interrupted: boolean;
    authToken?: string;
    events: string[];
  }> {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(webhookData),
    });
  }

  // Método para validar webhook
  validateWebhook(payload: string, signature: string, webhookToken: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', webhookToken)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }
}

// Instância singleton do cliente
export const asaasClient = new AsaasClient();

// Funções utilitárias
export const AsaasUtils = {
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },

  formatDate: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
  },

  getStatusColor: (status: string): string => {
    const statusColors: Record<string, string> = {
      PENDING: 'yellow',
      RECEIVED: 'green',
      CONFIRMED: 'green',
      OVERDUE: 'red',
      REFUNDED: 'gray',
      RECEIVED_IN_CASH: 'green',
      REFUND_REQUESTED: 'orange',
      REFUND_IN_PROGRESS: 'orange',
      CHARGEBACK_REQUESTED: 'red',
      CHARGEBACK_DISPUTE: 'red',
      AWAITING_CHARGEBACK_REVERSAL: 'orange',
      DUNNING_REQUESTED: 'red',
      DUNNING_RECEIVED: 'red',
      AWAITING_RISK_ANALYSIS: 'yellow',
    };
    return statusColors[status] || 'gray';
  },

  getStatusLabel: (status: string): string => {
    const statusLabels: Record<string, string> = {
      PENDING: 'Pendente',
      RECEIVED: 'Recebido',
      CONFIRMED: 'Confirmado',
      OVERDUE: 'Vencido',
      REFUNDED: 'Estornado',
      RECEIVED_IN_CASH: 'Recebido em Dinheiro',
      REFUND_REQUESTED: 'Estorno Solicitado',
      REFUND_IN_PROGRESS: 'Estorno em Andamento',
      CHARGEBACK_REQUESTED: 'Chargeback Solicitado',
      CHARGEBACK_DISPUTE: 'Chargeback em Disputa',
      AWAITING_CHARGEBACK_REVERSAL: 'Aguardando Reversão de Chargeback',
      DUNNING_REQUESTED: 'Cobrança Solicitada',
      DUNNING_RECEIVED: 'Cobrança Recebida',
      AWAITING_RISK_ANALYSIS: 'Aguardando Análise de Risco',
    };
    return statusLabels[status] || status;
  },

  getBillingTypeLabel: (billingType: string): string => {
    const billingTypeLabels: Record<string, string> = {
      BOLETO: 'Boleto Bancário',
      CREDIT_CARD: 'Cartão de Crédito',
      PIX: 'PIX',
      UNDEFINED: 'Não Definido',
    };
    return billingTypeLabels[billingType] || billingType;
  },

  validateCpfCnpj: (cpfCnpj: string): boolean => {
    const cleanCpfCnpj = cpfCnpj.replace(/[^\d]/g, '');
    
    if (cleanCpfCnpj.length === 11) {
      // Validação de CPF
      if (/^(\d)\1{10}$/.test(cleanCpfCnpj)) return false;
      
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCpfCnpj.charAt(i)) * (10 - i);
      }
      let remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cleanCpfCnpj.charAt(9))) return false;
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCpfCnpj.charAt(i)) * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      return remainder === parseInt(cleanCpfCnpj.charAt(10));
    } else if (cleanCpfCnpj.length === 14) {
      // Validação de CNPJ
      if (/^(\d)\1{13}$/.test(cleanCpfCnpj)) return false;
      
      let sum = 0;
      let weight = 2;
      for (let i = 11; i >= 0; i--) {
        sum += parseInt(cleanCpfCnpj.charAt(i)) * weight;
        weight = weight === 9 ? 2 : weight + 1;
      }
      let remainder = sum % 11;
      const digit1 = remainder < 2 ? 0 : 11 - remainder;
      if (digit1 !== parseInt(cleanCpfCnpj.charAt(12))) return false;
      
      sum = 0;
      weight = 2;
      for (let i = 12; i >= 0; i--) {
        sum += parseInt(cleanCpfCnpj.charAt(i)) * weight;
        weight = weight === 9 ? 2 : weight + 1;
      }
      remainder = sum % 11;
      const digit2 = remainder < 2 ? 0 : 11 - remainder;
      return digit2 === parseInt(cleanCpfCnpj.charAt(13));
    }
    
    return false;
  },
};

export default asaasClient;