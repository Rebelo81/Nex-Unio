import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schemas de validação
const ApprovalSchema = z.object({
  approvedBy: z.string().min(1, 'Aprovador é obrigatório'),
  notes: z.string().optional()
});

const RejectionSchema = z.object({
  rejectedBy: z.string().min(1, 'Responsável pela rejeição é obrigatório'),
  reason: z.string().min(10, 'Motivo da rejeição deve ter pelo menos 10 caracteres'),
  notes: z.string().optional()
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
}

// Simulação de banco de dados em memória
let damageReports: DamageReport[] = [];

// GET - Obter relatório específico
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
    
    // Adicionar informações extras
    const reportWithExtras = {
      ...report,
      damagesSummary: {
        total: report.damages.length,
        bySeverity: {
          critical: report.damages.filter(d => d.severity === 'critical').length,
          high: report.damages.filter(d => d.severity === 'high').length,
          medium: report.damages.filter(d => d.severity === 'medium').length,
          low: report.damages.filter(d => d.severity === 'low').length
        },
        byCategory: {
          structural: report.damages.filter(d => d.category === 'structural').length,
          functional: report.damages.filter(d => d.category === 'functional').length,
          aesthetic: report.damages.filter(d => d.category === 'aesthetic').length,
          missing: report.damages.filter(d => d.category === 'missing').length
        },
        averageCost: report.damages.length > 0 
          ? report.totalCost / report.damages.length 
          : 0,
        photosCount: report.damages.reduce((sum, d) => sum + (d.photos?.length || 0), 0)
      },
      timeline: generateReportTimeline(report),
      canEdit: report.status === 'draft',
      canSubmit: report.status === 'draft' && report.damages.length > 0,
      canApprove: report.status === 'submitted',
      canReject: report.status === 'submitted',
      canBill: report.status === 'approved'
    };
    
    return NextResponse.json(reportWithExtras);
  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar relatório
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const body = await request.json();
    
    const reportIndex = damageReports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }
    
    const currentReport = damageReports[reportIndex];
    
    // Verificar se pode ser editado
    if (currentReport.status !== 'draft') {
      return NextResponse.json(
        { error: 'Apenas relatórios em rascunho podem ser editados' },
        { status: 400 }
      );
    }
    
    // Atualizar relatório
    const updatedReport: DamageReport = {
      ...currentReport,
      ...body,
      version: currentReport.version + 1
    };
    
    damageReports[reportIndex] = updatedReport;
    
    console.log(`Relatório atualizado: ${reportId}`);
    
    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Erro ao atualizar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover relatório
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    
    const reportIndex = damageReports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }
    
    const report = damageReports[reportIndex];
    
    // Verificar se pode ser removido
    if (report.status !== 'draft') {
      return NextResponse.json(
        { error: 'Apenas relatórios em rascunho podem ser removidos' },
        { status: 400 }
      );
    }
    
    // Remover relatório
    damageReports.splice(reportIndex, 1);
    
    console.log(`Relatório removido: ${reportId}`);
    
    return NextResponse.json({
      message: 'Relatório removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para gerar timeline do relatório
function generateReportTimeline(report: DamageReport) {
  const timeline = [
    {
      event: 'created',
      timestamp: report.createdAt,
      user: report.createdBy,
      description: 'Relatório criado',
      icon: '📝'
    }
  ];
  
  if (report.submittedAt) {
    timeline.push({
      event: 'submitted',
      timestamp: report.submittedAt,
      user: report.createdBy,
      description: 'Relatório enviado para aprovação',
      icon: '📤'
    });
  }
  
  if (report.approvedAt && report.approvedBy) {
    timeline.push({
      event: 'approved',
      timestamp: report.approvedAt,
      user: report.approvedBy,
      description: 'Relatório aprovado',
      icon: '✅'
    });
  }
  
  if (report.rejectedAt && report.rejectedBy) {
    timeline.push({
      event: 'rejected',
      timestamp: report.rejectedAt,
      user: report.rejectedBy,
      description: `Relatório rejeitado: ${report.rejectionReason}`,
      icon: '❌'
    });
  }
  
  if (report.billedAt) {
    timeline.push({
      event: 'billed',
      timestamp: report.billedAt,
      user: 'Sistema',
      description: `Cobrança gerada: ${report.billingReference}`,
      icon: '💰'
    });
  }
  
  return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// Função auxiliar para validar permissões
function canUserModifyReport(report: DamageReport, userRole: string, userId: string): boolean {
  // Regras de negócio para modificação de relatórios
  if (report.status === 'billed') {
    return false; // Relatórios faturados não podem ser modificados
  }
  
  if (report.status === 'approved' && userRole !== 'admin') {
    return false; // Apenas admins podem modificar relatórios aprovados
  }
  
  if (report.status === 'draft' && report.createdBy !== userId && userRole !== 'admin') {
    return false; // Apenas o criador ou admin pode modificar rascunhos
  }
  
  return true;
}

// Função auxiliar para calcular impacto financeiro
function calculateFinancialImpact(report: DamageReport) {
  const criticalDamages = report.damages.filter(d => d.severity === 'critical');
  const structuralDamages = report.damages.filter(d => d.category === 'structural');
  
  return {
    totalCost: report.totalCost,
    criticalCost: criticalDamages.reduce((sum, d) => sum + d.repairCost, 0),
    structuralCost: structuralDamages.reduce((sum, d) => sum + d.repairCost, 0),
    averageDamageCost: report.damages.length > 0 ? report.totalCost / report.damages.length : 0,
    riskLevel: report.totalCost > 5000 ? 'high' : 
               report.totalCost > 1000 ? 'medium' : 'low',
    estimatedRepairTime: calculateEstimatedRepairTime(report.damages),
    insuranceCoverage: calculateInsuranceCoverage(report.damages)
  };
}

function calculateEstimatedRepairTime(damages: any[]): string {
  const timeMap = {
    structural: 7,
    functional: 3,
    missing: 2,
    aesthetic: 1
  };
  
  const maxTime = Math.max(...damages.map(d => timeMap[d.category as keyof typeof timeMap] || 1));
  
  if (maxTime >= 7) return '1-2 semanas';
  if (maxTime >= 3) return '3-7 dias';
  if (maxTime >= 2) return '1-3 dias';
  return '1 dia';
}

function calculateInsuranceCoverage(damages: any[]): { covered: number; notCovered: number } {
  // Simulação de cobertura de seguro
  const covered = damages
    .filter(d => d.category === 'structural' || d.severity === 'critical')
    .reduce((sum, d) => sum + d.repairCost, 0);
  
  const notCovered = damages
    .filter(d => d.category === 'aesthetic' || d.severity === 'low')
    .reduce((sum, d) => sum + d.repairCost, 0);
  
  return { covered, notCovered };
}