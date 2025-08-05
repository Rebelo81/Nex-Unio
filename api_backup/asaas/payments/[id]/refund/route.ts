import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asaasClient } from '@/lib/asaas';

// Schema para estorno
const RefundSchema = z.object({
  value: z.number().positive().optional(),
  description: z.string().max(500).optional(),
});

// POST /api/asaas/payments/[id]/refund - Estornar pagamento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    
    if (!paymentId) {
      return NextResponse.json(
        { message: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validar dados do estorno
    const validatedData = RefundSchema.parse(body);
    
    // Verificar se o pagamento existe
    let currentPayment;
    try {
      currentPayment = await asaasClient.getPayment(paymentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('404') || message.toLowerCase().includes('not found')) {
        return NextResponse.json(
          { message: 'Pagamento não encontrado' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    // Verificar se o pagamento pode ser estornado
    const refundableStatuses = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
    if (!refundableStatuses.includes(currentPayment.status)) {
      return NextResponse.json(
        { 
          message: 'Apenas pagamentos recebidos ou confirmados podem ser estornados',
          currentStatus: currentPayment.status,
          refundableStatuses 
        },
        { status: 409 }
      );
    }
    
    // Verificar se já foi estornado
    if (currentPayment.status === 'REFUNDED') {
      return NextResponse.json(
        { message: 'Pagamento já foi estornado' },
        { status: 409 }
      );
    }
    
    // Validar valor do estorno
    const refundValue = validatedData.value || currentPayment.value;
    
    if (refundValue > currentPayment.value) {
      return NextResponse.json(
        { 
          message: 'Valor do estorno não pode ser maior que o valor do pagamento',
          paymentValue: currentPayment.value,
          requestedRefund: refundValue 
        },
        { status: 400 }
      );
    }
    
    // Verificar se é estorno parcial
    const isPartialRefund = refundValue < currentPayment.value;
    
    if (isPartialRefund && currentPayment.billingType === 'BOLETO') {
      return NextResponse.json(
        { message: 'Estorno parcial não é permitido para pagamentos via boleto' },
        { status: 409 }
      );
    }
    
    // Verificar prazo para estorno (exemplo: 180 dias)
    const paymentDate = new Date(currentPayment.paymentDate || currentPayment.dateCreated);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 180) {
      return NextResponse.json(
        { 
          message: 'Prazo para estorno expirado (máximo 180 dias)',
          paymentDate: paymentDate.toISOString(),
          daysSincePayment: daysDifference 
        },
        { status: 409 }
      );
    }
    
    // Processar estorno no Asaas
    const refund = await asaasClient.refundPayment(
      paymentId,
      refundValue,
      validatedData.description
    );
    
    // Buscar pagamento atualizado
    const updatedPayment = await asaasClient.getPayment(paymentId);
    
    return NextResponse.json({
      refund,
      payment: updatedPayment,
      isPartialRefund,
      refundValue,
      originalValue: currentPayment.value,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao estornar pagamento:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Dados inválidos para estorno',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar tipos específicos de erro do Asaas
    if (message.toLowerCase().includes('insufficient balance') || 
        message.toLowerCase().includes('saldo insuficiente')) {
      return NextResponse.json(
        { message: 'Saldo insuficiente para processar o estorno' },
        { status: 402 }
      );
    }
    
    if (message.toLowerCase().includes('refund not allowed') || 
        message.toLowerCase().includes('estorno não permitido')) {
      return NextResponse.json(
        { message: 'Estorno não permitido para este pagamento' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { message: 'Erro ao processar estorno' },
      { status: 500 }
    );
  }
}

// GET /api/asaas/payments/[id]/refund - Consultar estornos do pagamento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    
    if (!paymentId) {
      return NextResponse.json(
        { message: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se o pagamento existe
    let currentPayment;
    try {
      currentPayment = await asaasClient.getPayment(paymentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('404') || message.toLowerCase().includes('not found')) {
        return NextResponse.json(
          { message: 'Pagamento não encontrado' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    // Retornar informações sobre estornos
    const refunds = currentPayment.refunds || [];
    
    const refundInfo = {
      paymentId,
      paymentStatus: currentPayment.status,
      originalValue: currentPayment.value,
      netValue: currentPayment.netValue,
      refunds,
      totalRefunded: refunds.reduce((total: number, refund: any) => total + (refund.value || 0), 0),
      canRefund: ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(currentPayment.status),
      refundableAmount: currentPayment.status === 'REFUNDED' ? 0 : currentPayment.netValue,
    };
    
    return NextResponse.json(refundInfo);
  } catch (error) {
    console.error('Erro ao consultar estornos:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message: 'Erro ao consultar informações de estorno' },
      { status: 500 }
    );
  }
}