import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asaasClient, AsaasPaymentSchema } from '@/lib/asaas';

// Schema para atualização de pagamento (campos limitados)
const UpdatePaymentSchema = z.object({
  value: z.number().positive().optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  externalReference: z.string().optional(),
  discount: z.object({
    value: z.number().positive(),
    dueDateLimitDays: z.number().min(0).max(30),
    type: z.enum(['FIXED', 'PERCENTAGE']),
  }).optional(),
  interest: z.object({
    value: z.number().positive(),
    type: z.enum(['FIXED', 'PERCENTAGE']),
  }).optional(),
  fine: z.object({
    value: z.number().positive(),
    type: z.enum(['FIXED', 'PERCENTAGE']),
  }).optional(),
});

// GET /api/asaas/payments/[id] - Buscar pagamento por ID
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
    
    // Buscar pagamento no Asaas
    const payment = await asaasClient.getPayment(paymentId);
    
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Se o erro contém "404" ou "not found", retornar 404
    if (message.toLowerCase().includes('404') || message.toLowerCase().includes('not found')) {
      return NextResponse.json(
        { message: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

// PATCH /api/asaas/payments/[id] - Atualizar pagamento
export async function PATCH(
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
    
    // Validar dados de atualização
    const validatedData = UpdatePaymentSchema.parse(body);
    
    // Verificar se há dados para atualizar
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { message: 'Nenhum dado fornecido para atualização' },
        { status: 400 }
      );
    }
    
    // Verificar se o pagamento existe e pode ser atualizado
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
    
    // Verificar se o pagamento pode ser atualizado
    if (currentPayment.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Apenas pagamentos pendentes podem ser atualizados' },
        { status: 409 }
      );
    }
    
    // Atualizar pagamento no Asaas
    const payment = await asaasClient.updatePayment(paymentId, validatedData);
    
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    
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

// DELETE /api/asaas/payments/[id] - Excluir pagamento
export async function DELETE(
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
    
    // Verificar se o pagamento existe e pode ser deletado
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
    
    // Verificar se o pagamento pode ser deletado
    if (currentPayment.status !== 'PENDING') {
      return NextResponse.json(
        { 
          message: 'Apenas pagamentos pendentes podem ser excluídos',
          currentStatus: currentPayment.status 
        },
        { status: 409 }
      );
    }
    
    // Deletar pagamento no Asaas
    const result = await asaasClient.deletePayment(paymentId);
    
    return NextResponse.json({
      message: 'Pagamento excluído com sucesso',
      deleted: result.deleted,
      id: result.id,
    });
  } catch (error) {
    console.error('Erro ao excluir pagamento:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}