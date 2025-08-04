import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asaasClient, AsaasCustomerSchema } from '@/lib/asaas';

// Schema para validação de parâmetros de busca
const SearchParamsSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  cpfCnpj: z.string().optional(),
  groupName: z.string().optional(),
  externalReference: z.string().optional(),
  offset: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

// GET /api/asaas/customers - Listar clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    // Validar parâmetros
    const validatedParams = SearchParamsSchema.parse(params);
    
    // Buscar clientes no Asaas
    const customers = await asaasClient.listCustomers(validatedParams);
    
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Parâmetros inválidos',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

// POST /api/asaas/customers - Criar cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados do cliente
    const validatedData = AsaasCustomerSchema.parse(body);
    
    // Criar cliente no Asaas
    const customer = await asaasClient.createCustomer(validatedData);
    
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Dados inválidos',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

// DELETE /api/asaas/customers - Limpar todos os clientes (apenas para desenvolvimento)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar se está em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { message: 'Operação não permitida em produção' },
        { status: 403 }
      );
    }
    
    // Buscar todos os clientes
    const customersResponse = await asaasClient.listCustomers({ limit: 100 });
    const customers = customersResponse.data || [];
    
    // Deletar cada cliente
    const deletePromises = customers.map(customer => 
      asaasClient.deleteCustomer(customer.id).catch(error => {
        console.warn(`Erro ao deletar cliente ${customer.id}:`, error);
        return null;
      })
    );
    
    const results = await Promise.all(deletePromises);
    const deletedCount = results.filter(result => result !== null).length;
    
    return NextResponse.json({
      message: `${deletedCount} clientes foram removidos`,
      total: customers.length,
      deleted: deletedCount,
    });
  } catch (error) {
    console.error('Erro ao limpar clientes:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}