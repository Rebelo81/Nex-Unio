import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema para atualização de avaria
const UpdateDamageSchema = z.object({
  itemName: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  repairCost: z.number().min(0).optional(),
  photos: z.array(z.string()).optional(),
  category: z.enum(['structural', 'functional', 'aesthetic', 'missing']).optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'repaired']).optional()
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
  updatedAt?: Date;
  updatedBy?: string;
}

// Simulação de banco de dados em memória (importado do arquivo principal)
// Em um sistema real, isso viria do banco de dados
let damages: DamageItem[] = [];

// GET - Obter avaria específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const damageId = params.id;
    
    const damage = damages.find(d => d.id === damageId);
    
    if (!damage) {
      return NextResponse.json(
        { error: 'Avaria não encontrada' },
        { status: 404 }
      );
    }
    
    // Adicionar informações relacionadas
    const relatedDamages = damages.filter(d => 
      d.rentalId === damage.rentalId && d.id !== damage.id
    );
    
    const damageHistory = [
      {
        action: 'created',
        timestamp: damage.reportedAt,
        user: damage.reportedBy,
        details: 'Avaria registrada'
      }
    ];
    
    if (damage.updatedAt) {
      damageHistory.push({
        action: 'updated',
        timestamp: damage.updatedAt,
        user: damage.updatedBy || 'Sistema',
        details: 'Avaria atualizada'
      });
    }
    
    return NextResponse.json({
      damage,
      relatedDamages,
      history: damageHistory,
      stats: {
        totalCostForRental: damages
          .filter(d => d.rentalId === damage.rentalId)
          .reduce((sum, d) => sum + d.repairCost, 0),
        damageCountForRental: damages.filter(d => d.rentalId === damage.rentalId).length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar avaria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar avaria
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const damageId = params.id;
    const body = await request.json();
    
    // Validação
    const validatedData = UpdateDamageSchema.parse(body);
    
    const damageIndex = damages.findIndex(d => d.id === damageId);
    
    if (damageIndex === -1) {
      return NextResponse.json(
        { error: 'Avaria não encontrada' },
        { status: 404 }
      );
    }
    
    const currentDamage = damages[damageIndex];
    
    // Verificar se a avaria pode ser atualizada
    if (currentDamage.status === 'repaired') {
      return NextResponse.json(
        { error: 'Não é possível atualizar uma avaria já reparada' },
        { status: 400 }
      );
    }
    
    // Atualizar avaria
    const updatedDamage: DamageItem = {
      ...currentDamage,
      ...validatedData,
      updatedAt: new Date(),
      updatedBy: body.updatedBy || 'Sistema'
    };
    
    damages[damageIndex] = updatedDamage;
    
    // Log de auditoria
    console.log(`Avaria atualizada: ${damageId}`, {
      changes: validatedData,
      updatedBy: body.updatedBy,
      timestamp: new Date()
    });
    
    // Notificações baseadas em mudanças críticas
    if (validatedData.severity === 'critical' && currentDamage.severity !== 'critical') {
      console.log(`🚨 Avaria escalada para CRÍTICA: ${updatedDamage.itemName}`);
      // await sendCriticalDamageAlert(updatedDamage);
    }
    
    if (validatedData.status === 'approved' && currentDamage.status !== 'approved') {
      console.log(`✅ Avaria aprovada: ${updatedDamage.itemName} - Custo: R$ ${updatedDamage.repairCost}`);
      // await generateBillingForApprovedDamage(updatedDamage);
    }
    
    return NextResponse.json(updatedDamage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Erro ao atualizar avaria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover avaria
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const damageId = params.id;
    
    const damageIndex = damages.findIndex(d => d.id === damageId);
    
    if (damageIndex === -1) {
      return NextResponse.json(
        { error: 'Avaria não encontrada' },
        { status: 404 }
      );
    }
    
    const damage = damages[damageIndex];
    
    // Verificar se a avaria pode ser removida
    if (damage.status === 'approved' || damage.status === 'repaired') {
      return NextResponse.json(
        { error: 'Não é possível remover uma avaria aprovada ou reparada' },
        { status: 400 }
      );
    }
    
    // Remover fotos associadas
    if (damage.photos.length > 0) {
      console.log(`Removendo ${damage.photos.length} fotos da avaria ${damageId}`);
      // Em um sistema real:
      // await deletePhotosFromStorage(damage.photos);
    }
    
    // Remover avaria
    damages.splice(damageIndex, 1);
    
    // Log de auditoria
    console.log(`Avaria removida: ${damageId}`, {
      item: damage.itemName,
      cost: damage.repairCost,
      removedAt: new Date()
    });
    
    return NextResponse.json({ 
      message: 'Avaria removida com sucesso',
      removedDamage: {
        id: damage.id,
        itemName: damage.itemName,
        repairCost: damage.repairCost
      }
    });
  } catch (error) {
    console.error('Erro ao remover avaria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para validar permissões
function canModifyDamage(damage: DamageItem, userRole: string): boolean {
  // Regras de negócio para modificação de avarias
  if (damage.status === 'repaired') {
    return false; // Avarias reparadas não podem ser modificadas
  }
  
  if (damage.status === 'approved' && userRole !== 'admin') {
    return false; // Apenas admins podem modificar avarias aprovadas
  }
  
  return true;
}

// Função auxiliar para calcular impacto da avaria
function calculateDamageImpact(damage: DamageItem) {
  let impactScore = 0;
  
  // Pontuação baseada na severidade
  const severityScores = {
    low: 1,
    medium: 3,
    high: 7,
    critical: 10
  };
  
  impactScore += severityScores[damage.severity];
  
  // Pontuação baseada no custo
  if (damage.repairCost > 1000) impactScore += 5;
  else if (damage.repairCost > 500) impactScore += 3;
  else if (damage.repairCost > 100) impactScore += 1;
  
  // Pontuação baseada na categoria
  const categoryScores = {
    structural: 5,
    functional: 4,
    missing: 3,
    aesthetic: 1
  };
  
  impactScore += categoryScores[damage.category];
  
  return {
    score: impactScore,
    level: impactScore >= 15 ? 'critical' : 
           impactScore >= 10 ? 'high' : 
           impactScore >= 5 ? 'medium' : 'low',
    requiresImmediateAttention: impactScore >= 15,
    estimatedRepairTime: damage.category === 'structural' ? '3-7 dias' :
                        damage.category === 'functional' ? '1-3 dias' :
                        damage.category === 'missing' ? '1-2 dias' : '1 dia'
  };
}