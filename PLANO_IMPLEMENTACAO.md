# Plano de Implementação - Pro Rentals

## Resumo Executivo

Baseado na análise do projeto Pro Rentals, identifiquei que o sistema atual possui uma base sólida mas precisa de implementações significativas para atender aos requisitos de negócio. O foco principal deve ser na criação das funcionalidades core que estão faltando e na melhoria da experiência do usuário.

## Priorização das Funcionalidades

### 🔴 Crítico (Implementar Primeiro)
1. **Sistema de Produtos/Equipamentos** - Core do negócio
2. **Gestão de Locações com Kanban** - Operação diária
3. **Sistema de Roles e Permissões** - Segurança
4. **Separação Marketplace vs Parceiro** - Contextos diferentes

### 🟡 Importante (Segunda Fase)
1. **Wizard de Cadastro Avançado** - UX melhorada
2. **Gestão de Clientes** - Relacionamento
3. **Integração com Lalamove** - Validações
4. **Dashboard Consolidado** - Visão gerencial

### 🟢 Desejável (Terceira Fase)
1. **Integração com Asaas** - Pagamentos
2. **Sistema de Notificações** - Comunicação
3. **Relatórios Avançados** - Analytics
4. **Mobile Responsivo** - Acessibilidade

## Implementação Detalhada

### FASE 1: Funcionalidades Core (Semana 1-2)

#### 1.1 Sistema de Produtos/Equipamentos

**Arquivos a criar:**
```
src/app/equipment/
├── page.tsx              # Lista de equipamentos
├── create/
│   └── page.tsx          # Wizard de criação
├── [id]/
│   ├── page.tsx          # Visualização
│   └── edit/
│       └── page.tsx      # Edição
└── components/
    ├── EquipmentCard.tsx
    ├── EquipmentForm.tsx
    ├── ImageUpload.tsx
    └── ChecklistBuilder.tsx
```

**Tipos a adicionar:**
```typescript
// src/types/equipment.ts
export interface Equipment {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  partnerId: string;
  
  // Preços
  dailyRate: number;
  discountOptions: DiscountOption[];
  securityDeposit: number;
  
  // Estoque
  stockQuantity: number;
  minStockAlert: number;
  currentStock: number;
  
  // Dimensões
  dimensions: EquipmentDimensions;
  
  // Mídia
  images: string[];
  technicalSheet?: string;
  manual?: string;
  barcode?: string;
  
  // Checklist
  returnChecklist: ChecklistItem[];
  
  // Status
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountOption {
  id: string;
  minDays: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  description?: string;
}

export interface EquipmentDimensions {
  length: number; // cm
  width: number;  // cm
  height: number; // cm
  weight: number; // kg
  lalamoveValidated: boolean;
  validatedAt?: Date;
}

export interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  order: number;
  category?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  active: boolean;
  createdAt: Date;
}
```

#### 1.2 Sistema de Locações com Kanban

**Arquivos a criar:**
```
src/app/rentals/
├── page.tsx              # Kanban principal
├── [id]/
│   └── page.tsx          # Detalhes da locação
└── components/
    ├── KanbanBoard.tsx
    ├── RentalCard.tsx
    ├── StatusColumn.tsx
    └── RentalDetails.tsx
```

**Tipos a adicionar:**
```typescript
// src/types/rental.ts
export interface Rental {
  id: string;
  orderNumber: string;
  clientId: string;
  client?: Client;
  partnerId: string;
  partner?: Partner;
  
  // Produtos
  items: RentalItem[];
  
  // Datas
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  
  // Valores
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  securityDeposit: number;
  
  // Status
  status: RentalStatus;
  paymentStatus: PaymentStatus;
  
  // Logística
  deliveryAddress: Address;
  pickupAddress?: Address;
  lalamoveDeliveryId?: string;
  lalamovePickupId?: string;
  
  // Observações
  notes?: string;
  internalNotes?: string;
  
  // Checklist de devolução
  returnChecklist?: CompletedChecklistItem[];
  returnedAt?: Date;
  returnCondition?: 'excellent' | 'good' | 'fair' | 'poor';
}

export type RentalStatus = 
  | 'separacao'
  | 'pronto_envio'
  | 'aguardando_lalamove'
  | 'em_transporte'
  | 'entregue'
  | 'em_uso'
  | 'coleta_agendada'
  | 'em_retorno'
  | 'finalizado'
  | 'cancelado';

export interface RentalItem {
  id: string;
  equipmentId: string;
  equipment?: Equipment;
  quantity: number;
  dailyRate: number;
  days: number;
  discountApplied?: DiscountOption;
  subtotal: number;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
```

#### 1.3 Sistema de Roles e Permissões

**Arquivos a criar:**
```
src/lib/auth/
├── permissions.ts        # Definições de permissões
├── roles.ts             # Definições de roles
└── context.tsx          # Context de autenticação

src/components/auth/
├── ProtectedRoute.tsx   # Proteção de rotas
├── RoleGuard.tsx        # Proteção por role
└── PermissionGuard.tsx  # Proteção por permissão
```

**Implementação:**
```typescript
// src/lib/auth/permissions.ts
export enum Permission {
  // Produtos
  PRODUCTS_VIEW = 'products:view',
  PRODUCTS_CREATE = 'products:create',
  PRODUCTS_EDIT = 'products:edit',
  PRODUCTS_DELETE = 'products:delete',
  
  // Locações
  RENTALS_VIEW = 'rentals:view',
  RENTALS_CREATE = 'rentals:create',
  RENTALS_EDIT = 'rentals:edit',
  RENTALS_MANAGE = 'rentals:manage',
  
  // Clientes
  CLIENTS_VIEW = 'clients:view',
  CLIENTS_EDIT = 'clients:edit',
  
  // Usuários
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',
  
  // Financeiro
  FINANCIAL_VIEW = 'financial:view',
  FINANCIAL_MANAGE = 'financial:manage',
  
  // Configurações
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
  
  // Admin
  ADMIN_ALL = 'admin:all'
}

export const ROLE_PERMISSIONS = {
  super_admin: [Permission.ADMIN_ALL],
  partner_admin: [
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_EDIT,
    Permission.PRODUCTS_DELETE,
    Permission.RENTALS_VIEW,
    Permission.RENTALS_MANAGE,
    Permission.CLIENTS_VIEW,
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.FINANCIAL_VIEW,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT
  ],
  partner_employee: [
    Permission.PRODUCTS_VIEW,
    Permission.RENTALS_VIEW,
    Permission.RENTALS_EDIT,
    Permission.CLIENTS_VIEW
  ]
};
```

### FASE 2: Melhorias de UX (Semana 3-4)

#### 2.1 Wizard de Cadastro de Parceiros

**Arquivos a criar:**
```
src/app/partners/register/
├── page.tsx              # Wizard principal
└── components/
    ├── StepIndicator.tsx
    ├── CEPValidation.tsx
    ├── CompanyForm.tsx
    ├── UserForm.tsx
    └── Confirmation.tsx
```

#### 2.2 Gestão de Clientes

**Arquivos a criar:**
```
src/app/clients/
├── page.tsx              # Lista de clientes
├── [id]/
│   └── page.tsx          # Perfil do cliente
└── components/
    ├── ClientCard.tsx
    ├── ClientHistory.tsx
    └── ClientStats.tsx
```

#### 2.3 Dashboard Consolidado

**Melhorar:**
```
src/app/dashboard/page.tsx
```

**Adicionar:**
- Métricas financeiras
- Gráficos de performance
- Atividades recentes
- Alertas importantes

### FASE 3: Integrações (Semana 5-6)

#### 3.1 Integração Lalamove

**Arquivos a criar:**
```
src/lib/integrations/
├── lalamove.ts          # Cliente da API
└── types.ts             # Tipos da integração

src/app/api/
├── lalamove/
│   ├── validate-cep/
│   ├── validate-dimensions/
│   └── create-delivery/
```

#### 3.2 Sistema de Upload

**Arquivos a criar:**
```
src/components/upload/
├── ImageUpload.tsx      # Upload de imagens
├── FileUpload.tsx       # Upload de arquivos
└── UploadProgress.tsx   # Progresso do upload

src/lib/upload/
├── cloudinary.ts        # Cliente Cloudinary
└── validation.ts        # Validação de arquivos
```

## Cronograma de Implementação

### Semana 1
- [ ] Estrutura de tipos para Equipment
- [ ] Página de listagem de equipamentos
- [ ] Formulário básico de criação
- [ ] Sistema de categorias

### Semana 2
- [ ] Wizard completo de equipamentos
- [ ] Upload de imagens
- [ ] Sistema de checklist
- [ ] Validações avançadas

### Semana 3
- [ ] Estrutura Kanban para locações
- [ ] Cards de locação
- [ ] Drag and drop entre status
- [ ] Detalhes de locação

### Semana 4
- [ ] Sistema de roles completo
- [ ] Proteção de rotas
- [ ] Separação de contextos
- [ ] Wizard de cadastro de parceiros

### Semana 5
- [ ] Gestão de clientes
- [ ] Dashboard consolidado
- [ ] Integração Lalamove básica
- [ ] Validação de CEP

### Semana 6
- [ ] Sistema de upload completo
- [ ] Validação de dimensões
- [ ] Notificações básicas
- [ ] Testes e refinamentos

## Considerações de Implementação

### Performance
- Implementar lazy loading para listas grandes
- Cache de dados frequentemente acessados
- Otimização de imagens
- Paginação eficiente

### UX/UI
- Design system consistente
- Feedback visual para ações
- Loading states
- Error handling amigável

### Segurança
- Validação de inputs
- Sanitização de uploads
- Rate limiting
- Logs de auditoria

### Testes
- Testes unitários para funções críticas
- Testes de integração para APIs
- Testes E2E para fluxos principais

Este plano fornece uma roadmap clara para implementar todas as funcionalidades necessárias do Pro Rentals de forma estruturada e eficiente.