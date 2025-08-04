import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para avarias
const DamageSchema = z.object({
  itemName: z.string().min(1, 'Nome do item é obrigatório'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  repairCost: z.number().min(0, 'Custo deve ser positivo'),
  photos: z.array(z.string()).optional(),
  category: z.enum(['structural', 'functional', 'aesthetic', 'missing']),
  reportedBy: z.string().min(1, 'Responsável é obrigatório'),
  notes: z.string().optional(),
  rentalId: z.string().min(1, 'ID da locação é obrigatório')
});

interface DamageItem {
  id: string;
  itemName: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  repairCost: number;
  photos: string[];
  category: 'structural' | 'functional' | 'aesthetic' | 'missing';
  reportedBy: string;
  reportedAt: Date;
  notes?: string;
  rentalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'repaired';
}

// Simulação de banco de dados em memória
let damages: DamageItem[] = [];

// GET - Listar avarias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rentalId = searchParams.get('rentalId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    
    let filteredDamages = damages;
    
    // Filtros
    if (rentalId) {
      filteredDamages = filteredDamages.filter(d => d.rentalId === rentalId);
    }
    
    if (status) {
      filteredDamages = filteredDamages.filter(d => d.status === status);
    }
    
    if (severity) {
      filteredDamages = filteredDamages.filter(d => d.severity === severity);
    }
    
    if (category) {
      filteredDamages = filteredDamages.filter(d => d.category === category);
    }
    
    // Estatísticas
    const stats = {
      total: filteredDamages.length,
      totalCost: filteredDamages.reduce((sum, d) => sum + d.repairCost, 0),
      byStatus: {
        pending: filteredDamages.filter(d => d.status === 'pending').length,
        approved: filteredDamages.filter(d => d.status === 'approved').length,
        rejected: filteredDamages.filter(d => d.status === 'rejected').length,
        repaired: filteredDamages.filter(d => d.status === 'repaired').length
      },
      bySeverity: {
        low: filteredDamages.filter(d => d.severity === 'low').length,
        medium: filteredDamages.filter(d => d.severity === 'medium').length,
        high: filteredDamages.filter(d => d.severity === 'high').length,
        critical: filteredDamages.filter(d => d.severity === 'critical').length
      },
      byCategory: {
        structural: filteredDamages.filter(d => d.category === 'structural').length,
        functional: filteredDamages.filter(d => d.category === 'functional').length,
        aesthetic: filteredDamages.filter(d => d.category === 'aesthetic').length,
        missing: filteredDamages.filter(d => d.category === 'missing').length
      }
    };
    
    return NextResponse.json({
      damages: filteredDamages,
      stats,
      total: filteredDamages.length
    });
  } catch (error) {
    console.error('Erro ao buscar avarias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova avaria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação
    const validatedData = DamageSchema.parse(body);
    
    // Criar nova avaria
    const newDamage: DamageItem = {
      id: `damage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      photos: validatedData.photos || [],
      reportedAt: new Date(),
      status: 'pending'
    };
    
    damages.push(newDamage);
    
    // Simular notificação para administradores
    console.log(`Nova avaria registrada: ${newDamage.id} - ${newDamage.itemName}`);
    
    // Em um sistema real, aqui você salvaria no banco de dados
    // await prisma.damage.create({ data: newDamage });
    
    // Simular envio de notificação
    if (newDamage.severity === 'critical' || newDamage.severity === 'high') {
      console.log(`🚨 AVARIA CRÍTICA/ALTA: ${newDamage.itemName} - Custo: R$ ${newDamage.repairCost}`);
      // await sendUrgentNotification(newDamage);
    }
    
    return NextResponse.json(newDamage, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Erro ao criar avaria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Limpar todas as avarias (apenas para desenvolvimento)
export async function DELETE() {
  try {
    damages = [];
    return NextResponse.json({ message: 'Todas as avarias foram removidas' });
  } catch (error) {
    console.error('Erro ao limpar avarias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para calcular estatísticas de avarias
export function calculateDamageStatistics(rentalId?: string) {
  const filteredDamages = rentalId 
    ? damages.filter(d => d.rentalId === rentalId)
    : damages;
    
  return {
    totalDamages: filteredDamages.length,
    totalCost: filteredDamages.reduce((sum, d) => sum + d.repairCost, 0),
    averageCost: filteredDamages.length > 0 
      ? filteredDamages.reduce((sum, d) => sum + d.repairCost, 0) / filteredDamages.length 
      : 0,
    criticalCount: filteredDamages.filter(d => d.severity === 'critical').length,
    pendingCount: filteredDamages.filter(d => d.status === 'pending').length,
    mostCommonCategory: getMostCommonValue(filteredDamages.map(d => d.category)),
    mostCommonSeverity: getMostCommonValue(filteredDamages.map(d => d.severity))
  };
}

function getMostCommonValue(array: string[]): string | null {
  if (array.length === 0) return null;
  
  const frequency = array.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.keys(frequency).reduce((a, b) => 
    frequency[a] > frequency[b] ? a : b
  );
}

// Função para simular integração com sistema de cobrança
export async function generateDamageBilling(damageIds: string[]) {
  const selectedDamages = damages.filter(d => damageIds.includes(d.id));
  const totalAmount = selectedDamages.reduce((sum, d) => sum + d.repairCost, 0);
  
  if (totalAmount === 0) {
    throw new Error('Nenhuma avaria com custo encontrada');
  }
  
  // Simular criação de cobrança no Asaas
  const billingData = {
    id: `billing-${Date.now()}`,
    amount: totalAmount,
    description: `Cobrança por avarias - ${selectedDamages.length} item(s)`,
    damages: selectedDamages.map(d => ({
      id: d.id,
      item: d.itemName,
      cost: d.repairCost,
      severity: d.severity
    })),
    createdAt: new Date(),
    status: 'pending',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
  };
  
  console.log('Cobrança gerada:', billingData);
  
  // Em um sistema real:
  // const asaasResponse = await createAsaasBilling(billingData);
  // return asaasResponse;
  
  return billingData;
}