// Tipos de usuários
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'partner_admin' | 'partner_employee';
  partnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Parceiro
export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'pending';
  commissionRate: number;
  monthlyRevenue: number;
  activeRentals: number;
  totalEquipment: number;
  document?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Cliente
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: 'active' | 'inactive';
  totalRentals: number;
  createdAt: Date;
  updatedAt: Date;
}

// Equipamento
export interface Equipment {
  id: string;
  name: string;
  description: string;
  category: string;
  partnerId: string;
  partner?: Partner;
  dailyRate: number;
  status: 'available' | 'rented' | 'maintenance';
  images: string[];
  specifications: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Aluguel
export interface Rental {
  id: string;
  clientId: string;
  client?: Client;
  equipmentId: string;
  equipment?: Equipment;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'overdue';
  commissionAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Pagamento
export interface Payment {
  id: string;
  rentalId: string;
  rental?: Rental;
  amount: number;
  paymentDate: Date;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

// Comissão
export interface Commission {
  id: string;
  partnerId: string;
  partner?: Partner;
  rentalId: string;
  rental?: Rental;
  amount: number;
  status: 'pending' | 'paid';
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalPartners: number;
  activeClients: number;
  availableEquipment: number;
  ongoingRentals: number;
  monthlyRevenue: number;
  recentActivities: Activity[];
}

// Atividade
export interface Activity {
  id: string;
  type: 'partner_registered' | 'rental_created' | 'payment_received' | 'equipment_added';
  description: string;
  userId?: string;
  createdAt: Date;
}

// Filtros
export interface TableFilters {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  partnerId?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

// Resposta da API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Context de autenticação
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// Configurações da plataforma
export interface PlatformSettings {
  defaultCommissionRate: number;
  acceptedPaymentMethods: string[];
  cancellationPolicy: string;
  supportEmail: string;
  supportPhone: string;
}