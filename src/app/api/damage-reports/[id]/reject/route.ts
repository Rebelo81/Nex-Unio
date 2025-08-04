import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para rejeição
const RejectionSchema = z.object({
  rejectedBy: z.string().min(1, 'Responsável pela rejeição é obrigatório'),
  reason: z.string().min(10, 'Motivo da rejeição deve ter pelo menos 10 caracteres'),
  category: z.enum([
    'insufficient_evidence',
    'pre_existing_damage',
    'normal_wear',
    'incorrect_assessment',
    'missing_documentation',
    'policy_violation',
    'duplicate_report',
    'other'
  ]),
  feedback: z.string().optional(),
  suggestedActions: z.array(z.string()).optional(),
  allowResubmission: z.boolean().default(true),
  requiresInspection: z.boolean().default(false)
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
  rejectionCategory?: string;
  rejectionFeedback?: string;
  billingReference?: string;
  notes?: string;
  version: number;
  allowResubmission?: boolean;
  requiresInspection?: boolean;
  suggestedActions?: string[];
}

// Simulação de banco de dados em memória
let damageReports: DamageReport[] = [];

// POST - Rejeitar relatório
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const body = await request.json();
    
    // Validação
    const validatedData = RejectionSchema.parse(body);
    
    const reportIndex = damageReports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }
    
    const report = damageReports[reportIndex];
    
    // Verificar se pode ser rejeitado
    if (report.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Apenas relatórios submetidos podem ser rejeitados' },
        { status: 400 }
      );
    }
    
    // Verificar se o rejeitador não é o mesmo que criou o relatório
    if (report.createdBy === validatedData.rejectedBy) {
      return NextResponse.json(
        { error: 'O criador do relatório não pode rejeitá-lo' },
        { status: 400 }
      );
    }
    
    // Atualizar relatório
    const updatedReport: DamageReport = {
      ...report,
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: validatedData.rejectedBy,
      rejectionReason: validatedData.reason,
      rejectionCategory: validatedData.category,
      rejectionFeedback: validatedData.feedback,
      allowResubmission: validatedData.allowResubmission,
      requiresInspection: validatedData.requiresInspection,
      suggestedActions: validatedData.suggestedActions,
      version: report.version + 1
    };
    
    damageReports[reportIndex] = updatedReport;
    
    // Log de auditoria
    console.log('Relatório rejeitado:', {
      reportId,
      rentalId: report.rentalId,
      rejectedBy: validatedData.rejectedBy,
      category: validatedData.category,
      reason: validatedData.reason,
      allowResubmission: validatedData.allowResubmission,
      requiresInspection: validatedData.requiresInspection,
      timestamp: new Date()
    });
    
    // Enviar notificações
    await sendRejectionNotifications(updatedReport, validatedData);
    
    // Criar tarefas de follow-up se necessário
    if (validatedData.requiresInspection) {
      await scheduleInspection(updatedReport);
    }
    
    // Em um sistema real:
    // await prisma.damageReport.update({
    //   where: { id: reportId },
    //   data: {
    //     status: 'rejected',
    //     rejectedAt: new Date(),
    //     rejectedBy: validatedData.rejectedBy,
    //     rejectionReason: validatedData.reason,
    //     rejectionCategory: validatedData.category,
    //     rejectionFeedback: validatedData.feedback,
    //     allowResubmission: validatedData.allowResubmission,
    //     requiresInspection: validatedData.requiresInspection,
    //     suggestedActions: validatedData.suggestedActions
    //   }
    // });
    // await createAuditLog('damage_report_rejected', reportId, validatedData.rejectedBy);
    
    return NextResponse.json({
      message: 'Relatório rejeitado com sucesso',
      report: updatedReport,
      summary: {
        rejectionCategory: getCategoryDescription(validatedData.category),
        allowResubmission: validatedData.allowResubmission,
        requiresInspection: validatedData.requiresInspection,
        suggestedActionsCount: validatedData.suggestedActions?.length || 0
      },
      nextSteps: generateNextSteps(validatedData)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Erro ao rejeitar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para enviar notificações de rejeição
async function sendRejectionNotifications(
  report: DamageReport, 
  rejectionData: z.infer<typeof RejectionSchema>
) {
  try {
    // Notificação para o criador do relatório
    console.log('📧 Enviando notificação de rejeição:', {
      reportId: report.id,
      rentalId: report.rentalId,
      rejectedBy: rejectionData.rejectedBy,
      category: rejectionData.category,
      createdBy: report.createdBy
    });
    
    // E-mail para o criador
    console.log(`📨 E-mail de rejeição enviado para: ${report.createdBy}`);
    // await sendEmail({
    //   to: report.createdBy,
    //   subject: `Relatório de Avarias Rejeitado - ${report.rentalId}`,
    //   template: 'damage-report-rejected',
    //   data: {
    //     reportId: report.id,
    //     rentalId: report.rentalId,
    //     rejectedBy: rejectionData.rejectedBy,
    //     reason: rejectionData.reason,
    //     category: getCategoryDescription(rejectionData.category),
    //     feedback: rejectionData.feedback,
    //     allowResubmission: rejectionData.allowResubmission,
    //     suggestedActions: rejectionData.suggestedActions,
    //     reportUrl: `${process.env.APP_URL}/damage-reports/${report.id}`
    //   }
    // });
    
    // Notificação no sistema
    console.log('🔔 Criando notificação no sistema');
    // await createSystemNotification({
    //   type: 'damage_report_rejected',
    //   title: 'Relatório de Avarias Rejeitado',
    //   message: `Relatório ${report.id} rejeitado - Motivo: ${getCategoryDescription(rejectionData.category)}`,
    //   recipients: [report.createdBy],
    //   data: { 
    //     reportId: report.id, 
    //     rentalId: report.rentalId,
    //     allowResubmission: rejectionData.allowResubmission
    //   },
    //   priority: 'high'
    // });
    
    // Notificação para supervisores se necessário
    if (rejectionData.requiresInspection || !rejectionData.allowResubmission) {
      console.log('👥 Notificando supervisores sobre rejeição especial');
      // await sendEmail({
      //   to: 'supervisores@empresa.com',
      //   subject: `Rejeição Especial de Relatório - ${report.rentalId}`,
      //   template: 'damage-report-special-rejection',
      //   data: {
      //     reportId: report.id,
      //     rentalId: report.rentalId,
      //     rejectedBy: rejectionData.rejectedBy,
      //     category: rejectionData.category,
      //     requiresInspection: rejectionData.requiresInspection,
      //     allowResubmission: rejectionData.allowResubmission
      //   }
      // });
    }
    
  } catch (error) {
    console.error('Erro ao enviar notificações de rejeição:', error);
  }
}

// Função auxiliar para agendar inspeção
async function scheduleInspection(report: DamageReport) {
  try {
    console.log('🔍 Agendando inspeção para relatório rejeitado:', {
      reportId: report.id,
      rentalId: report.rentalId
    });
    
    // Em um sistema real:
    // await createInspectionTask({
    //   type: 'damage_verification',
    //   reportId: report.id,
    //   rentalId: report.rentalId,
    //   priority: 'high',
    //   dueDate: addDays(new Date(), 3), // 3 dias para inspeção
    //   assignedTo: 'inspection_team',
    //   description: `Inspeção necessária devido à rejeição do relatório ${report.id}`,
    //   metadata: {
    //     rejectionCategory: report.rejectionCategory,
    //     originalDamagesCount: report.damages.length,
    //     originalTotalCost: report.totalCost
    //   }
    // });
    
    console.log('✅ Tarefa de inspeção criada com sucesso');
    
  } catch (error) {
    console.error('Erro ao agendar inspeção:', error);
  }
}

// Função auxiliar para obter descrição da categoria
function getCategoryDescription(category: string): string {
  const descriptions = {
    insufficient_evidence: 'Evidências Insuficientes',
    pre_existing_damage: 'Avaria Pré-existente',
    normal_wear: 'Desgaste Normal',
    incorrect_assessment: 'Avaliação Incorreta',
    missing_documentation: 'Documentação Faltante',
    policy_violation: 'Violação de Política',
    duplicate_report: 'Relatório Duplicado',
    other: 'Outros Motivos'
  };
  
  return descriptions[category as keyof typeof descriptions] || category;
}

// Função auxiliar para gerar próximos passos
function generateNextSteps(rejectionData: z.infer<typeof RejectionSchema>): string[] {
  const steps: string[] = [];
  
  if (rejectionData.allowResubmission) {
    steps.push('Relatório pode ser corrigido e reenviado');
    
    if (rejectionData.suggestedActions && rejectionData.suggestedActions.length > 0) {
      steps.push('Seguir ações sugeridas antes de reenviar');
    }
    
    steps.push('Revisar feedback e fazer correções necessárias');
  } else {
    steps.push('Relatório rejeitado definitivamente');
    steps.push('Contatar supervisor para esclarecimentos');
  }
  
  if (rejectionData.requiresInspection) {
    steps.push('Inspeção física será agendada');
    steps.push('Aguardar resultado da inspeção');
  }
  
  steps.push('Notificação enviada ao criador do relatório');
  
  return steps;
}

// Função auxiliar para validar permissões de rejeição
function canUserRejectReport(report: DamageReport, userRole: string, userId: string): boolean {
  // Regras de negócio para rejeição
  
  // Criador não pode rejeitar próprio relatório
  if (report.createdBy === userId) {
    return false;
  }
  
  // Apenas gerentes, supervisores e revisores podem rejeitar
  const allowedRoles = ['manager', 'supervisor', 'reviewer', 'admin'];
  if (!allowedRoles.includes(userRole)) {
    return false;
  }
  
  return true;
}

// Função auxiliar para gerar estatísticas de rejeição
function generateRejectionStats(category: string) {
  // Estatísticas úteis para análise
  const rejectedReports = damageReports.filter(r => 
    r.status === 'rejected' && r.rejectionCategory === category
  );
  
  return {
    categoryCount: rejectedReports.length,
    categoryPercentage: (rejectedReports.length / damageReports.length) * 100,
    averageResubmissionRate: calculateResubmissionRate(category),
    commonIssues: getCommonIssuesForCategory(category)
  };
}

// Função auxiliar para calcular taxa de reenvio
function calculateResubmissionRate(category: string): number {
  const rejectedWithCategory = damageReports.filter(r => 
    r.rejectionCategory === category
  );
  
  const resubmitted = rejectedWithCategory.filter(r => 
    r.allowResubmission && r.version > 1
  );
  
  return rejectedWithCategory.length > 0 
    ? (resubmitted.length / rejectedWithCategory.length) * 100 
    : 0;
}

// Função auxiliar para obter problemas comuns por categoria
function getCommonIssuesForCategory(category: string): string[] {
  const commonIssues: Record<string, string[]> = {
    insufficient_evidence: [
      'Fotos de baixa qualidade',
      'Falta de fotos do contexto',
      'Ausência de documentação de suporte'
    ],
    pre_existing_damage: [
      'Avaria já documentada anteriormente',
      'Sinais de desgaste antigo',
      'Falta de check-in detalhado'
    ],
    normal_wear: [
      'Desgaste esperado para idade do item',
      'Uso normal dentro do período de locação',
      'Manutenção preventiva necessária'
    ],
    incorrect_assessment: [
      'Valor de reparo superestimado',
      'Categoria de severidade incorreta',
      'Método de reparo inadequado'
    ],
    missing_documentation: [
      'Falta de orçamentos',
      'Ausência de laudo técnico',
      'Documentação incompleta'
    ]
  };
  
  return commonIssues[category] || [];
}