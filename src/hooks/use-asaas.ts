'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  AsaasCustomer,
  AsaasPayment,
  AsaasCreditCard,
  AsaasCustomerResponse,
  AsaasPaymentResponse,
  AsaasUtils,
} from '@/lib/asaas';

export interface AsaasHookState {
  loading: boolean;
  error: string | null;
  customers: AsaasCustomerResponse[];
  payments: AsaasPaymentResponse[];
  currentCustomer: AsaasCustomerResponse | null;
  currentPayment: AsaasPaymentResponse | null;
}

export interface CreatePaymentParams {
  customerId: string;
  amount: number;
  dueDate: string;
  description?: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  installments?: number;
  externalReference?: string;
}

export interface PayWithCreditCardParams {
  paymentId: string;
  creditCard: AsaasCreditCard;
  holderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
  remoteIp?: string;
}

export function useAsaas() {
  const [state, setState] = useState<AsaasHookState>({
    loading: false,
    error: null,
    customers: [],
    payments: [],
    currentCustomer: null,
    currentPayment: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
    if (error) {
      toast.error(error);
    }
  }, []);

  // Operações de Cliente
  const createCustomer = useCallback(async (customerData: AsaasCustomer): Promise<AsaasCustomerResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/asaas/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar cliente');
      }

      const customer = await response.json();
      setState(prev => ({
        ...prev,
        customers: [...prev.customers, customer],
        currentCustomer: customer,
      }));

      toast.success('Cliente criado com sucesso!');
      return customer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getCustomer = useCallback(async (customerId: string): Promise<AsaasCustomerResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asaas/customers/${customerId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar cliente');
      }

      const customer = await response.json();
      setState(prev => ({ ...prev, currentCustomer: customer }));
      return customer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const updateCustomer = useCallback(async (
    customerId: string,
    customerData: Partial<AsaasCustomer>
  ): Promise<AsaasCustomerResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asaas/customers/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar cliente');
      }

      const customer = await response.json();
      setState(prev => ({
        ...prev,
        customers: prev.customers.map(c => c.id === customerId ? customer : c),
        currentCustomer: prev.currentCustomer?.id === customerId ? customer : prev.currentCustomer,
      }));

      toast.success('Cliente atualizado com sucesso!');
      return customer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const listCustomers = useCallback(async (params?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    limit?: number;
    offset?: number;
  }): Promise<AsaasCustomerResponse[]> => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/asaas/customers?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao listar clientes');
      }

      const data = await response.json();
      setState(prev => ({ ...prev, customers: data.data || [] }));
      return data.data || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const deleteCustomer = useCallback(async (customerId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asaas/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir cliente');
      }

      setState(prev => ({
        ...prev,
        customers: prev.customers.filter(c => c.id !== customerId),
        currentCustomer: prev.currentCustomer?.id === customerId ? null : prev.currentCustomer,
      }));

      toast.success('Cliente excluído com sucesso!');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Operações de Pagamento
  const createPayment = useCallback(async (params: CreatePaymentParams): Promise<AsaasPaymentResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const paymentData: AsaasPayment = {
        customer: params.customerId,
        billingType: params.billingType,
        value: params.amount,
        dueDate: params.dueDate,
        description: params.description,
        externalReference: params.externalReference,
        installmentCount: params.installments,
      };

      const response = await fetch('/api/asaas/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar pagamento');
      }

      const payment = await response.json();
      setState(prev => ({
        ...prev,
        payments: [...prev.payments, payment],
        currentPayment: payment,
      }));

      toast.success('Pagamento criado com sucesso!');
      return payment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getPayment = useCallback(async (paymentId: string): Promise<AsaasPaymentResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asaas/payments/${paymentId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar pagamento');
      }

      const payment = await response.json();
      setState(prev => ({ ...prev, currentPayment: payment }));
      return payment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const listPayments = useCallback(async (params?: {
    customer?: string;
    status?: string;
    billingType?: string;
    dateCreated?: string;
    dueDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<AsaasPaymentResponse[]> => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/asaas/payments?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao listar pagamentos');
      }

      const data = await response.json();
      setState(prev => ({ ...prev, payments: data.data || [] }));
      return data.data || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const payWithCreditCard = useCallback(async (params: PayWithCreditCardParams): Promise<AsaasPaymentResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asaas/payments/${params.paymentId}/credit-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditCard: params.creditCard,
          holderInfo: params.holderInfo,
          remoteIp: params.remoteIp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar pagamento');
      }

      const payment = await response.json();
      setState(prev => ({
        ...prev,
        payments: prev.payments.map(p => p.id === params.paymentId ? payment : p),
        currentPayment: prev.currentPayment?.id === params.paymentId ? payment : prev.currentPayment,
      }));

      toast.success('Pagamento processado com sucesso!');
      return payment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getPixQrCode = useCallback(async (paymentId: string): Promise<{
    encodedImage: string;
    payload: string;
    expirationDate: string;
  } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asaas/payments/${paymentId}/pix`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar QR Code PIX');
      }

      const pixData = await response.json();
      return pixData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getBankSlip = useCallback(async (paymentId: string): Promise<{
    identificationField: string;
    nossoNumero: string;
    barCode: string;
    bankSlipUrl: string;
  } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asaas/payments/${paymentId}/boleto`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar boleto');
      }

      const boletoData = await response.json();
      return boletoData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const refundPayment = useCallback(async (
    paymentId: string,
    value?: number,
    description?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asaas/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao estornar pagamento');
      }

      // Atualizar o pagamento na lista
      const updatedPayment = await getPayment(paymentId);
      if (updatedPayment) {
        setState(prev => ({
          ...prev,
          payments: prev.payments.map(p => p.id === paymentId ? updatedPayment : p),
        }));
      }

      toast.success('Estorno realizado com sucesso!');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, getPayment]);

  const deletePayment = useCallback(async (paymentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asaas/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir pagamento');
      }

      setState(prev => ({
        ...prev,
        payments: prev.payments.filter(p => p.id !== paymentId),
        currentPayment: prev.currentPayment?.id === paymentId ? null : prev.currentPayment,
      }));

      toast.success('Pagamento excluído com sucesso!');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Funções utilitárias
  const formatCurrency = useCallback((value: number): string => {
    return AsaasUtils.formatCurrency(value);
  }, []);

  const formatDate = useCallback((date: string | Date): string => {
    return AsaasUtils.formatDate(date);
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    return AsaasUtils.getStatusColor(status);
  }, []);

  const getStatusLabel = useCallback((status: string): string => {
    return AsaasUtils.getStatusLabel(status);
  }, []);

  const getBillingTypeLabel = useCallback((billingType: string): string => {
    return AsaasUtils.getBillingTypeLabel(billingType);
  }, []);

  const validateCpfCnpj = useCallback((cpfCnpj: string): boolean => {
    return AsaasUtils.validateCpfCnpj(cpfCnpj);
  }, []);

  // Limpar estado
  const clearState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      customers: [],
      payments: [],
      currentCustomer: null,
      currentPayment: null,
    });
  }, []);

  return {
    // Estado
    ...state,
    
    // Operações de Cliente
    createCustomer,
    getCustomer,
    updateCustomer,
    listCustomers,
    deleteCustomer,
    
    // Operações de Pagamento
    createPayment,
    getPayment,
    listPayments,
    payWithCreditCard,
    getPixQrCode,
    getBankSlip,
    refundPayment,
    deletePayment,
    
    // Utilitários
    formatCurrency,
    formatDate,
    getStatusColor,
    getStatusLabel,
    getBillingTypeLabel,
    validateCpfCnpj,
    clearState,
  };
}

export default useAsaas;