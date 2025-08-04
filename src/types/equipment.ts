// Tipos para o sistema de equipamentos/produtos

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

// Formulário de equipamento
export interface EquipmentFormData {
  name: string;
  description: string;
  categoryId: string;
  dailyRate: string;
  discountOptions: DiscountOptionFormData[];
  securityDeposit: string;
  stockQuantity: string;
  minStockAlert: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
    weight: string;
  };
  images: File[];
  technicalSheet?: File;
  manual?: File;
  barcode?: string;
  returnChecklist: ChecklistItemFormData[];
  status: 'active' | 'inactive' | 'maintenance';
}

export interface DiscountOptionFormData {
  id: string;
  minDays: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  description?: string;
}

export interface ChecklistItemFormData {
  id: string;
  description: string;
  required: boolean;
  order: number;
  category?: string;
}

// Filtros para listagem
export interface EquipmentFilters {
  search?: string;
  categoryId?: string;
  status?: Equipment['status'];
  partnerId?: string;
  minStock?: boolean;
  sortBy?: 'name' | 'createdAt' | 'dailyRate' | 'stock';
  sortOrder?: 'asc' | 'desc';
}

// Resposta da API
export interface EquipmentListResponse {
  equipments: Equipment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Stats de equipamentos
export interface EquipmentStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  lowStock: number;
  totalValue: number;
}