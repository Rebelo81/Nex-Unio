import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asaasClient, AsaasWebhookEvent } from '@/lib/asaas';

// Schema para validação de webhook
const WebhookEventSchema = z.object({
  event: z.string(),
  payment: z.object({
    object: z.literal('payment'),
    id: z.string(),
    dateCreated: z.string(),
    customer: z.string(),
    value: z.number(),
    netValue: z.number(),
    status: z.string(),
    billingType: z.string(),
    dueDate: z.string(),
    originalDueDate: z.string(),
    invoiceUrl: z.string(),
    invoiceNumber: z.string(),
    externalReference: z.string().optional(),
    description: z.string().optional(),
    paymentDate: z.string().optional(),
    clientPaymentDate: z.string().optional(),
  }),
  dateCreated: z.string(),
});

// Schema para criação de webhook
const CreateWebhookSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  url: z.string().url('URL inválida'),
  email: z.string().email('Email inválido'),
  events: z.array(z.string()).min(1, 'Pelo menos um evento deve ser selecionado'),
  authToken: z.string().optional(),
  enabled: z.boolean().default(true),
});

// POST /api/asaas/webhooks - Receber webhook do Asaas
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('asaas-access-token') || '';
    
    // Validar assinatura do webhook
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (webhookToken && !asaasClient.validateWebhook(body, signature, webhookToken)) {
      return NextResponse.json(
        { message: 'Assinatura do webhook inválida' },
        { status: 401 }
      );
    }
    
    // Parse do JSON
    const webhookData = JSON.parse(body);
    
    // Validar estrutura do webhook
    const validatedData = WebhookEventSchema.parse(webhookData);
    
    // Processar evento baseado no tipo
    await processWebhookEvent(validatedData);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Estrutura do webhook inválida',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

// GET /api/asaas/webhooks - Listar webhooks configurados
export async function GET(request: NextRequest) {
  try {
    const webhooks = await asaasClient.listWebhooks();
    return NextResponse.json(webhooks);
  } catch (error) {
    console.error('Erro ao listar webhooks:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

// PUT /api/asaas/webhooks - Criar webhook
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados do webhook
    const validatedData = CreateWebhookSchema.parse(body);
    
    // Criar webhook no Asaas
    const webhook = await asaasClient.createWebhook(validatedData);
    
    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar webhook:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Dados inválidos',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

// Função para processar eventos de webhook
async function processWebhookEvent(webhookEvent: AsaasWebhookEvent) {
  const { event, payment } = webhookEvent;
  
  console.log(`Processando evento: ${event} para pagamento: ${payment.id}`);
  
  try {
    switch (event) {
      case 'PAYMENT_CREATED':
        await handlePaymentCreated(payment);
        break;
        
      case 'PAYMENT_UPDATED':
        await handlePaymentUpdated(payment);
        break;
        
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        await handlePaymentReceived(payment);
        break;
        
      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(payment);
        break;
        
      case 'PAYMENT_DELETED':
        await handlePaymentDeleted(payment);
        break;
        
      case 'PAYMENT_RESTORED':
        await handlePaymentRestored(payment);
        break;
        
      case 'PAYMENT_REFUNDED':
        await handlePaymentRefunded(payment);
        break;
        
      case 'PAYMENT_RECEIVED_IN_CASH_UNDONE':
        await handlePaymentReceivedInCashUndone(payment);
        break;
        
      case 'PAYMENT_CHARGEBACK_REQUESTED':
        await handlePaymentChargebackRequested(payment);
        break;
        
      case 'PAYMENT_CHARGEBACK_DISPUTE':
        await handlePaymentChargebackDispute(payment);
        break;
        
      case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
        await handlePaymentAwaitingChargebackReversal(payment);
        break;
        
      case 'PAYMENT_DUNNING_REQUESTED':
        await handlePaymentDunningRequested(payment);
        break;
        
      case 'PAYMENT_DUNNING_RECEIVED':
        await handlePaymentDunningReceived(payment);
        break;
        
      case 'PAYMENT_BANK_SLIP_VIEWED':
        await handlePaymentBankSlipViewed(payment);
        break;
        
      case 'PAYMENT_CHECKOUT_VIEWED':
        await handlePaymentCheckoutViewed(payment);
        break;
        
      default:
        console.log(`Evento não tratado: ${event}`);
    }
  } catch (error) {
    console.error(`Erro ao processar evento ${event}:`, error);
    throw error;
  }
}

// Handlers para diferentes tipos de eventos
async function handlePaymentCreated(payment: any) {
  console.log(`Pagamento criado: ${payment.id}`);
  // Implementar lógica específica para pagamento criado
  // Por exemplo: atualizar status no banco de dados local
}

async function handlePaymentUpdated(payment: any) {
  console.log(`Pagamento atualizado: ${payment.id}`);
  // Implementar lógica específica para pagamento atualizado
}

async function handlePaymentReceived(payment: any) {
  console.log(`Pagamento recebido: ${payment.id} - Valor: R$ ${payment.value}`);
  // Implementar lógica específica para pagamento recebido
  // Por exemplo: liberar produto/serviço, enviar email de confirmação
  
  // Se tem referência externa, atualizar o sistema local
  if (payment.externalReference) {
    await updateLocalPaymentStatus(payment.externalReference, 'RECEIVED', payment);
  }
}

async function handlePaymentOverdue(payment: any) {
  console.log(`Pagamento vencido: ${payment.id}`);
  // Implementar lógica específica para pagamento vencido
  // Por exemplo: enviar notificação de cobrança, suspender serviço
  
  if (payment.externalReference) {
    await updateLocalPaymentStatus(payment.externalReference, 'OVERDUE', payment);
  }
}

async function handlePaymentDeleted(payment: any) {
  console.log(`Pagamento deletado: ${payment.id}`);
  // Implementar lógica específica para pagamento deletado
}

async function handlePaymentRestored(payment: any) {
  console.log(`Pagamento restaurado: ${payment.id}`);
  // Implementar lógica específica para pagamento restaurado
}

async function handlePaymentRefunded(payment: any) {
  console.log(`Pagamento estornado: ${payment.id}`);
  // Implementar lógica específica para pagamento estornado
  // Por exemplo: reverter liberação de produto/serviço
  
  if (payment.externalReference) {
    await updateLocalPaymentStatus(payment.externalReference, 'REFUNDED', payment);
  }
}

async function handlePaymentReceivedInCashUndone(payment: any) {
  console.log(`Recebimento em dinheiro desfeito: ${payment.id}`);
  // Implementar lógica específica
}

async function handlePaymentChargebackRequested(payment: any) {
  console.log(`Chargeback solicitado: ${payment.id}`);
  // Implementar lógica específica para chargeback
  // Por exemplo: notificar equipe financeira
}

async function handlePaymentChargebackDispute(payment: any) {
  console.log(`Chargeback em disputa: ${payment.id}`);
  // Implementar lógica específica para disputa de chargeback
}

async function handlePaymentAwaitingChargebackReversal(payment: any) {
  console.log(`Aguardando reversão de chargeback: ${payment.id}`);
  // Implementar lógica específica
}

async function handlePaymentDunningRequested(payment: any) {
  console.log(`Negativação solicitada: ${payment.id}`);
  // Implementar lógica específica para negativação
}

async function handlePaymentDunningReceived(payment: any) {
  console.log(`Negativação efetivada: ${payment.id}`);
  // Implementar lógica específica
}

async function handlePaymentBankSlipViewed(payment: any) {
  console.log(`Boleto visualizado: ${payment.id}`);
  // Implementar lógica específica para visualização de boleto
}

async function handlePaymentCheckoutViewed(payment: any) {
  console.log(`Checkout visualizado: ${payment.id}`);
  // Implementar lógica específica para visualização de checkout
}

// Função auxiliar para atualizar status local
async function updateLocalPaymentStatus(
  externalReference: string,
  status: string,
  paymentData: any
) {
  try {
    // Implementar atualização no banco de dados local
    // Por exemplo: atualizar tabela de pagamentos, locações, etc.
    console.log(`Atualizando status local: ${externalReference} -> ${status}`);
    
    // Exemplo de como poderia ser implementado:
    // await db.payments.update({
    //   where: { externalReference },
    //   data: {
    //     status,
    //     asaasPaymentId: paymentData.id,
    //     paidAt: paymentData.paymentDate ? new Date(paymentData.paymentDate) : null,
    //     updatedAt: new Date(),
    //   }
    // });
    
  } catch (error) {
    console.error('Erro ao atualizar status local:', error);
  }
}