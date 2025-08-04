'use client';

import { useState, useCallback } from 'react';
import { RentalLalamoveIntegration, LalamoveOrder, LalamoveQuotation } from '@/lib/lalamove';
import { toast } from 'sonner';

interface UseLalamoveReturn {
  // Estados
  isLoading: boolean;
  error: string | null;
  
  // Funções
  requestDelivery: (rental: any) => Promise<{ orderId: string; quotation: LalamoveQuotation } | null>;
  requestPickup: (rental: any) => Promise<{ orderId: string; quotation: LalamoveQuotation } | null>;
  trackOrder: (orderId: string) => Promise<LalamoveOrder | null>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  getTrackingUrl: (orderId: string) => string;
}

export function useLalamove(): UseLalamoveReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: any, defaultMessage: string) => {
    const errorMessage = error?.message || defaultMessage;
    setError(errorMessage);
    toast.error(errorMessage);
    console.error(error);
  }, []);

  const requestDelivery = useCallback(async (rental: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await RentalLalamoveIntegration.requestDelivery(rental);
      
      toast.success('Entrega solicitada com sucesso!', {
        description: `Pedido Lalamove: ${result.orderId}`
      });
      
      return result;
    } catch (error) {
      handleError(error, 'Erro ao solicitar entrega');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const requestPickup = useCallback(async (rental: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await RentalLalamoveIntegration.requestPickup(rental);
      
      toast.success('Coleta solicitada com sucesso!', {
        description: `Pedido Lalamove: ${result.orderId}`
      });
      
      return result;
    } catch (error) {
      handleError(error, 'Erro ao solicitar coleta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const trackOrder = useCallback(async (orderId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const order = await RentalLalamoveIntegration.trackOrder(orderId);
      return order;
    } catch (error) {
      handleError(error, 'Erro ao rastrear pedido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const cancelOrder = useCallback(async (orderId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await RentalLalamoveIntegration.cancelOrder(orderId);
      
      if (success) {
        toast.success('Pedido cancelado com sucesso!');
      } else {
        toast.error('Não foi possível cancelar o pedido');
      }
      
      return success;
    } catch (error) {
      handleError(error, 'Erro ao cancelar pedido');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const getTrackingUrl = useCallback((orderId: string) => {
    return RentalLalamoveIntegration.getTrackingUrl(orderId);
  }, []);

  return {
    isLoading,
    error,
    requestDelivery,
    requestPickup,
    trackOrder,
    cancelOrder,
    getTrackingUrl
  };
}

// Hook para polling de status de pedidos
export function useLalamoveTracking(orderId: string | null, intervalMs: number = 30000) {
  const [order, setOrder] = useState<LalamoveOrder | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const { trackOrder } = useLalamove();

  const startTracking = useCallback(() => {
    if (!orderId) return;
    
    setIsTracking(true);
    
    const interval = setInterval(async () => {
      try {
        const updatedOrder = await trackOrder(orderId);
        if (updatedOrder) {
          setOrder(updatedOrder);
          
          // Parar tracking se o pedido foi finalizado
          if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(updatedOrder.status)) {
            setIsTracking(false);
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Erro no tracking automático:', error);
      }
    }, intervalMs);

    // Cleanup
    return () => {
      clearInterval(interval);
      setIsTracking(false);
    };
  }, [orderId, intervalMs, trackOrder]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  return {
    order,
    isTracking,
    startTracking,
    stopTracking
  };
}