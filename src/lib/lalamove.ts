// Serviço de integração com a API do Lalamove

interface LalamoveConfig {
  apiKey: string;
  secret: string;
  baseUrl: string;
  market: string; // 'BR' para Brasil
}

interface LalamoveAddress {
  displayString: string;
  lat: string;
  lng: string;
  country: string;
}

interface LalamoveStop {
  coordinates: {
    lat: string;
    lng: string;
  };
  address: string;
  name?: string;
  phone?: string;
}

interface LalamoveQuotation {
  totalFee: string;
  totalFeeCurrency: string;
  priceBreakdown: {
    base: string;
    extraMileage?: string;
    extraTime?: string;
    specialRequests?: string;
  };
}

interface LalamoveOrder {
  orderId: string;
  quotationId: string;
  priceBreakdown: {
    base: string;
    extraMileage?: string;
    extraTime?: string;
    specialRequests?: string;
  };
  driverLocation?: {
    lat: number;
    lng: number;
    bearing: number;
  };
  status: 'ASSIGNING' | 'ON_GOING' | 'PICKED_UP' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  driverInfo?: {
    name: string;
    phone: string;
    plateNumber: string;
    photo: string;
  };
}

interface CreateOrderRequest {
  serviceType: 'MOTORCYCLE' | 'CAR' | 'VAN' | 'TRUCK';
  specialRequests?: string[];
  language: 'pt_BR';
  stops: LalamoveStop[];
  deliveryInstructions?: string;
  metadata?: Record<string, any>;
}

class LalamoveService {
  private config: LalamoveConfig;

  constructor(config: LalamoveConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const timestamp = Date.now().toString();
    
    // Gerar assinatura HMAC (implementação simplificada)
    const signature = this.generateSignature(method, endpoint, timestamp, body);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `hmac ${this.config.apiKey}:${timestamp}:${signature}`,
      'Market': this.config.market,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Lalamove API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na requisição para Lalamove:', error);
      throw error;
    }
  }

  private generateSignature(method: string, path: string, timestamp: string, body?: any): string {
    // Implementação simplificada da assinatura HMAC
    // Em produção, usar uma biblioteca de criptografia adequada
    const crypto = require('crypto');
    const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body ? JSON.stringify(body) : ''}`;
    return crypto.createHmac('sha256', this.config.secret).update(rawSignature).digest('hex');
  }

  // Obter cotação para uma entrega
  async getQuotation(serviceType: string, stops: LalamoveStop[]): Promise<LalamoveQuotation> {
    const body = {
      serviceType,
      stops,
      language: 'pt_BR'
    };

    return await this.makeRequest('/v3/quotations', 'POST', body);
  }

  // Criar um pedido de entrega
  async createOrder(orderData: CreateOrderRequest): Promise<LalamoveOrder> {
    return await this.makeRequest('/v3/orders', 'POST', orderData);
  }

  // Obter detalhes de um pedido
  async getOrder(orderId: string): Promise<LalamoveOrder> {
    return await this.makeRequest(`/v3/orders/${orderId}`);
  }

  // Cancelar um pedido
  async cancelOrder(orderId: string): Promise<{ message: string }> {
    return await this.makeRequest(`/v3/orders/${orderId}`, 'DELETE');
  }

  // Obter localização do motorista
  async getDriverLocation(orderId: string): Promise<{ lat: number; lng: number; bearing: number }> {
    const order = await this.getOrder(orderId);
    return order.driverLocation || { lat: 0, lng: 0, bearing: 0 };
  }

  // Converter endereço em coordenadas (geocoding)
  async geocodeAddress(address: string): Promise<{ lat: string; lng: string }> {
    // Implementação usando API de geocoding do Lalamove ou Google Maps
    // Por enquanto, retorna coordenadas mockadas
    return {
      lat: '-23.5505',
      lng: '-46.6333'
    };
  }
}

// Configuração padrão (usar variáveis de ambiente em produção)
const lalamoveConfig: LalamoveConfig = {
  apiKey: process.env.LALAMOVE_API_KEY || 'test_api_key',
  secret: process.env.LALAMOVE_SECRET || 'test_secret',
  baseUrl: process.env.LALAMOVE_BASE_URL || 'https://rest.sandbox.lalamove.com',
  market: 'BR'
};

// Instância singleton do serviço
export const lalamoveService = new LalamoveService(lalamoveConfig);

// Funções utilitárias para o sistema de locação
export class RentalLalamoveIntegration {
  // Solicitar entrega para o cliente
  static async requestDelivery(rental: any): Promise<{ orderId: string; quotation: LalamoveQuotation }> {
    try {
      // Preparar endereços
      const storeCoords = await lalamoveService.geocodeAddress(rental.storeAddress || 'Rua da Loja, 123, São Paulo, SP');
      const customerCoords = await lalamoveService.geocodeAddress(rental.deliveryAddress);

      const stops = [
        {
          coordinates: storeCoords,
          address: rental.storeAddress || 'Rua da Loja, 123, São Paulo, SP',
          name: 'ProRentals - Loja',
          phone: '+5511999999999'
        },
        {
          coordinates: customerCoords,
          address: rental.deliveryAddress,
          name: rental.customerName,
          phone: rental.customerPhone
        }
      ];

      // Obter cotação
      const quotation = await lalamoveService.getQuotation('MOTORCYCLE', stops);

      // Criar pedido
      const order = await lalamoveService.createOrder({
        serviceType: 'MOTORCYCLE',
        language: 'pt_BR',
        stops,
        deliveryInstructions: `Entrega de equipamento alugado. Pedido: ${rental.id}`,
        metadata: {
          rentalId: rental.id,
          type: 'delivery'
        }
      });

      return {
        orderId: order.orderId,
        quotation
      };
    } catch (error) {
      console.error('Erro ao solicitar entrega:', error);
      throw new Error('Falha ao solicitar entrega via Lalamove');
    }
  }

  // Solicitar coleta/devolução do cliente
  static async requestPickup(rental: any): Promise<{ orderId: string; quotation: LalamoveQuotation }> {
    try {
      const customerCoords = await lalamoveService.geocodeAddress(rental.deliveryAddress);
      const storeCoords = await lalamoveService.geocodeAddress(rental.storeAddress || 'Rua da Loja, 123, São Paulo, SP');

      const stops = [
        {
          coordinates: customerCoords,
          address: rental.deliveryAddress,
          name: rental.customerName,
          phone: rental.customerPhone
        },
        {
          coordinates: storeCoords,
          address: rental.storeAddress || 'Rua da Loja, 123, São Paulo, SP',
          name: 'ProRentals - Loja',
          phone: '+5511999999999'
        }
      ];

      const quotation = await lalamoveService.getQuotation('MOTORCYCLE', stops);

      const order = await lalamoveService.createOrder({
        serviceType: 'MOTORCYCLE',
        language: 'pt_BR',
        stops,
        deliveryInstructions: `Coleta de equipamento alugado para devolução. Pedido: ${rental.id}`,
        metadata: {
          rentalId: rental.id,
          type: 'pickup'
        }
      });

      return {
        orderId: order.orderId,
        quotation
      };
    } catch (error) {
      console.error('Erro ao solicitar coleta:', error);
      throw new Error('Falha ao solicitar coleta via Lalamove');
    }
  }

  // Rastrear pedido
  static async trackOrder(orderId: string): Promise<LalamoveOrder> {
    try {
      return await lalamoveService.getOrder(orderId);
    } catch (error) {
      console.error('Erro ao rastrear pedido:', error);
      throw new Error('Falha ao rastrear pedido');
    }
  }

  // Cancelar pedido
  static async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await lalamoveService.cancelOrder(orderId);
      return true;
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      return false;
    }
  }

  // Obter URL de rastreamento
  static getTrackingUrl(orderId: string): string {
    return `https://www.lalamove.com/track/${orderId}`;
  }

  // Mapear status do Lalamove para status do sistema
  static mapLalamoveStatus(lalamoveStatus: string): { status: string; substatus?: string } {
    switch (lalamoveStatus) {
      case 'ASSIGNING':
        return { status: 'aguardando_motorista' };
      case 'ON_GOING':
        return { status: 'indo_cliente', substatus: 'on_the_way' };
      case 'PICKED_UP':
        return { status: 'em_transporte', substatus: 'picked_up' };
      case 'COMPLETED':
        return { status: 'entregue' };
      case 'CANCELLED':
        return { status: 'cancelado' };
      case 'EXPIRED':
        return { status: 'expirado' };
      default:
        return { status: 'desconhecido' };
    }
  }
}

export type { LalamoveOrder, LalamoveQuotation, LalamoveStop };