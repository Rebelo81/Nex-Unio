import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@/types';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Gerar token JWT
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    partnerId: user.partnerId
  };
  // @ts-expect-error - JWT library type issue
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verificar token JWT
export function verifyToken(token: string): jwt.JwtPayload | string {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    throw new Error('Token inválido');
  }
}

// Hash da senha
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verificar senha
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Middleware de autenticação (para uso com Next.js API routes)
export function requireAuth(allowedRoles?: string[]) {
  return (req: { headers: { authorization?: string }; user?: unknown }, res: { status: (code: number) => { json: (data: unknown) => void } }, next: () => void) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
      }
      
      const decoded = verifyToken(token);
      
      if (allowedRoles && typeof decoded === 'object' && 'role' in decoded && !allowedRoles.includes(decoded.role as string)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ message: 'Token inválido' });
    }
  };
}

// Verificar se é super admin
export function isSuperAdmin(user: User): boolean {
  return user.role === 'super_admin';
}

// Verificar se é admin do parceiro
export function isPartnerAdmin(user: User): boolean {
  return user.role === 'partner_admin';
}

// Verificar se pode acessar dados do parceiro
export function canAccessPartner(user: User, partnerId: string): boolean {
  if (isSuperAdmin(user)) return true;
  return user.partnerId === partnerId;
}

// Gerar senha aleatória
export function generateRandomPassword(length: number = 8): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Validar força da senha
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}