import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asaasClient, AsaasCustomerSchema } from '@/lib/asaas';

// Schema para atualização de cliente (todos os campos opcionais)
const UpdateCustomerSchema = AsaasCustomerSchema.partial();

// GET /api/asaas/customers/[id] - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;
    
    if (!customerId) {
      return NextResponse.json(
        { message: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar cliente no Asaas
    const customer = await asaasClient.getCustomer(customerId);
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Se o erro contém "404" ou "not found", retornar 404
    if (message.toLowerCase().includes('404') || message.toLowerCase().includes('not found')) {
      return NextResponse.json(
        { message: 'Cliente não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

// PATCH /api/asaas/customers/[id] - Atualizar cliente
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;
    
    if (!customerId) {
      return NextResponse.json(
        { message: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validar dados de atualização
    const validatedData = UpdateCustomerSchema.parse(body);
    
    // Verificar se há dados para atualizar
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { message: 'Nenhum dado fornecido para atualização' },
        { status: 400 }
      );
    }
    
    // Atualizar cliente no Asaas
    const customer = await asaasClient.updateCustomer(customerId, validatedData);
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    
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
    
    // Se o erro contém "404" ou "not found", retornar 404
    if (message.toLowerCase().includes('404') || message.toLowerCase().includes('not found')) {
      return NextResponse.json(
        { message: 'Cliente não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

// DELETE /api/asaas/customers/[id] - Excluir cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;
    
    if (!customerId) {
      return NextResponse.json(
        { message: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se o cliente existe antes de tentar deletar
    try {
      await asaasClient.getCustomer(customerId);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('404') || message.toLowerCase().includes('not found')) {
        return NextResponse.json(
          { message: 'Cliente não encontrado' },
          { status: 404 }
        );
      }
      throw error; // Re-throw se não for erro 404
    }
    
    // Deletar cliente no Asaas
    const result = await asaasClient.deleteCustomer(customerId);
    
    return NextResponse.json({
      message: 'Cliente excluído com sucesso',
      deleted: result.deleted,
      id: result.id,
    });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar se o cliente não pode ser deletado
    if (message.toLowerCase().includes('cannot be deleted') || 
        message.toLowerCase().includes('não pode ser excluído')) {
      return NextResponse.json(
        { message: 'Cliente não pode ser excluído pois possui pagamentos associados' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}