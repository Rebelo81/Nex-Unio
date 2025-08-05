export interface DamageItem {
  id: string;
  itemName: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  repairCost: number;
  photos: string[]; // URLs das fotos
  category: 'structural' | 'functional' | 'aesthetic' | 'missing';
  reportedBy: string;
  reportedAt: Date;
  responsible?: 'tenant' | 'company' | 'third_party' | 'unknown';
  notes?: string;
  createdAt?: Date;
}

export interface DamageReport {
  id: string;
  rentalId: string;
  damages: DamageItem[];
  notes?: string;
  createdBy: string;
  createdAt: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  totalCost?: number;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
}