import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para aprovação
const ApprovalSchema = z.object({
  approvedBy: z.string().min(1, 'Aprovador é obrigatório'),
  notes: z.string().optional(),
  partialApproval: z.boolean().optional(),
  approvedDamages: z.array(z.string()).optional(), // IDs das avarias aprovadas
  adjustments: z.array(z.object({
    damageId: z.string(),
    newCost: z.number().min(0),
    reason: z.string()
  })).optional()
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
  notes?: string;
  version: number;
  approvalNotes?: string;
  adjustments?: any[];
}

// Simulação de banco de dados em memória
let damageReports: DamageReport[] = [];

// POST - Aprovar relatório
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const body = await request.json();
    
    // Validação
    const validatedData = ApprovalSchema.parse(body);
    
    const reportIndex = damageReports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }
    
    const report = damageReports[reportIndex];
    
    // Verificar se pode ser aprovado
    if (report.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Apenas relatórios submetidos podem ser aprovados' },
        { status: 400 }
      );
    }
    
    // Verificar se o aprovador não é o mesmo que criou o relatório
    if (report.createdBy === validatedData.approvedBy) {
      return NextResponse.json(
        { error: 'O criador do relatório não pode aprová-lo' },
        { status: 400 }
      );
    }
    
    // Processar ajustes se houver
    let adjustedDamages = [...report.damages];
    let adjustedTotalCost = report.totalCost;
    
    if (validatedData.adjustments && validatedData.adjustments.length > 0) {
      for (const adjustment of validatedData.adjustments) {
        const damageIndex = adjustedDamages.findIndex(d => d.id === adjustment.damageId);
        if (damageIndex !== -1) {
          const oldCost = adjustedDamages[damageIndex].repairCost;
          adjustedDamages[damageIndex].repairCost = adjustment.newCost;
          adjustedDamages[damageIndex].adjustmentReason = adjustment.reason;
          adjustedDamages[damageIndex].originalCost = oldCost;
          
          // Atualizar total
          adjustedTotalCost = adjustedTotalCost - oldCost + adjustment.newCost;
        }
      }
    }
    
    // Processar aprovação parcial se aplicável
    if (validatedData.partialApproval && validatedData.approvedDamages) {
      adjustedDamages = adjustedDamages.map(damage => ({
        ...damage,
        approved: validatedData.approvedDamages!.includes(damage.id)
      }));
      
      // Recalcular total apenas com avarias aprovadas
      adjustedTotalCost = adjustedDamages
        .filter(d => d.approved)
        .reduce((sum, d) => sum + d.repairCost, 0);
    }
    
    // Atualizar relatório
    const updatedReport: DamageReport = {
      ...report,
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: validatedData.approvedBy,
      approvalNotes: validatedData.notes,
      damages: adjustedDamages,
      totalCost: adjustedTotalCost,
      adjustments: validatedData.adjustments,
      version: report.version + 1
    };
    
    damageReports[reportIndex] = updatedReport;
    
    // Log de auditoria
    console.log('Relatório aprovado:', {
      reportId,
      rentalId: report.rentalId,
      originalCost: report.totalCost,
      approvedCost: adjustedTotalCost,
      approvedBy: validatedData.approvedBy,
      adjustmentsCount: validatedData.adjustments?.length || 0,
      partialApproval: validatedData.partialApproval,
      timestamp: new Date()
    });
    
    // Enviar notificações
    await sendApprovalNotifications(updatedReport, validatedData.approvedBy);
    
    // Iniciar processo de cobrança automaticamente se configurado
    if (shouldAutoGenerateBilling(updatedReport)) {
      console.log('🔄 Iniciando geração automática de cobrança...');
      // await generateAutomaticBilling(updatedReport);
    }
    
    // Em um sistema real:
    // await prisma.damageReport.update({
    //   where: { id: reportId },
    //   data: {
    //     status: 'approved',
    //     approvedAt: new Date(),
    //     approvedBy: validatedData.approvedBy,
    //     approvalNotes: validatedData.notes,
    //     totalCost: adjustedTotalCost,
    //     damages: adjustedDamages
    //   }
    // });
    // await createAuditLog('damage_report_approved', reportId, validatedData.approvedBy);
    
    return NextResponse.json({
      message: 'Relatório aprovado com sucesso',
      report: updatedReport,
      summary: {
        originalCost: report.totalCost,
        approvedCost: adjustedTotalCost,
        savings: report.totalCost - adjustedTotalCost,
        adjustmentsCount: validatedData.adjustments?.length || 0,
        approvedDamagesCount: validatedData.partialApproval 
          ? validatedData.approvedDamages?.length || adjustedDamages.length
          : adjustedDamages.length
      },
      nextSteps: [
        'Relatório aprovado e pronto para cobrança',
        'Notificação enviada ao cliente',
        'Cobrança será gerada automaticamente'
      ]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Erro ao aprovar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para enviar notificações de aprovação
async function sendApprovalNotifications(report: DamageReport, approvedBy: string) {
  try {
    // Notificação para o criador do relatório
    console.log('📧 Enviando notificação de aprovação:', {
      reportId: report.id,
      rentalId: report.rentalId,
      approvedCost: report.totalCost,
      approvedBy,
      createdBy: report.createdBy
    });
    
    // E-mail para o criador
    console.log(`📨 E-mail de aprovação enviado para: ${report.createdBy}`);
    // await sendEmail({
    //   to: report.createdBy,
    //   subject: `Relatório de Avarias Aprovado - ${report.rentalId}`,
    //   template: 'damage-report-approved',
    //   data: {
    //     reportId: report.id,
    //     rentalId: report.rentalId,
    //     approvedCost: report.totalCost,
    //     approvedBy,
    //     approvalNotes: report.approvalNotes,
    //     reportUrl: `${process.env.APP_URL}/damage-reports/${report.id}`
    //   }
    // });
    
    // Notificação para o departamento financeiro
    console.log('💰 Notificação para departamento financeiro');
    // await sendEmail({
    //   to: 'financeiro@empresa.com',
    //   subject: `Nova Cobrança de Avarias - ${report.rentalId}`,
    //   template: 'damage-billing-notification',
    //   data: {
    //     reportId: report.id,
    //     rentalId: report.rentalId,
    //     amount: report.totalCost,
    //     damagesCount: report.damages.length,
    //     approvedBy
    //   }
    // });
    
    // Notificação no sistema
    console.log('🔔 Criando notificação no sistema');
    // await createSystemNotification({
    //   type: 'damage_report_approved',
    //   title: 'Relatório de Avarias Aprovado',
    //   message: `Relatório ${report.id} aprovado - Valor: R$ ${report.totalCost.toLocaleString('pt-BR')}`,
    //   recipients: [report.createdBy, 'role:financial'],
    //   data: { reportId: report.id, rentalId: report.rentalId }
    // });
    
    // Notificação para o cliente (se configurado)
    if (shouldNotifyCustomer(report)) {
      console.log('📱 Enviando notificação para o cliente');
      // await sendCustomerNotification({
      //   reportId: report.id,
      //   rentalId: report.rentalId,
      //   amount: report.totalCost,
      //   damagesSummary: generateCustomerDamagesSummary(report.damages)
      // });
    }
    
  } catch (error) {
    console.error('Erro ao enviar notificações de aprovação:', error);
  }
}

// Função auxiliar para determinar se deve gerar cobrança automaticamente
function shouldAutoGenerateBilling(report: DamageReport): boolean {
  // Regras de negócio para geração automática de cobrança
  
  // Não gerar automaticamente para valores muito altos
  if (report.totalCost > 10000) {
    return false;
  }
  
  // Não gerar se houver ajustes significativos
  if (report.adjustments && report.adjustments.length > 0) {
    const hasSignificantAdjustments = report.adjustments.some(adj => 
      Math.abs(adj.newCost - (adj.originalCost || 0)) > 500
    );
    if (hasSignificantAdjustments) {
      return false;
    }
  }
  
  // Não gerar para aprovações parciais
  const hasPartialApproval = report.damages.some(d => d.approved === false);
  if (hasPartialApproval) {
    return false;
  }
  
  return true;
}

// Função auxiliar para determinar se deve notificar o cliente
function shouldNotifyCustomer(report: DamageReport): boolean {
  // Notificar cliente apenas para valores acima de um limite
  return report.totalCost > 100;
}

// Função auxiliar para gerar resumo de avarias para o cliente
function generateCustomerDamagesSummary(damages: any[]) {
  return damages
    .filter(d => d.approved !== false)
    .map(damage => ({
      item: damage.itemName,
      description: damage.description,
      cost: damage.repairCost,
      category: damage.category,
      severity: damage.severity
    }));
}

// Função auxiliar para validar permissões de aprovação
function canUserApproveReport(report: DamageReport, userRole: string, userId: string): boolean {
  // Regras de negócio para aprovação
  
  // Criador não pode aprovar próprio relatório
  if (report.createdBy === userId) {
    return false;
  }
  
  // Apenas gerentes e supervisores podem aprovar
  const allowedRoles = ['manager', 'supervisor', 'admin'];
  if (!allowedRoles.includes(userRole)) {
    return false;
  }
  
  // Valores altos precisam de aprovação de nível superior
  if (report.totalCost > 5000 && userRole !== 'manager' && userRole !== 'admin') {
    return false;
  }
  
  return true;
}