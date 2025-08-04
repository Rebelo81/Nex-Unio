import { NextRequest, NextResponse } from 'next/server';

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
}

// Simulação de banco de dados em memória
let damageReports: DamageReport[] = [];

// POST - Submeter relatório para aprovação
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const body = await request.json();
    const { submittedBy, notes } = body;
    
    if (!submittedBy) {
      return NextResponse.json(
        { error: 'Responsável pela submissão é obrigatório' },
        { status: 400 }
      );
    }
    
    const reportIndex = damageReports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }
    
    const report = damageReports[reportIndex];
    
    // Verificar se pode ser submetido
    if (report.status !== 'draft') {
      return NextResponse.json(
        { error: 'Apenas relatórios em rascunho podem ser submetidos' },
        { status: 400 }
      );
    }
    
    // Validar se o relatório está completo
    if (report.damages.length === 0) {
      return NextResponse.json(
        { error: 'Relatório deve conter pelo menos uma avaria' },
        { status: 400 }
      );
    }
    
    // Verificar se todas as avarias têm informações obrigatórias
    const incompleteDamages = report.damages.filter(d => 
      !d.itemName || !d.description || !d.reportedBy
    );
    
    if (incompleteDamages.length > 0) {
      return NextResponse.json(
        { 
          error: 'Todas as avarias devem ter informações completas',
          incompleteDamages: incompleteDamages.length
        },
        { status: 400 }
      );
    }
    
    // Atualizar status do relatório
    const updatedReport: DamageReport = {
      ...report,
      status: 'submitted',
      submittedAt: new Date(),
      notes: notes || report.notes,
      version: report.version + 1
    };
    
    damageReports[reportIndex] = updatedReport;
    
    // Log de auditoria
    console.log('Relatório submetido para aprovação:', {
      reportId,
      rentalId: report.rentalId,
      damagesCount: report.damages.length,
      totalCost: report.totalCost,
      submittedBy,
      timestamp: new Date()
    });
    
    // Notificações automáticas
    await sendSubmissionNotifications(updatedReport, submittedBy);
    
    // Em um sistema real:
    // await prisma.damageReport.update({
    //   where: { id: reportId },
    //   data: {
    //     status: 'submitted',
    //     submittedAt: new Date(),
    //     notes: notes || report.notes
    //   }
    // });
    // await createAuditLog('damage_report_submitted', reportId, submittedBy);
    
    return NextResponse.json({
      message: 'Relatório submetido com sucesso',
      report: updatedReport,
      nextSteps: [
        'Aguardando aprovação da gerência',
        'Notificação enviada para aprovadores',
        'Prazo estimado de aprovação: 2-3 dias úteis'
      ]
    });
  } catch (error) {
    console.error('Erro ao submeter relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para enviar notificações de submissão
async function sendSubmissionNotifications(report: DamageReport, submittedBy: string) {
  try {
    // Notificação para aprovadores
    console.log('📧 Enviando notificação para aprovadores:', {
      reportId: report.id,
      rentalId: report.rentalId,
      totalCost: report.totalCost,
      damagesCount: report.damages.length,
      submittedBy
    });
    
    // Simular envio de e-mail para aprovadores
    const approvers = ['gerencia@empresa.com', 'supervisor@empresa.com'];
    
    for (const approver of approvers) {
      console.log(`📨 E-mail enviado para: ${approver}`);
      // await sendEmail({
      //   to: approver,
      //   subject: `Novo Relatório de Avarias - ${report.rentalId}`,
      //   template: 'damage-report-submission',
      //   data: {
      //     reportId: report.id,
      //     rentalId: report.rentalId,
      //     totalCost: report.totalCost,
      //     damagesCount: report.damages.length,
      //     submittedBy,
      //     approvalUrl: `${process.env.APP_URL}/damage-reports/${report.id}`
      //   }
      // });
    }
    
    // Notificação no sistema (push notification)
    console.log('🔔 Criando notificação no sistema');
    // await createSystemNotification({
    //   type: 'damage_report_submitted',
    //   title: 'Novo Relatório de Avarias',
    //   message: `Relatório ${report.id} aguarda aprovação - Valor: R$ ${report.totalCost.toLocaleString('pt-BR')}`,
    //   recipients: ['role:manager', 'role:supervisor'],
    //   data: { reportId: report.id, rentalId: report.rentalId }
    // });
    
    // Notificação urgente para valores altos
    if (report.totalCost > 5000) {
      console.log('🚨 Notificação urgente - Valor alto:', report.totalCost);
      // await sendUrgentNotification({
      //   type: 'high_value_damage_report',
      //   reportId: report.id,
      //   totalCost: report.totalCost,
      //   recipients: ['role:director', 'role:financial_manager']
      // });
    }
    
    // Notificação para avarias críticas
    const criticalDamages = report.damages.filter(d => d.severity === 'critical');
    if (criticalDamages.length > 0) {
      console.log('⚠️ Notificação - Avarias críticas detectadas:', criticalDamages.length);
      // await sendCriticalDamageAlert({
      //   reportId: report.id,
      //   criticalDamages,
      //   recipients: ['role:technical_manager', 'role:operations']
      // });
    }
    
  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
    // Não falhar a submissão por erro de notificação
  }
}

// Função auxiliar para validar completude do relatório
function validateReportCompleteness(report: DamageReport): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Verificar se tem avarias
  if (report.damages.length === 0) {
    errors.push('Relatório deve conter pelo menos uma avaria');
  }
  
  // Verificar informações obrigatórias das avarias
  report.damages.forEach((damage, index) => {
    if (!damage.itemName) {
      errors.push(`Avaria ${index + 1}: Nome do item é obrigatório`);
    }
    
    if (!damage.description || damage.description.length < 10) {
      errors.push(`Avaria ${index + 1}: Descrição deve ter pelo menos 10 caracteres`);
    }
    
    if (!damage.reportedBy) {
      errors.push(`Avaria ${index + 1}: Responsável pelo relato é obrigatório`);
    }
    
    if (damage.repairCost < 0) {
      errors.push(`Avaria ${index + 1}: Custo de reparo não pode ser negativo`);
    }
    
    // Verificar se avarias críticas têm fotos
    if (damage.severity === 'critical' && (!damage.photos || damage.photos.length === 0)) {
      errors.push(`Avaria ${index + 1}: Avarias críticas devem ter pelo menos uma foto`);
    }
  });
  
  // Verificar consistência do valor total
  const calculatedTotal = report.damages.reduce((sum, d) => sum + (d.repairCost || 0), 0);
  if (Math.abs(calculatedTotal - report.totalCost) > 0.01) {
    errors.push('Valor total não confere com a soma das avarias');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Função auxiliar para calcular prioridade de aprovação
function calculateApprovalPriority(report: DamageReport): 'low' | 'medium' | 'high' | 'urgent' {
  let score = 0;
  
  // Pontuação baseada no valor
  if (report.totalCost > 10000) score += 4;
  else if (report.totalCost > 5000) score += 3;
  else if (report.totalCost > 1000) score += 2;
  else score += 1;
  
  // Pontuação baseada na severidade das avarias
  const criticalCount = report.damages.filter(d => d.severity === 'critical').length;
  const highCount = report.damages.filter(d => d.severity === 'high').length;
  
  score += criticalCount * 3;
  score += highCount * 2;
  
  // Pontuação baseada na categoria
  const structuralCount = report.damages.filter(d => d.category === 'structural').length;
  score += structuralCount * 2;
  
  if (score >= 10) return 'urgent';
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}