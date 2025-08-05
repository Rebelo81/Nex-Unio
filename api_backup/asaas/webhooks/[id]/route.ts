import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asaasClient } from '@/lib/asaas';

// Schema para atualização de webhook
const UpdateWebhookSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  url: z.string().url('URL inválida').optional(),
  email: z.string().email('Email inválido').optional(),
  events: z.array(z.string()).min(1, 'Pelo menos um evento deve ser selecionado').optional(),
  authToken: z.string().optional(),
  enabled: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/asaas/webhooks/[id] - Obter webhook específico
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { message: 'ID do webhook é obrigatório' },
        { status: 400 }
      );
    }
    
    const webhook = await asaasClient.getWebhook(id);
    
    if (!webhook) {
      return NextResponse.json(
        { message: 'Webhook não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Erro ao buscar webhook:', error);
    
    // Tratar erro específico do Asaas
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json(
          { message: 'Webhook não encontrado' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        return NextResponse.json(
          { message: 'Não autorizado' },
          { status: 401 }
        );
      }
    }
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

// PATCH /api/asaas/webhooks/[id] - Atualizar webhook
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { message: 'ID do webhook é obrigatório' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validar dados de atualização
    const validatedData = UpdateWebhookSchema.parse(body);
    
    // Verificar se o webhook existe
    const existingWebhook = await asaasClient.getWebhook(id);
    if (!existingWebhook) {
      return NextResponse.json(
        { message: 'Webhook não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar webhook
    const updatedWebhook = await asaasClient.updateWebhook(id, validatedData);
    
    return NextResponse.json(updatedWebhook);
  } catch (error) {
    console.error('Erro ao atualizar webhook:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Dados inválidos',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    // Tratar erro específico do Asaas
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json(
          { message: 'Webhook não encontrado' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        return NextResponse.json(
          { message: 'Não autorizado' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { message: 'Dados inválidos fornecidos' },
          { status: 400 }
        );
      }
    }
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

// DELETE /api/asaas/webhooks/[id] - Excluir webhook
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { message: 'ID do webhook é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se o webhook existe
    const existingWebhook = await asaasClient.getWebhook(id);
    if (!existingWebhook) {
      return NextResponse.json(
        { message: 'Webhook não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir webhook
    await asaasClient.deleteWebhook(id);
    
    return NextResponse.json(
      { message: 'Webhook excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir webhook:', error);
    
    // Tratar erro específico do Asaas
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json(
          { message: 'Webhook não encontrado' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        return NextResponse.json(
          { message: 'Não autorizado' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('cannot be deleted') || error.message.includes('in use')) {
        return NextResponse.json(
          { message: 'Webhook não pode ser excluído pois está em uso' },
          { status: 409 }
        );
      }
    }
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

// POST /api/asaas/webhooks/[id]/test - Testar webhook
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { message: 'ID do webhook é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se o webhook existe
    const existingWebhook = await asaasClient.getWebhook(id);
    if (!existingWebhook) {
      return NextResponse.json(
        { message: 'Webhook não encontrado' },
        { status: 404 }
      );
    }
    
    // Testar webhook (enviar evento de teste)
    const testResult = await asaasClient.testWebhook(id);
    
    return NextResponse.json({
      message: 'Teste de webhook enviado com sucesso',
      result: testResult
    });
  } catch (error) {
    console.error('Erro ao testar webhook:', error);
    
    // Tratar erro específico do Asaas
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json(
          { message: 'Webhook não encontrado' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        return NextResponse.json(
          { message: 'Não autorizado' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('disabled')) {
        return NextResponse.json(
          { message: 'Webhook está desabilitado' },
          { status: 400 }
        );
      }
    }
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}