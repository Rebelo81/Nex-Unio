import { NextRequest, NextResponse } from 'next/server';
import { RentalLalamoveIntegration } from '@/lib/lalamove';

// Interface para o payload do webhook do Lalamove
interface LalamoveWebhookPayload {
  orderId: string;
  status: 'ASSIGNING' | 'ON_GOING' | 'PICKED_UP' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  driverLocation?: {
    lat: number;
    lng: number;
    bearing: number;
  };
  driverInfo?: {
    name: string;
    phone: string;
    plateNumber: string;
    photo: string;
  };
  timestamp: string;
  eventType: 'ORDER_STATUS_CHANGED' | 'DRIVER_LOCATION_UPDATED' | 'DRIVER_ASSIGNED';
}

// Função para validar a assinatura do webhook (implementação simplificada)
function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // Em produção, implementar validação HMAC adequada
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

// Função para atualizar o status da locação no banco de dados
async function updateRentalStatus(orderId: string, webhookData: LalamoveWebhookPayload) {
  try {
    // Em produção, buscar a locação no banco de dados pelo lalamoveDeliveryId ou returnLalamoveOrderId
    console.log(`Atualizando status da locação para pedido Lalamove: ${orderId}`);
    
    const mappedStatus = RentalLalamoveIntegration.mapLalamoveStatus(webhookData.status);
    
    // Aqui seria feita a atualização no banco de dados
    // Exemplo com Prisma:
    // await prisma.rental.updateMany({
    //   where: {
    //     OR: [
    //       { lalamoveDeliveryId: orderId },
    //       { returnLalamoveOrderId: orderId }
    //     ]
    //   },
    //   data: {
    //     status: mappedStatus.status,
    //     substatus: mappedStatus.substatus,
    //     lalamoveStatus: webhookData.status,
    //     driverInfo: webhookData.driverInfo,
    //     updatedAt: new Date()
    //   }
    // });
    
    // Enviar notificação em tempo real via WebSocket ou Server-Sent Events
    await sendRealTimeUpdate(orderId, webhookData);
    
    // Enviar notificação por email/SMS se necessário
    if (webhookData.status === 'COMPLETED') {
      await sendCompletionNotification(orderId);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status da locação:', error);
    return false;
  }
}

// Função para enviar atualizações em tempo real
async function sendRealTimeUpdate(orderId: string, webhookData: LalamoveWebhookPayload) {
  // Implementar WebSocket ou Server-Sent Events para notificações em tempo real
  console.log('Enviando atualização em tempo real:', { orderId, status: webhookData.status });
  
  // Exemplo com Pusher ou Socket.io:
  // pusher.trigger('rentals-channel', 'status-updated', {
  //   orderId,
  //   status: webhookData.status,
  //   timestamp: webhookData.timestamp
  // });
}

// Função para enviar notificação de conclusão
async function sendCompletionNotification(orderId: string) {
  console.log('Enviando notificação de conclusão para:', orderId);
  
  // Implementar envio de email/SMS
  // await emailService.sendDeliveryCompletionEmail(rental.client.email, rental);
  // await smsService.sendDeliveryCompletionSMS(rental.client.phone, rental);
}

// Handler para requisições POST (webhook do Lalamove)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-lalamove-signature') || '';
    const webhookSecret = process.env.LALAMOVE_WEBHOOK_SECRET || 'default_secret';
    
    // Validar assinatura do webhook
    if (!validateWebhookSignature(body, signature, webhookSecret)) {
      console.error('Assinatura do webhook inválida');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }
    
    const webhookData: LalamoveWebhookPayload = JSON.parse(body);
    
    console.log('Webhook recebido do Lalamove:', {
      orderId: webhookData.orderId,
      status: webhookData.status,
      eventType: webhookData.eventType,
      timestamp: webhookData.timestamp
    });
    
    // Processar diferentes tipos de eventos
    switch (webhookData.eventType) {
      case 'ORDER_STATUS_CHANGED':
        const success = await updateRentalStatus(webhookData.orderId, webhookData);
        if (!success) {
          return NextResponse.json(
            { error: 'Failed to update rental status' },
            { status: 500 }
          );
        }
        break;
        
      case 'DRIVER_ASSIGNED':
        console.log('Motorista designado:', webhookData.driverInfo);
        await updateRentalStatus(webhookData.orderId, webhookData);
        break;
        
      case 'DRIVER_LOCATION_UPDATED':
        console.log('Localização do motorista atualizada:', webhookData.driverLocation);
        // Atualizar apenas a localização sem mudar o status
        break;
        
      default:
        console.log('Tipo de evento não reconhecido:', webhookData.eventType);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Erro ao processar webhook do Lalamove:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handler para requisições GET (verificação de saúde)
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'lalamove-webhook',
    timestamp: new Date().toISOString()
  });
}

// Configuração do webhook
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';