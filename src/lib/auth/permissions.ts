// Sistema de permissões e roles

export enum Permission {
  // Produtos/Equipamentos
  PRODUCTS_VIEW = 'products:view',
  PRODUCTS_CREATE = 'products:create',
  PRODUCTS_EDIT = 'products:edit',
  PRODUCTS_DELETE = 'products:delete',
  PRODUCTS_MANAGE_CATEGORIES = 'products:manage_categories',
  
  // Locações
  RENTALS_VIEW = 'rentals:view',
  RENTALS_VIEW_ALL = 'rentals:view_all', // Ver todas as locações (marketplace)
  RENTALS_CREATE = 'rentals:create',
  RENTALS_EDIT = 'rentals:edit',
  RENTALS_MANAGE = 'rentals:manage',
  RENTALS_CANCEL = 'rentals:cancel',
  
  // Clientes
  CLIENTS_VIEW = 'clients:view',
  CLIENTS_VIEW_ALL = 'clients:view_all', // Ver todos os clientes (marketplace)
  CLIENTS_EDIT = 'clients:edit',
  CLIENTS_CREATE = 'clients:create',
  
  // Usuários
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',
  
  // Parceiros
  PARTNERS_VIEW = 'partners:view',
  PARTNERS_CREATE = 'partners:create',
  PARTNERS_EDIT = 'partners:edit',
  PARTNERS_DELETE = 'partners:delete',
  PARTNERS_MANAGE_ALL = 'partners:manage_all', // Gerenciar todos os parceiros (marketplace)
  
  // Financeiro
  FINANCIAL_VIEW = 'financial:view',
  FINANCIAL_VIEW_ALL = 'financial:view_all', // Ver financeiro de todos (marketplace)
  FINANCIAL_MANAGE = 'financial:manage',
  FINANCIAL_REPORTS = 'financial:reports',
  
  // Configurações
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
  SETTINGS_PLATFORM = 'settings:platform', // Configurações da plataforma (marketplace)
  
  // Dashboard
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_ANALYTICS = 'dashboard:analytics',
  DASHBOARD_ADMIN = 'dashboard:admin', // Dashboard administrativo (marketplace)
  
  // Integrações
  INTEGRATIONS_VIEW = 'integrations:view',
  INTEGRATIONS_MANAGE = 'integrations:manage',
  
  // Admin
  ADMIN_ALL = 'admin:all'
}

export enum Role {
  // Marketplace Roles
  SUPER_ADMIN = 'super_admin',           // Acesso total ao sistema
  MARKETPLACE_ADMIN = 'marketplace_admin', // Administrador do marketplace
  MARKETPLACE_MANAGER = 'marketplace_manager', // Gerente do marketplace
  
  // Partner Roles
  PARTNER_ADMIN = 'partner_admin',       // Administrador do parceiro
  PARTNER_MANAGER = 'partner_manager',   // Gerente do parceiro
  PARTNER_EMPLOYEE = 'partner_employee'  // Funcionário do parceiro
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    Permission.ADMIN_ALL
  ],
  
  [Role.MARKETPLACE_ADMIN]: [
    // Produtos
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_MANAGE_CATEGORIES,
    
    // Locações
    Permission.RENTALS_VIEW,
    Permission.RENTALS_VIEW_ALL,
    Permission.RENTALS_MANAGE,
    
    // Clientes
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_VIEW_ALL,
    Permission.CLIENTS_EDIT,
    
    // Parceiros
    Permission.PARTNERS_VIEW,
    Permission.PARTNERS_CREATE,
    Permission.PARTNERS_EDIT,
    Permission.PARTNERS_DELETE,
    Permission.PARTNERS_MANAGE_ALL,
    
    // Usuários
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    
    // Financeiro
    Permission.FINANCIAL_VIEW,
    Permission.FINANCIAL_VIEW_ALL,
    Permission.FINANCIAL_MANAGE,
    Permission.FINANCIAL_REPORTS,
    
    // Dashboard
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_ANALYTICS,
    Permission.DASHBOARD_ADMIN,
    
    // Configurações
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
    Permission.SETTINGS_PLATFORM,
    
    // Integrações
    Permission.INTEGRATIONS_VIEW,
    Permission.INTEGRATIONS_MANAGE
  ],
  
  [Role.MARKETPLACE_MANAGER]: [
    // Produtos
    Permission.PRODUCTS_VIEW,
    
    // Locações
    Permission.RENTALS_VIEW,
    Permission.RENTALS_VIEW_ALL,
    Permission.RENTALS_EDIT,
    
    // Clientes
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_VIEW_ALL,
    Permission.CLIENTS_EDIT,
    
    // Parceiros
    Permission.PARTNERS_VIEW,
    Permission.PARTNERS_EDIT,
    
    // Financeiro
    Permission.FINANCIAL_VIEW,
    Permission.FINANCIAL_VIEW_ALL,
    Permission.FINANCIAL_REPORTS,
    
    // Dashboard
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_ANALYTICS,
    Permission.DASHBOARD_ADMIN,
    
    // Configurações
    Permission.SETTINGS_VIEW
  ],
  
  [Role.PARTNER_ADMIN]: [
    // Produtos
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_EDIT,
    Permission.PRODUCTS_DELETE,
    
    // Locações
    Permission.RENTALS_VIEW,
    Permission.RENTALS_MANAGE,
    
    // Clientes
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_EDIT,
    
    // Usuários (da própria empresa)
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    
    // Financeiro (próprio)
    Permission.FINANCIAL_VIEW,
    Permission.FINANCIAL_MANAGE,
    
    // Dashboard
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_ANALYTICS,
    
    // Configurações (próprias)
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
    
    // Integrações
    Permission.INTEGRATIONS_VIEW
  ],
  
  [Role.PARTNER_MANAGER]: [
    // Produtos
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_EDIT,
    
    // Locações
    Permission.RENTALS_VIEW,
    Permission.RENTALS_EDIT,
    Permission.RENTALS_MANAGE,
    
    // Clientes
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_EDIT,
    
    // Usuários (visualizar apenas)
    Permission.USERS_VIEW,
    
    // Financeiro (próprio)
    Permission.FINANCIAL_VIEW,
    
    // Dashboard
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_ANALYTICS,
    
    // Configurações (visualizar apenas)
    Permission.SETTINGS_VIEW
  ],
  
  [Role.PARTNER_EMPLOYEE]: [
    // Produtos
    Permission.PRODUCTS_VIEW,
    
    // Locações
    Permission.RENTALS_VIEW,
    Permission.RENTALS_EDIT,
    
    // Clientes
    Permission.CLIENTS_VIEW,
    
    // Dashboard
    Permission.DASHBOARD_VIEW
  ]
};

// Função para verificar se um usuário tem uma permissão específica
export function hasPermission(userRole: Role, permission: Permission): boolean {
  // Super admin tem acesso a tudo
  if (userRole === Role.SUPER_ADMIN) {
    return true;
  }
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Verifica se tem a permissão específica ou ADMIN_ALL
  return rolePermissions.includes(permission) || rolePermissions.includes(Permission.ADMIN_ALL);
}

// Função para verificar múltiplas permissões (AND)
export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Função para verificar se tem pelo menos uma das permissões (OR)
export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Função para obter todas as permissões de um role
export function getRolePermissions(role: Role): Permission[] {
  if (role === Role.SUPER_ADMIN) {
    return Object.values(Permission);
  }
  
  return ROLE_PERMISSIONS[role] || [];
}

// Função para verificar se é um role de marketplace
export function isMarketplaceRole(role: Role): boolean {
  return [
    Role.SUPER_ADMIN,
    Role.MARKETPLACE_ADMIN,
    Role.MARKETPLACE_MANAGER
  ].includes(role);
}

// Função para verificar se é um role de parceiro
export function isPartnerRole(role: Role): boolean {
  return [
    Role.PARTNER_ADMIN,
    Role.PARTNER_MANAGER,
    Role.PARTNER_EMPLOYEE
  ].includes(role);
}

// Configuração de menus baseada em roles
export interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  requiredPermissions: Permission[];
  children?: MenuItem[];
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'home',
    requiredPermissions: [Permission.DASHBOARD_VIEW]
  },
  {
    id: 'products',
    label: 'Produtos',
    path: '/equipment',
    icon: 'package',
    requiredPermissions: [Permission.PRODUCTS_VIEW]
  },
  {
    id: 'rentals',
    label: 'Locações',
    path: '/rentals',
    icon: 'calendar',
    requiredPermissions: [Permission.RENTALS_VIEW]
  },
  {
    id: 'clients',
    label: 'Clientes',
    path: '/clients',
    icon: 'users',
    requiredPermissions: [Permission.CLIENTS_VIEW]
  },
  {
    id: 'partners',
    label: 'Parceiros',
    path: '/partners',
    icon: 'building',
    requiredPermissions: [Permission.PARTNERS_VIEW]
  },
  {
    id: 'financial',
    label: 'Financeiro',
    path: '/financial',
    icon: 'dollar-sign',
    requiredPermissions: [Permission.FINANCIAL_VIEW]
  },
  {
    id: 'users',
    label: 'Usuários',
    path: '/users',
    icon: 'user-plus',
    requiredPermissions: [Permission.USERS_VIEW]
  },
  {
    id: 'settings',
    label: 'Configurações',
    path: '/settings',
    icon: 'settings',
    requiredPermissions: [Permission.SETTINGS_VIEW]
  }
];

// Função para filtrar menus baseado nas permissões do usuário
export function getAvailableMenuItems(userRole: Role): MenuItem[] {
  return MENU_ITEMS.filter(item => 
    hasAnyPermission(userRole, item.requiredPermissions)
  ).map(item => ({
    ...item,
    children: item.children?.filter(child => 
      hasAnyPermission(userRole, child.requiredPermissions)
    )
  }));
}