# Análise do Projeto Pro Rentals - Painel Administrativo

## Visão Geral do Negócio

O **Pro Rentals** é uma plataforma de marketplace para locação de equipamentos que conecta:
- **Pro Rentals**: Empresa gestora da plataforma (recebe comissão)
- **Parceiros**: Empresas que possuem os equipamentos para locação
- **Clientes**: Usuários finais que alugam através do app Flutter

### Modelo de Negócio
- Comissão sobre locações realizadas
- Integração com Asaas para pagamentos e split
- Logística via Lalamove (coleta e entrega)
- Validação de cobertura por CEP

## Estado Atual da Implementação

### ✅ Funcionalidades Implementadas
1. **Estrutura Base**
   - Next.js com TypeScript
   - Sistema de autenticação básico
   - Layout responsivo com sidebar
   - Componentes UI reutilizáveis

2. **Dashboard**
   - Métricas básicas
   - Visão geral do sistema

3. **Gestão de Parceiros**
   - CRUD completo
   - Filtros e busca
   - Validação de formulários

### ❌ Funcionalidades Pendentes
1. **Páginas vazias**: Equipment, Rentals, Clients, Financial, Settings
2. **Sistema de autenticação avançado**
3. **Integração com APIs externas**
4. **Wizard de cadastro**
5. **Sistema de permissões por role**

## Melhorias Necessárias por Funcionalidade

### 1. Login/Cadastro

#### Problemas Atuais:
- Sistema muito básico
- Não há wizard de cadastro
- Falta validação de CEP com Lalamove
- Não há integração com Asaas

#### Melhorias Propostas:
```typescript
// Novo fluxo de cadastro
interface RegistrationWizard {
  step1: CEPValidation;     // Validar cobertura Lalamove
  step2: CompanyData;       // Dados da empresa
  step3: AsaasIntegration;  // Criar conta no Asaas
  step4: UserCredentials;   // Credenciais de acesso
  step5: Confirmation;      // Confirmação e ativação
}

interface CEPValidation {
  zipCode: string;
  address: string;
  lalamoveCoverage: boolean;
  validatedAt: Date;
}
```

### 2. Gestão de Usuários

#### Implementar:
- Sistema de roles hierárquico
- Usuários vinculados por empresa
- Permissões granulares por menu

```typescript
interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
  partnerId?: string; // Vinculação à empresa
}

interface Permission {
  resource: string; // 'products', 'rentals', 'users'
  actions: ('create' | 'read' | 'update' | 'delete')[];
}
```

### 3. Cadastro de Produtos

#### Estrutura Completa Necessária:
```typescript
interface Product {
  // Dados básicos
  name: string;
  description: string;
  categoryId: string; // Categorias fixas do marketplace
  
  // Preços
  dailyRate: number; // Preço padrão da diária
  discountOptions: DiscountOption[]; // 3 opções de desconto
  securityDeposit: number; // Valor de caução
  
  // Estoque
  stockQuantity: number;
  minStockAlert: number;
  
  // Dimensões e peso
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
    lalamoveValidated: boolean;
  };
  
  // Mídia e documentação
  images: string[];
  technicalSheet?: string; // PDF
  manual?: string; // PDF opcional
  barcode?: string;
  
  // Checklist de devolução
  returnChecklist: ChecklistItem[];
}

interface DiscountOption {
  minDays: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  order: number;
}
```

#### Melhorias de UX:
- Modal/página dedicada para cadastro (não inline)
- Upload drag-and-drop para imagens
- Preview de imagens
- Validação em tempo real com Lalamove
- Wizard de cadastro em etapas

### 4. Gestão de Clientes

#### Implementar:
```typescript
interface ClientManagement {
  registeredUsers: Client[]; // Cadastrados no app
  activeClients: Client[];   // Com pedidos realizados
  clientHistory: ClientOrder[];
}

interface ClientOrder {
  orderId: string;
  status: OrderStatus;
  products: Product[];
  totalValue: number;
  orderDate: Date;
}
```

### 5. Reorganização de Menus

#### Estrutura Atual vs Proposta:

**Atual:**
- Dashboard
- Parceiros
- Clientes
- Equipamentos
- Aluguéis
- Financeiro
- Configurações

**Proposta:**
```
📊 Dashboard (consolidado com financeiro)
👥 Gestão de Parceiros
   ├── Lista de Parceiros
   ├── Dados da Empresa
   └── Usuários da Empresa
📦 Produtos/Equipamentos
👤 Clientes
📋 Locações (Kanban)
⚙️ Configurações
   ├── Categorias
   ├── Configurações Gerais
   └── Integrações (Asaas, Lalamove)
```

### 6. Sistema de Locações - Kanban

#### Status Propostos:
```typescript
interface RentalKanban {
  columns: [
    'separacao',      // Separar Pedido
    'pronto_envio',   // Pronto para Envio
    'aguardando_lalamove', // Aguardando Aceite Lalamove
    'em_transporte',  // Em Transporte
    'entregue',       // Entregue ao Cliente
    'em_uso',         // Em Uso pelo Cliente
    'coleta_agendada', // Coleta Agendada
    'em_retorno',     // Em Retorno
    'finalizado'      // Finalizado
  ];
}

interface RentalCard {
  id: string;
  clientName: string;
  products: string[];
  totalValue: number;
  deliveryAddress: string;
  status: RentalStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
}
```

### 7. Separação de Contextos

#### Marketplace vs Parceiro:
```typescript
interface UserContext {
  userType: 'marketplace_admin' | 'partner_admin' | 'partner_employee';
  permissions: Permission[];
  visibleMenus: MenuItem[];
  dataScope: 'all' | 'partner_only';
}
```

## Integrações Necessárias

### 1. Lalamove API
```typescript
interface LalamoveIntegration {
  validateCoverage(zipCode: string): Promise<boolean>;
  validateDimensions(dimensions: Dimensions): Promise<boolean>;
  createDelivery(order: DeliveryOrder): Promise<DeliveryResponse>;
  trackDelivery(deliveryId: string): Promise<DeliveryStatus>;
}
```

### 2. Asaas API
```typescript
interface AsaasIntegration {
  createSubAccount(companyData: CompanyData): Promise<AsaasAccount>;
  setupSplitPayment(mainAccount: string, subAccount: string): Promise<void>;
  processPayment(paymentData: PaymentData): Promise<PaymentResponse>;
}
```

## Próximos Passos Recomendados

### Fase 1: Estrutura Base (1-2 semanas)
1. ✅ Implementar sistema de roles e permissões
2. ✅ Criar wizard de cadastro de parceiros
3. ✅ Implementar validação de CEP
4. ✅ Separar contextos marketplace/parceiro

### Fase 2: Funcionalidades Core (2-3 semanas)
1. ✅ Implementar CRUD de produtos completo
2. ✅ Criar sistema de categorias
3. ✅ Implementar gestão de clientes
4. ✅ Desenvolver Kanban de locações

### Fase 3: Integrações (2-3 semanas)
1. ✅ Integração com Lalamove
2. ✅ Integração com Asaas
3. ✅ Sistema de upload de arquivos
4. ✅ Notificações em tempo real

### Fase 4: Refinamentos (1-2 semanas)
1. ✅ Otimizações de performance
2. ✅ Testes automatizados
3. ✅ Documentação
4. ✅ Deploy e monitoramento

## Considerações Técnicas

### Arquitetura Recomendada
- **Frontend**: Next.js 14+ (App Router)
- **Backend**: API Routes do Next.js ou NestJS separado
- **Database**: PostgreSQL com Prisma ORM
- **Storage**: AWS S3 ou Cloudinary para arquivos
- **Real-time**: Socket.io ou Pusher
- **Monitoring**: Sentry + Analytics

### Performance
- Implementar cache com Redis
- Otimizar queries com índices
- Lazy loading para listas grandes
- Compressão de imagens

### Segurança
- JWT com refresh tokens
- Rate limiting
- Validação de inputs
- Sanitização de uploads
- HTTPS obrigatório

Esta análise fornece uma base sólida para o desenvolvimento das funcionalidades pendentes e melhorias necessárias no sistema Pro Rentals.