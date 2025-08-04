import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asaasClient, AsaasPaymentSchema } from '@/lib/asaas';

// Schema para validação de parâmetros de busca
const SearchParamsSchema = z.object({
  customer: z.string().optional(),
  customerGroupName: z.string().optional(),
  billingType: z.enum(['BOLETO', 'CREDIT_CARD', 'PIX', 'UNDEFINED']).optional(),
  status: z.string().optional(),
  subscription: z.string().optional(),
  installment: z.string().optional(),
  externalReference: z.string().optional(),
  paymentDate: z.string().optional(),
  estimatedCreditDate: z.string().optional(),
  pixQrCodeId: z.string().optional(),
  anticipated: z.coerce.boolean().optional(),
  dateCreated: z.string().optional(),
  dueDate: z.string().optional(),
  user: z.string().optional(),
  offset: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

// Schema para criação de pagamento com campos adicionais
const CreatePaymentSchema = AsaasPaymentSchema.extend({
  // Campos adicionais para facilitar a criação
  installmentCount: z.number().min(1).max(12).optional(),
  installmentValue: z.number().positive().optional(),
  
  // Configurações de desconto
  discount: z.object({
    value: z.number().positive(),
    dueDateLimitDays: z.number().min(0).max(30),
    type: z.enum(['FIXED', 'PERCENTAGE']),
  }).optional(),
  
  // Configurações de juros
  interest: z.object({
    value: z.number().positive(),
    type: z.enum(['FIXED', 'PERCENTAGE']),
  }).optional(),
  
  // Configurações de multa
  fine: z.object({
    value: z.number().positive(),
    type: z.enum(['FIXED', 'PERCENTAGE']),
  }).optional(),
  
  // Configurações de split
  split: z.array(z.object({
    walletId: z.string(),
    fixedValue: z.number().positive().optional(),
    percentualValue: z.number().min(0).max(100).optional(),
  })).optional(),
  
  // Outros campos
  postalService: z.boolean().optional(),
});

// GET /api/asaas/payments - Listar pagamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    // Validar parâmetros
    const validatedParams = SearchParamsSchema.parse(params);
    
    // Buscar pagamentos no Asaas
    const payments = await asaasClient.listPayments(validatedParams);
    
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Parâmetros inválidos',
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

// POST /api/asaas/payments - Criar pagamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados do pagamento
    const validatedData = CreatePaymentSchema.parse(body);
    
    // Verificar se o cliente existe
    try {
      await asaasClient.getCustomer(validatedData.customer);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('404') || message.toLowerCase().includes('not found')) {
        return NextResponse.json(
          { message: 'Cliente não encontrado' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    // Validações adicionais
    if (validatedData.installmentCount && validatedData.installmentCount > 1) {
      if (!validatedData.installmentValue) {
        validatedData.installmentValue = validatedData.value / validatedData.installmentCount;
      }
      
      // Verificar se o valor das parcelas está correto
      const totalInstallmentValue = validatedData.installmentValue * validatedData.installmentCount;
      if (Math.abs(totalInstallmentValue - validatedData.value) > 0.01) {
        return NextResponse.json(
          { message: 'Valor total das parcelas não confere com o valor do pagamento' },
          { status: 400 }
        );
      }
    }
    
    // Validar split se fornecido
    if (validatedData.split && validatedData.split.length > 0) {
      let totalSplitValue = 0;
      let totalSplitPercentage = 0;
      
      for (const splitItem of validatedData.split) {
        if (splitItem.fixedValue) {
          totalSplitValue += splitItem.fixedValue;
        }
        if (splitItem.percentualValue) {
          totalSplitPercentage += splitItem.percentualValue;
        }
      }
      
      // Verificar se não excede o valor total
      if (totalSplitValue > validatedData.value) {
        return NextResponse.json(
          { message: 'Valor total do split excede o valor do pagamento' },
          { status: 400 }
        );
      }
      
      if (totalSplitPercentage > 100) {
        return NextResponse.json(
          { message: 'Percentual total do split excede 100%' },
          { status: 400 }
        );
      }
    }
    
    // Criar pagamento no Asaas
    const payment = await asaasClient.createPayment(validatedData);
    
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    
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

// DELETE /api/asaas/payments - Limpar todos os pagamentos (apenas para desenvolvimento)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar se está em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { message: 'Operação não permitida em produção' },
        { status: 403 }
      );
    }
    
    // Buscar todos os pagamentos
    const paymentsResponse = await asaasClient.listPayments({ limit: 100 });
    const payments = paymentsResponse.data || [];
    
    // Filtrar apenas pagamentos que podem ser deletados (PENDING)
    const deletablePayments = payments.filter(payment => 
      payment.status === 'PENDING' && !payment.deleted
    );
    
    // Deletar cada pagamento
    const deletePromises = deletablePayments.map(payment => 
      asaasClient.deletePayment(payment.id).catch(error => {
        console.warn(`Erro ao deletar pagamento ${payment.id}:`, error);
        return null;
      })
    );
    
    const results = await Promise.all(deletePromises);
    const deletedCount = results.filter(result => result !== null).length;
    
    return NextResponse.json({
      message: `${deletedCount} pagamentos foram removidos`,
      total: payments.length,
      deletable: deletablePayments.length,
      deleted: deletedCount,
      note: 'Apenas pagamentos pendentes podem ser removidos',
    });
  } catch (error) {
    console.error('Erro ao limpar pagamentos:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}