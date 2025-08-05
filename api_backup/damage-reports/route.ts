import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para relatórios de avarias
const DamageReportSchema = z.object({
  rentalId: z.string().min(1, 'ID da locação é obrigatório'),
  damages: z.array(z.object({
    id: z.string(),
    itemName: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    repairCost: z.number().min(0),
    category: z.enum(['structural', 'functional', 'aesthetic', 'missing']),
    reportedBy: z.string(),
    reportedAt: z.string().transform(str => new Date(str)),
    photos: z.array(z.string()).optional(),
    notes: z.string().optional()
  })),
  totalCost: z.number().min(0),
  notes: z.string().optional(),
  createdBy: z.string().min(1, 'Criador do relatório é obrigatório')
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

// GET - Listar relatórios de avarias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rentalId = searchParams.get('rentalId');
    const status = searchParams.get('status');
    const createdBy = searchParams.get('createdBy');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let filteredReports = damageReports;
    
    // Aplicar filtros
    if (rentalId) {
      filteredReports = filteredReports.filter(r => r.rentalId === rentalId);
    }
    
    if (status) {
      filteredReports = filteredReports.filter(r => r.status === status);
    }
    
    if (createdBy) {
      filteredReports = filteredReports.filter(r => r.createdBy === createdBy);
    }
    
    // Ordenar por data de criação (mais recentes primeiro)
    filteredReports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);
    
    // Estatísticas
    const stats = {
      total: filteredReports.length,
      byStatus: {
        draft: filteredReports.filter(r => r.status === 'draft').length,
        submitted: filteredReports.filter(r => r.status === 'submitted').length,
        approved: filteredReports.filter(r => r.status === 'approved').length,
        rejected: filteredReports.filter(r => r.status === 'rejected').length,
        billed: filteredReports.filter(r => r.status === 'billed').length
      },
      totalValue: filteredReports.reduce((sum, r) => sum + r.totalCost, 0),
      averageValue: filteredReports.length > 0 
        ? filteredReports.reduce((sum, r) => sum + r.totalCost, 0) / filteredReports.length 
        : 0,
      pendingApproval: filteredReports.filter(r => r.status === 'submitted').length,
      awaitingBilling: filteredReports.filter(r => r.status === 'approved').length
    };
    
    return NextResponse.json({
      reports: paginatedReports,
      pagination: {
        page,
        limit,
        total: filteredReports.length,
        totalPages: Math.ceil(filteredReports.length / limit),
        hasNext: endIndex < filteredReports.length,
        hasPrev: page > 1
      },
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo relatório de avarias
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação
    const validatedData = DamageReportSchema.parse(body);
    
    // Verificar se já existe um relatório para esta locação
    const existingReport = damageReports.find(r => 
      r.rentalId === validatedData.rentalId && 
      (r.status === 'draft' || r.status === 'submitted')
    );
    
    if (existingReport) {
      return NextResponse.json(
        { 
          error: 'Já existe um relatório em andamento para esta locação',
          existingReportId: existingReport.id
        },
        { status: 409 }
      );
    }
    
    // Criar novo relatório
    const newReport: DamageReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      rentalId: validatedData.rentalId,
      damages: validatedData.damages,
      totalCost: validatedData.totalCost,
      status: 'draft',
      createdAt: new Date(),
      createdBy: validatedData.createdBy,
      notes: validatedData.notes,
      version: 1
    };
    
    damageReports.push(newReport);
    
    // Log de auditoria
    console.log('Novo relatório de avarias criado:', {
      reportId: newReport.id,
      rentalId: newReport.rentalId,
      damagesCount: newReport.damages.length,
      totalCost: newReport.totalCost,
      createdBy: newReport.createdBy,
      timestamp: new Date()
    });
    
    // Notificações automáticas
    if (newReport.totalCost > 1000) {
      console.log(`🚨 Relatório de alto valor criado: R$ ${newReport.totalCost.toLocaleString('pt-BR')}`);
      // await sendHighValueDamageAlert(newReport);
    }
    
    // Em um sistema real:
    // await prisma.damageReport.create({ data: newReport });
    // await createAuditLog('damage_report_created', newReport.id, validatedData.createdBy);
    
    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Erro ao criar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover relatório (apenas rascunhos)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    
    if (!reportId) {
      return NextResponse.json(
        { error: 'ID do relatório é obrigatório' },
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
      message: 'Relatório removido com sucesso',
      removedReport: {
        id: report.id,
        rentalId: report.rentalId,
        totalCost: report.totalCost
      }
    });
  } catch (error) {
    console.error('Erro ao remover relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para calcular estatísticas de relatórios
export function calculateReportStatistics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const recentReports = damageReports.filter(r => r.createdAt >= thirtyDaysAgo);
  
  return {
    total: damageReports.length,
    recent: recentReports.length,
    totalValue: damageReports.reduce((sum, r) => sum + r.totalCost, 0),
    averageValue: damageReports.length > 0 
      ? damageReports.reduce((sum, r) => sum + r.totalCost, 0) / damageReports.length 
      : 0,
    averageProcessingTime: calculateAverageProcessingTime(),
    approvalRate: calculateApprovalRate(),
    topDamageCategories: getTopDamageCategories(),
    monthlyTrend: getMonthlyTrend()
  };
}

function calculateAverageProcessingTime(): number {
  const processedReports = damageReports.filter(r => 
    r.submittedAt && (r.approvedAt || r.rejectedAt)
  );
  
  if (processedReports.length === 0) return 0;
  
  const totalTime = processedReports.reduce((sum, r) => {
    const endTime = r.approvedAt || r.rejectedAt!;
    return sum + (endTime.getTime() - r.submittedAt!.getTime());
  }, 0);
  
  return totalTime / processedReports.length / (1000 * 60 * 60); // em horas
}

function calculateApprovalRate(): number {
  const submittedReports = damageReports.filter(r => 
    r.status === 'approved' || r.status === 'rejected' || r.status === 'billed'
  );
  
  if (submittedReports.length === 0) return 0;
  
  const approvedReports = submittedReports.filter(r => 
    r.status === 'approved' || r.status === 'billed'
  );
  
  return (approvedReports.length / submittedReports.length) * 100;
}

function getTopDamageCategories() {
  const categoryCount: Record<string, number> = {};
  
  damageReports.forEach(report => {
    report.damages.forEach(damage => {
      categoryCount[damage.category] = (categoryCount[damage.category] || 0) + 1;
    });
  });
  
  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
}

function getMonthlyTrend() {
  const monthlyData: Record<string, { count: number; value: number }> = {};
  
  damageReports.forEach(report => {
    const monthKey = report.createdAt.toISOString().substring(0, 7); // YYYY-MM
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, value: 0 };
    }
    
    monthlyData[monthKey].count++;
    monthlyData[monthKey].value += report.totalCost;
  });
  
  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // últimos 12 meses
    .map(([month, data]) => ({ month, ...data }));
}