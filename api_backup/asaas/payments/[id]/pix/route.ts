import { NextRequest, NextResponse } from 'next/server';
import { asaasClient } from '@/lib/asaas';

// GET /api/asaas/payments/[id]/pix - Gerar QR Code PIX
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
    
    // Verificar se o pagamento é do tipo PIX
    if (currentPayment.billingType !== 'PIX') {
      return NextResponse.json(
        { 
          message: 'Pagamento não é do tipo PIX',
          billingType: currentPayment.billingType 
        },
        { status: 409 }
      );
    }
    
    // Verificar se o pagamento ainda está pendente
    if (currentPayment.status !== 'PENDING') {
      return NextResponse.json(
        { 
          message: 'QR Code PIX só pode ser gerado para pagamentos pendentes',
          currentStatus: currentPayment.status 
        },
        { status: 409 }
      );
    }
    
    // Gerar QR Code PIX no Asaas
    const pixData = await asaasClient.getPixQrCode(paymentId);
    
    return NextResponse.json({
      ...pixData,
      paymentId,
      value: currentPayment.value,
      dueDate: currentPayment.dueDate,
      description: currentPayment.description,
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar tipos específicos de erro
    if (message.toLowerCase().includes('expired') || 
        message.toLowerCase().includes('expirado')) {
      return NextResponse.json(
        { message: 'Pagamento expirado, não é possível gerar QR Code PIX' },
        { status: 410 }
      );
    }
    
    return NextResponse.json(
      { message: 'Erro ao gerar QR Code PIX' },
      { status: 500 }
    );
  }
}

// POST /api/asaas/payments/[id]/pix - Atualizar QR Code PIX (regenerar)
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
    
    // Verificar se o pagamento é do tipo PIX
    if (currentPayment.billingType !== 'PIX') {
      return NextResponse.json(
        { 
          message: 'Pagamento não é do tipo PIX',
          billingType: currentPayment.billingType 
        },
        { status: 409 }
      );
    }
    
    // Verificar se o pagamento ainda está pendente
    if (currentPayment.status !== 'PENDING') {
      return NextResponse.json(
        { 
          message: 'QR Code PIX só pode ser regenerado para pagamentos pendentes',
          currentStatus: currentPayment.status 
        },
        { status: 409 }
      );
    }
    
    // Regenerar QR Code PIX no Asaas
    const pixData = await asaasClient.getPixQrCode(paymentId);
    
    return NextResponse.json({
      ...pixData,
      paymentId,
      value: currentPayment.value,
      dueDate: currentPayment.dueDate,
      description: currentPayment.description,
      regenerated: true,
      regeneratedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao regenerar QR Code PIX:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message: 'Erro ao regenerar QR Code PIX' },
      { status: 500 }
    );
  }
}