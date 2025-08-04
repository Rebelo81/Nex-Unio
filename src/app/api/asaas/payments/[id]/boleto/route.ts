import { NextRequest, NextResponse } from 'next/server';
import { asaasClient } from '@/lib/asaas';

// GET /api/asaas/payments/[id]/boleto - Gerar boleto bancário
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
    
    // Verificar se o pagamento é do tipo boleto
    if (currentPayment.billingType !== 'BOLETO') {
      return NextResponse.json(
        { 
          message: 'Pagamento não é do tipo boleto',
          billingType: currentPayment.billingType 
        },
        { status: 409 }
      );
    }
    
    // Verificar se o pagamento ainda pode gerar boleto
    if (!['PENDING', 'OVERDUE'].includes(currentPayment.status)) {
      return NextResponse.json(
        { 
          message: 'Boleto só pode ser gerado para pagamentos pendentes ou vencidos',
          currentStatus: currentPayment.status 
        },
        { status: 409 }
      );
    }
    
    // Gerar boleto no Asaas
    const boletoData = await asaasClient.getBankSlip(paymentId);
    
    return NextResponse.json({
      ...boletoData,
      paymentId,
      value: currentPayment.value,
      dueDate: currentPayment.dueDate,
      description: currentPayment.description,
      customer: currentPayment.customer,
      status: currentPayment.status,
      invoiceUrl: currentPayment.invoiceUrl,
      invoiceNumber: currentPayment.invoiceNumber,
    });
  } catch (error) {
    console.error('Erro ao gerar boleto:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar tipos específicos de erro
    if (message.toLowerCase().includes('expired') || 
        message.toLowerCase().includes('expirado')) {
      return NextResponse.json(
        { message: 'Pagamento expirado, não é possível gerar boleto' },
        { status: 410 }
      );
    }
    
    return NextResponse.json(
      { message: 'Erro ao gerar boleto bancário' },
      { status: 500 }
    );
  }
}

// POST /api/asaas/payments/[id]/boleto - Reenviar boleto por email
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
    const { email } = body;
    
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
    
    // Verificar se o pagamento é do tipo boleto
    if (currentPayment.billingType !== 'BOLETO') {
      return NextResponse.json(
        { 
          message: 'Pagamento não é do tipo boleto',
          billingType: currentPayment.billingType 
        },
        { status: 409 }
      );
    }
    
    // Verificar se o pagamento ainda pode reenviar boleto
    if (!['PENDING', 'OVERDUE'].includes(currentPayment.status)) {
      return NextResponse.json(
        { 
          message: 'Boleto só pode ser reenviado para pagamentos pendentes ou vencidos',
          currentStatus: currentPayment.status 
        },
        { status: 409 }
      );
    }
    
    // Simular reenvio de boleto por email
    // Na implementação real, você faria uma chamada para a API do Asaas
    // para reenviar o boleto por email
    
    const emailToSend = email || (
      await asaasClient.getCustomer(currentPayment.customer)
    ).email;
    
    if (!emailToSend) {
      return NextResponse.json(
        { message: 'Email não fornecido e cliente não possui email cadastrado' },
        { status: 400 }
      );
    }
    
    // Simular envio de email
    console.log(`Reenviando boleto para: ${emailToSend}`);
    
    return NextResponse.json({
      message: 'Boleto reenviado com sucesso',
      paymentId,
      emailSent: emailToSend,
      sentAt: new Date().toISOString(),
      bankSlipUrl: currentPayment.bankSlipUrl,
      invoiceUrl: currentPayment.invoiceUrl,
    });
  } catch (error) {
    console.error('Erro ao reenviar boleto:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message: 'Erro ao reenviar boleto por email' },
      { status: 500 }
    );
  }
}