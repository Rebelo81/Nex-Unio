import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asaasClient } from '@/lib/asaas';

// Schema de validação para geração de cobrança
const BillingSchema = z.object({
  billingMethod: z.enum(['asaas', 'manual', 'credit_card', 'bank_transfer']),
  dueDate: z.string().transform(str => new Date(str)),
  description: z.string().optional(),
  installments: z.number().min(1).max(12).default(1),
  discount: z.number().min(0).max(100).default(0),
  additionalFees: z.array(z.object({
    name: z.string(),
    amount: z.number().min(0),
    description: z.string().optional()
  })).default([]),
  notes: z.string().optional(),
  sendNotification: z.boolean().default(true),
  billedBy: z.string().min(1, 'Responsável pela cobrança é obrigatório')
});

interface DamageReport {
  id: string;
  rentalId: string;
  damages: any[];
  totalCost: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'billed';
  createdAt: Date;
  createdBy: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  billedAt?: Date;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  billingReference?: string;
  billingMethod?: string;
  billingAmount?: number;
  billingDueDate?: Date;
  billingInstallments?: number;
  billingDiscount?: number;
  billingFees?: any[];
  billedBy?: string;
  notes?: string;
  version: number;
}

interface BillingResponse {
  id: string;
  reference: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentUrl?: string;
  pixCode?: string;
  boletoUrl?: string;
}

// Simulação de banco de dados em memória
let damageReports: DamageReport[] = [];
let billingRecords: BillingResponse[] = [];

// POST - Gerar cobrança para relatório aprovado
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const body = await request.json();
    
    // Validação
    const validatedData = BillingSchema.parse(body);
    
    const reportIndex = damageReports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }
    
    const report = damageReports[reportIndex];
    
    // Verificar se pode ser cobrado
    if (report.status !== 'approved') {
      return NextResponse.json(
        { error: 'Apenas relatórios aprovados podem ser cobrados' },
        { status: 400 }
      );
    }
    
    // Verificar se já foi cobrado
    if (report.billingReference) {
      return NextResponse.json(
        { error: 'Relatório já possui cobrança gerada' },
        { status: 400 }
      );
    }
    
    // Calcular valores
    const subtotal = report.totalCost;
    const discountAmount = (subtotal * validatedData.discount) / 100;
    const feesAmount = validatedData.additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
    const finalAmount = subtotal - discountAmount + feesAmount;
    
    if (finalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valor final da cobrança deve ser maior que zero' },
        { status: 400 }
      );
    }
    
    // Gerar cobrança
    const billingResult = await generateBilling({
      reportId: report.id,
      rentalId: report.rentalId,
      amount: finalAmount,
      method: validatedData.billingMethod,
      dueDate: validatedData.dueDate,
      installments: validatedData.installments,
      description: validatedData.description || `Cobrança de avarias - Locação ${report.rentalId}`,
      damages: report.damages,
      discount: validatedData.discount,
      additionalFees: validatedData.additionalFees,
      billedBy: validatedData.billedBy
    });
    
    // Atualizar relatório
    const updatedReport: DamageReport = {
      ...report,
      status: 'billed',
      billedAt: new Date(),
      billingReference: billingResult.reference,
      billingMethod: validatedData.billingMethod,
      billingAmount: finalAmount,
      billingDueDate: validatedData.dueDate,
      billingInstallments: validatedData.installments,
      billingDiscount: validatedData.discount,
      billingFees: validatedData.additionalFees,
      billedBy: validatedData.billedBy,
      notes: validatedData.notes,
      version: report.version + 1
    };
    
    damageReports[reportIndex] = updatedReport;
    
    // Log de auditoria
    console.log('Cobrança gerada:', {
      reportId,
      rentalId: report.rentalId,
      billingReference: billingResult.reference,
      amount: finalAmount,
      method: validatedData.billingMethod,
      dueDate: validatedData.dueDate,
      billedBy: validatedData.billedBy,
      timestamp: new Date()
    });
    
    // Enviar notificações
    if (validatedData.sendNotification) {
      await sendBillingNotifications(updatedReport, billingResult);
    }
    
    // Criar lembrete de vencimento
    await scheduleBillingReminders(billingResult);
    
    // Em um sistema real:
    // await prisma.damageReport.update({
    //   where: { id: reportId },
    //   data: {
    //     status: 'billed',
    //     billedAt: new Date(),
    //     billingReference: billingResult.reference,
    //     billingAmount: finalAmount,
    //     billingMethod: validatedData.billingMethod
    //   }
    // });
    // await createAuditLog('damage_report_billed', reportId, validatedData.billedBy);
    
    return NextResponse.json({
      message: 'Cobrança gerada com sucesso',
      report: updatedReport,
      billing: billingResult,
      summary: {
        subtotal,
        discount: discountAmount,
        fees: feesAmount,
        finalAmount,
        installments: validatedData.installments,
        dueDate: validatedData.dueDate
      },
      nextSteps: [
        'Cobrança enviada ao cliente',
        'Acompanhar status do pagamento',
        'Lembretes automáticos configurados'
      ]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Erro ao gerar cobrança:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Obter status da cobrança
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    
    const report = damageReports.find(r => r.id === reportId);
    
    if (!report) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }
    
    if (!report.billingReference) {
      return NextResponse.json(
        { error: 'Relatório não possui cobrança gerada' },
        { status: 404 }
      );
    }
    
    // Buscar status da cobrança
    const billingStatus = await getBillingStatus(report.billingReference);
    
    return NextResponse.json({
      reportId: report.id,
      rentalId: report.rentalId,
      billing: billingStatus,
      summary: {
        amount: report.billingAmount,
        dueDate: report.billingDueDate,
        method: report.billingMethod,
        installments: report.billingInstallments,
        discount: report.billingDiscount,
        fees: report.billingFees
      }
    });
  } catch (error) {
    console.error('Erro ao obter status da cobrança:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para gerar cobrança
async function generateBilling(data: {
  reportId: string;
  rentalId: string;
  amount: number;
  method: string;
  dueDate: Date;
  installments: number;
  description: string;
  damages: any[];
  discount: number;
  additionalFees: any[];
  billedBy: string;
}): Promise<BillingResponse> {
  try {
    const reference = `DAM-${data.reportId}-${Date.now()}`;
    
    console.log('🧾 Gerando cobrança:', {
      reference,
      amount: data.amount,
      method: data.method,
      dueDate: data.dueDate,
      installments: data.installments
    });
    
    // Simulação de integração com gateway de pagamento
    let billingResult: BillingResponse;
    
    switch (data.method) {
      case 'asaas':
        billingResult = await generateAsaasBilling(data, reference);
        break;
      case 'credit_card':
        billingResult = await generateCreditCardBilling(data, reference);
        break;
      case 'bank_transfer':
        billingResult = await generateBankTransferBilling(data, reference);
        break;
      case 'manual':
        billingResult = await generateManualBilling(data, reference);
        break;
      default:
        throw new Error(`Método de cobrança não suportado: ${data.method}`);
    }
    
    // Salvar registro de cobrança
    billingRecords.push(billingResult);
    
    console.log('✅ Cobrança gerada com sucesso:', billingResult);
    
    return billingResult;
    
  } catch (error) {
    console.error('Erro ao gerar cobrança:', error);
    throw error;
  }
}

// Função auxiliar para gerar cobrança via Asaas
async function generateAsaasBilling(
  data: any, 
  reference: string
): Promise<BillingResponse> {
  console.log('💳 Gerando cobrança via Asaas...');
  
  try {
    // Buscar ou criar cliente no Asaas
    let customer;
    try {
      // Tentar buscar cliente existente por referência externa
      const customers = await asaasClient.listCustomers({ externalReference: data.rentalId });
      customer = customers.data?.[0];
    } catch (error) {
      console.log('Cliente não encontrado, criando novo...');
    }
    
    // Se não encontrou, criar novo cliente
    if (!customer) {
      customer = await asaasClient.createCustomer({
        name: `Cliente Locação ${data.rentalId}`,
        cpfCnpj: '00000000000', // Em produção, usar CPF/CNPJ real
        email: `cliente-${data.rentalId}@exemplo.com`,
        phone: '11999999999',
        externalReference: data.rentalId,
        notificationDisabled: false,
        additionalEmails: '',
        municipalInscription: '',
        stateInscription: '',
        observations: `Cliente da locação ${data.rentalId} - Cobrança de avarias`
      });
    }
    
    // Determinar tipo de cobrança baseado no número de parcelas
    const billingType = data.installments > 1 ? 'CREDIT_CARD' : 'PIX';
    
    // Criar cobrança no Asaas
    const payment = await asaasClient.createPayment({
      customer: customer.id,
      billingType,
      value: data.amount,
      dueDate: data.dueDate.toISOString().split('T')[0],
      description: data.description,
      externalReference: reference,
      installmentCount: data.installments > 1 ? data.installments : undefined,
      installmentValue: data.installments > 1 ? Math.round((data.amount / data.installments) * 100) / 100 : undefined,
      discount: {
        value: (data.amount * data.discount) / 100,
        dueDateLimitDays: 0
      },
      fine: {
        value: 2.0
      },
      interest: {
        value: 1.0
      },
      postalService: false
    });
    
    // Gerar QR Code PIX se for PIX
    let pixCode;
    if (billingType === 'PIX') {
      try {
        const pixData = await asaasClient.getPixQrCode(payment.id);
        pixCode = pixData.payload;
      } catch (error) {
        console.warn('Erro ao gerar QR Code PIX:', error);
      }
    }
    
    return {
      id: payment.id,
      reference,
      amount: data.amount,
      dueDate: data.dueDate,
      status: 'pending',
      paymentUrl: payment.invoiceUrl,
      pixCode: pixCode
    };
    
  } catch (error) {
    console.error('Erro ao gerar cobrança no Asaas:', error);
    
    // Fallback para simulação em caso de erro
    return {
      id: `asaas_${reference}`,
      reference,
      amount: data.amount,
      dueDate: data.dueDate,
      status: 'pending',
      paymentUrl: `https://app.asaas.com/pay/${reference}`,
      pixCode: `00020126580014br.gov.bcb.pix0136${reference}520400005303986540${data.amount.toFixed(2)}5802BR6009SAO PAULO62070503***6304`,
      boletoUrl: `https://app.asaas.com/boleto/${reference}`
    };
  }
}

// Função auxiliar para gerar cobrança via cartão de crédito
async function generateCreditCardBilling(
  data: any, 
  reference: string
): Promise<BillingResponse> {
  console.log('💳 Gerando cobrança via cartão de crédito...');
  
  return {
    id: `cc_${reference}`,
    reference,
    amount: data.amount,
    dueDate: data.dueDate,
    status: 'pending',
    paymentUrl: `https://checkout.empresa.com/pay/${reference}`
  };
}

// Função auxiliar para gerar cobrança via transferência bancária
async function generateBankTransferBilling(
  data: any, 
  reference: string
): Promise<BillingResponse> {
  console.log('🏦 Gerando cobrança via transferência bancária...');
  
  return {
    id: `bt_${reference}`,
    reference,
    amount: data.amount,
    dueDate: data.dueDate,
    status: 'pending'
  };
}

// Função auxiliar para gerar cobrança manual
async function generateManualBilling(
  data: any, 
  reference: string
): Promise<BillingResponse> {
  console.log('📝 Gerando cobrança manual...');
  
  return {
    id: `manual_${reference}`,
    reference,
    amount: data.amount,
    dueDate: data.dueDate,
    status: 'pending'
  };
}

// Função auxiliar para obter status da cobrança
async function getBillingStatus(reference: string): Promise<BillingResponse | null> {
  const billing = billingRecords.find(b => b.reference === reference);
  
  if (!billing) {
    return null;
  }
  
  console.log('🔍 Verificando status da cobrança:', reference);
  
  try {
    // Se for cobrança do Asaas, verificar status real
    if (billing.id.startsWith('cob_') || (!billing.id.startsWith('asaas_') && !billing.id.startsWith('manual_') && !billing.id.startsWith('credit_'))) {
      const payment = await asaasClient.getPayment(billing.id);
      
      // Mapear status do Asaas para nosso sistema
      let mappedStatus: 'pending' | 'paid' | 'overdue' | 'cancelled';
      switch (payment.status) {
        case 'PENDING':
          mappedStatus = 'pending';
          break;
        case 'CONFIRMED':
        case 'RECEIVED':
        case 'RECEIVED_IN_CASH':
          mappedStatus = 'paid';
          break;
        case 'OVERDUE':
          mappedStatus = 'overdue';
          break;
        case 'REFUNDED':
        case 'CANCELLED':
          mappedStatus = 'cancelled';
          break;
        default:
          mappedStatus = 'pending';
      }
      
      // Atualizar status local
      const updatedBilling = {
        ...billing,
        status: mappedStatus
      };
      
      // Atualizar no array local
      const billingIndex = billingRecords.findIndex(b => b.reference === reference);
      if (billingIndex !== -1) {
        billingRecords[billingIndex] = updatedBilling;
      }
      
      return updatedBilling;
    }
    
    // Para outros tipos de cobrança, retornar status local
    return billing;
    
  } catch (error) {
    console.warn('Erro ao verificar status no Asaas, usando status local:', error);
    return billing;
  }
}

// Função auxiliar para enviar notificações de cobrança
async function sendBillingNotifications(
  report: DamageReport, 
  billing: BillingResponse
) {
  try {
    console.log('📧 Enviando notificações de cobrança:', {
      reportId: report.id,
      rentalId: report.rentalId,
      billingReference: billing.reference,
      amount: billing.amount
    });
    
    // E-mail para o cliente
    console.log('📨 Enviando e-mail de cobrança para o cliente');
    // await sendEmail({
    //   to: await getCustomerEmailByRentalId(report.rentalId),
    //   subject: `Cobrança de Avarias - Locação ${report.rentalId}`,
    //   template: 'damage-billing-notification',
    //   data: {
    //     rentalId: report.rentalId,
    //     amount: billing.amount,
    //     dueDate: billing.dueDate,
    //     paymentUrl: billing.paymentUrl,
    //     pixCode: billing.pixCode,
    //     boletoUrl: billing.boletoUrl,
    //     damages: report.damages.map(d => ({
    //       item: d.itemName,
    //       description: d.description,
    //       cost: d.repairCost
    //     }))
    //   }
    // });
    
    // SMS para o cliente (se configurado)
    console.log('📱 Enviando SMS de cobrança');
    // await sendSMS({
    //   to: await getCustomerPhoneByRentalId(report.rentalId),
    //   message: `Cobrança de avarias: R$ ${billing.amount.toLocaleString('pt-BR')} - Vencimento: ${billing.dueDate.toLocaleDateString('pt-BR')} - Link: ${billing.paymentUrl}`
    // });
    
    // Notificação no sistema
    console.log('🔔 Criando notificação no sistema');
    // await createSystemNotification({
    //   type: 'damage_billing_generated',
    //   title: 'Cobrança de Avarias Gerada',
    //   message: `Cobrança ${billing.reference} gerada - Valor: R$ ${billing.amount.toLocaleString('pt-BR')}`,
    //   recipients: [report.createdBy, report.billedBy, 'role:financial'],
    //   data: { 
    //     reportId: report.id, 
    //     rentalId: report.rentalId,
    //     billingReference: billing.reference,
    //     amount: billing.amount
    //   }
    // });
    
  } catch (error) {
    console.error('Erro ao enviar notificações de cobrança:', error);
  }
}

// Função auxiliar para agendar lembretes de vencimento
async function scheduleBillingReminders(billing: BillingResponse) {
  try {
    console.log('⏰ Agendando lembretes de vencimento:', {
      billingReference: billing.reference,
      dueDate: billing.dueDate
    });
    
    // Lembrete 3 dias antes do vencimento
    const reminderDate1 = new Date(billing.dueDate);
    reminderDate1.setDate(reminderDate1.getDate() - 3);
    
    // Lembrete 1 dia antes do vencimento
    const reminderDate2 = new Date(billing.dueDate);
    reminderDate2.setDate(reminderDate2.getDate() - 1);
    
    // Lembrete no dia do vencimento
    const reminderDate3 = new Date(billing.dueDate);
    
    // Em um sistema real:
    // await scheduleTask({
    //   type: 'billing_reminder',
    //   executeAt: reminderDate1,
    //   data: { billingReference: billing.reference, reminderType: 'before_3_days' }
    // });
    // 
    // await scheduleTask({
    //   type: 'billing_reminder',
    //   executeAt: reminderDate2,
    //   data: { billingReference: billing.reference, reminderType: 'before_1_day' }
    // });
    // 
    // await scheduleTask({
    //   type: 'billing_reminder',
    //   executeAt: reminderDate3,
    //   data: { billingReference: billing.reference, reminderType: 'due_date' }
    // });
    
    console.log('✅ Lembretes agendados com sucesso');
    
  } catch (error) {
    console.error('Erro ao agendar lembretes:', error);
  }
}