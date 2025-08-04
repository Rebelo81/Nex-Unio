# Integração com Lalamove

Este documento descreve como configurar e usar a integração com a API do Lalamove para gerenciar entregas e coletas de equipamentos alugados.

## 📋 Pré-requisitos

1. **Conta no Lalamove**: Criar uma conta de desenvolvedor no [Lalamove Developer Portal](https://developers.lalamove.com/)
2. **API Keys**: Obter as chaves de API (API Key e Secret) no painel do desenvolvedor
3. **Webhook URL**: Configurar a URL do webhook para receber atualizações em tempo real

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` e configure as seguintes variáveis:

```bash
# Configurações do Lalamove
LALAMOVE_API_KEY="sua-api-key-aqui"
LALAMOVE_SECRET="seu-secret-aqui"
LALAMOVE_BASE_URL="https://rest.sandbox.lalamove.com" # Sandbox
# LALAMOVE_BASE_URL="https://rest.lalamove.com" # Produção
LALAMOVE_WEBHOOK_SECRET="seu-webhook-secret"
```

### 2. Configuração do Webhook

No painel do Lalamove, configure o webhook para:
- **URL**: `https://seu-dominio.com/api/webhooks/lalamove`
- **Eventos**: `ORDER_STATUS_CHANGED`, `DRIVER_ASSIGNED`, `DRIVER_LOCATION_UPDATED`

## 🚀 Funcionalidades Implementadas

### 1. Solicitação de Entrega

```typescript
import { useLalamove } from '@/hooks/use-lalamove';

const { requestDelivery } = useLalamove();

// Solicitar entrega para o cliente
const result = await requestDelivery(rental);
if (result) {
  console.log('Pedido criado:', result.orderId);
  console.log('Valor da entrega:', result.quotation.totalFee);
}
```

### 2. Solicitação de Coleta

```typescript
const { requestPickup } = useLalamove();

// Solicitar coleta do cliente
const result = await requestPickup(rental);
if (result) {
  console.log('Coleta solicitada:', result.orderId);
}
```

### 3. Rastreamento de Pedidos

```typescript
const { trackOrder, getTrackingUrl } = useLalamove();

// Obter detalhes do pedido
const order = await trackOrder(orderId);
if (order) {
  console.log('Status:', order.status);
  console.log('Motorista:', order.driverInfo);
}

// Obter URL de rastreamento
const trackingUrl = getTrackingUrl(orderId);
window.open(trackingUrl, '_blank');
```

### 4. Cancelamento de Pedidos

```typescript
const { cancelOrder } = useLalamove();

// Cancelar pedido
const success = await cancelOrder(orderId);
if (success) {
  console.log('Pedido cancelado com sucesso');
}
```

## 📊 Status e Mapeamento

### Status do Lalamove → Status do Sistema

| Status Lalamove | Status Sistema | Descrição |
|----------------|----------------|-----------|
| `ASSIGNING` | `aguardando_motorista` | Procurando motorista |
| `ON_GOING` | `indo_cliente` | Motorista a caminho |
| `PICKED_UP` | `em_transporte` | Item coletado, em transporte |
| `COMPLETED` | `entregue` | Entrega concluída |
| `CANCELLED` | `cancelado` | Pedido cancelado |
| `EXPIRED` | `expirado` | Pedido expirou |

## 🔄 Fluxo de Entrega

1. **Separação** → Cliente solicita entrega
2. **Solicitar Lalamove** → Sistema cria pedido no Lalamove
3. **Aguardando Motorista** → Lalamove procura motorista disponível
4. **Indo ao Cliente** → Motorista designado, a caminho da loja
5. **Em Transporte** → Motorista coletou o item, indo para o cliente
6. **Entregue** → Item entregue ao cliente

## 🔄 Fluxo de Devolução

1. **Cliente solicita devolução** → Sistema registra solicitação
2. **Aguardando Aceite** → Sistema cria pedido de coleta
3. **Motorista Indo ao Cliente** → Motorista a caminho do cliente
4. **Voltando para Loja** → Motorista coletou, retornando
5. **Em Conferência** → Item na loja, aguardando inspeção
6. **Finalizado** → Conferência concluída

## 🔧 Webhook e Atualizações Automáticas

O sistema recebe atualizações automáticas do Lalamove via webhook:

```typescript
// Endpoint: /api/webhooks/lalamove
// Eventos processados:
- ORDER_STATUS_CHANGED: Mudança de status do pedido
- DRIVER_ASSIGNED: Motorista designado
- DRIVER_LOCATION_UPDATED: Localização do motorista atualizada
```

### Estrutura do Payload do Webhook

```json
{
  "orderId": "LAL-123456789",
  "status": "ON_GOING",
  "eventType": "ORDER_STATUS_CHANGED",
  "timestamp": "2024-01-15T10:30:00Z",
  "driverInfo": {
    "name": "João Silva",
    "phone": "+5511999999999",
    "plateNumber": "ABC-1234",
    "photo": "https://..."
  },
  "driverLocation": {
    "lat": -23.5505,
    "lng": -46.6333,
    "bearing": 45
  }
}
```

## 🛡️ Segurança

### Validação de Webhook

Todos os webhooks são validados usando HMAC SHA256:

```typescript
function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

### Assinatura de Requisições

Todas as requisições para a API do Lalamove são assinadas:

```typescript
const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body || ''}`;
const signature = crypto.createHmac('sha256', secret).update(rawSignature).digest('hex');
```

## 🧪 Testes

### Ambiente Sandbox

Para testes, use o ambiente sandbox:
- **Base URL**: `https://rest.sandbox.lalamove.com`
- **Documentação**: [Lalamove API Docs](https://developers.lalamove.com/docs)

### Dados de Teste

```typescript
// Endereços de teste para São Paulo
const testAddresses = {
  store: "Rua Augusta, 123, São Paulo, SP",
  customer: "Av. Paulista, 456, São Paulo, SP"
};

// Coordenadas de teste
const testCoordinates = {
  store: { lat: "-23.5505", lng: "-46.6333" },
  customer: { lat: "-23.5629", lng: "-46.6544" }
};
```

## 📈 Monitoramento

### Logs

Todos os eventos são logados para monitoramento:

```typescript
console.log('Lalamove Request:', { orderId, status, timestamp });
console.log('Webhook Received:', { eventType, orderId });
console.error('Lalamove Error:', { error, orderId });
```

### Métricas

- Taxa de sucesso de entregas
- Tempo médio de entrega
- Cancelamentos por motivo
- Avaliações de motoristas

## 🚨 Tratamento de Erros

### Códigos de Erro Comuns

| Código | Descrição | Ação |
|--------|-----------|-------|
| 400 | Dados inválidos | Verificar payload |
| 401 | Não autorizado | Verificar API keys |
| 404 | Pedido não encontrado | Verificar orderId |
| 429 | Rate limit | Implementar retry |
| 500 | Erro interno | Tentar novamente |

### Retry Logic

```typescript
const retryRequest = async (fn: Function, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};
```

## 📞 Suporte

- **Documentação Oficial**: [Lalamove Developers](https://developers.lalamove.com/)
- **Suporte Técnico**: [Lalamove Support](https://www.lalamove.com/support)
- **Status da API**: [Lalamove Status](https://status.lalamove.com/)

## 🔄 Próximos Passos

1. **Implementar notificações push** para atualizações em tempo real
2. **Adicionar métricas de performance** para monitoramento
3. **Implementar cache** para reduzir chamadas à API
4. **Adicionar testes automatizados** para a integração
5. **Implementar fallback** para outros provedores de entrega