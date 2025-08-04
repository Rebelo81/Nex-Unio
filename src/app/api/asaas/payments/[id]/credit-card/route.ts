import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asaasClient, AsaasCreditCardSchema } from '@/lib/asaas';

// Schema para informações do portador do cartão
const CreditCardHolderSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  postalCode: z.string().min(8, 'CEP inválido'),
  addressNumber: z.string().min(1, 'Número do endereço é obrigatório'),
  addressComplement: z.string().optional(),
  phone: z.string().min(10, 'Telefone inválido'),
  mobilePhone: z.string().optional(),
});

// Schema para pagamento com cartão de crédito
const PayWithCreditCardSchema = z.object({
  creditCard: AsaasCreditCardSchema,
  holderInfo: CreditCardHolderSchema.optional(),
  remoteIp: z.string().ip().optional(),
});

// POST /api/asaas/payments/[id]/credit-card - Processar pagamento com cartão de crédito
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
    
    // Validar dados do cartão de crédito
    const validatedData = PayWithCreditCardSchema.parse(body);
    
    // Verificar se o pagamento existe e pode ser processado
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
    
    // Verificar se o pagamento pode ser processado
    if (currentPayment.status !== 'PENDING') {
      return NextResponse.json(
        { 
          message: 'Apenas pagamentos pendentes podem ser processados',
          currentStatus: currentPayment.status 
        },
        { status: 409 }
      );
    }
    
    // Verificar se o tipo de cobrança é cartão de crédito
    if (currentPayment.billingType !== 'CREDIT_CARD') {
      return NextResponse.json(
        { 
          message: 'Pagamento não é do tipo cartão de crédito',
          billingType: currentPayment.billingType 
        },
        { status: 409 }
      );
    }
    
    // Validações adicionais do cartão
    const { creditCard, holderInfo, remoteIp } = validatedData;
    
    // Verificar se o cartão não está expirado
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const cardYear = parseInt(creditCard.expiryYear);
    const cardMonth = parseInt(creditCard.expiryMonth);
    
    if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
      return NextResponse.json(
        { message: 'Cartão de crédito expirado' },
        { status: 400 }
      );
    }
    
    // Obter IP do cliente se não fornecido
    const clientIp = remoteIp || 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    
    // Processar pagamento com cartão de crédito no Asaas
    const payment = await asaasClient.payWithCreditCard(
      paymentId,
      creditCard,
      holderInfo,
      clientIp
    );
    
    // Remover dados sensíveis do cartão da resposta
    const sanitizedResponse = {
      ...payment,
      creditCard: {
        ...creditCard,
        number: `****-****-****-${creditCard.number.slice(-4)}`,
        ccv: '***',
      },
    };
    
    return NextResponse.json(sanitizedResponse);
  } catch (error) {
    console.error('Erro ao processar pagamento com cartão:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Dados do cartão inválidos',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar tipos específicos de erro do Asaas
    if (message.toLowerCase().includes('cartão inválido') || 
        message.toLowerCase().includes('invalid card')) {
      return NextResponse.json(
        { message: 'Dados do cartão de crédito inválidos' },
        { status: 400 }
      );
    }
    
    if (message.toLowerCase().includes('insuficiente') || 
        message.toLowerCase().includes('insufficient')) {
      return NextResponse.json(
        { message: 'Saldo insuficiente no cartão de crédito' },
        { status: 402 }
      );
    }
    
    if (message.toLowerCase().includes('negado') || 
        message.toLowerCase().includes('denied')) {
      return NextResponse.json(
        { message: 'Pagamento negado pela operadora do cartão' },
        { status: 402 }
      );
    }
    
    return NextResponse.json(
      { message: 'Erro ao processar pagamento com cartão de crédito' },
      { status: 500 }
    );
  }
}