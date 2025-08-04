// Sistema de cores Pro Rentals - Baseado no contexto de locação de equipamentos
// Paleta inspirada em equipamentos industriais, construção e confiabilidade

export const colors = {
  // Cores primárias - Laranja vibrante (equipamentos de construção)
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Cor principal - Laranja Pro Rentals
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },

  // Cores secundárias - Azul aço (confiabilidade e tecnologia)
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7', // Azul secundário
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Cores de status
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Verde sucesso
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Amarelo aviso
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Vermelho erro
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Cores neutras - Cinza industrial
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Cores específicas para equipamentos
  equipment: {
    construction: '#f97316', // Laranja - Equipamentos de construção
    garden: '#22c55e',       // Verde - Equipamentos de jardinagem
    cleaning: '#0ea5e9',     // Azul - Equipamentos de limpeza
    events: '#8b5cf6',       // Roxo - Equipamentos para eventos
    industrial: '#6b7280',   // Cinza - Equipamentos industriais
  },

  // Gradientes
  gradients: {
    primary: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    secondary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    dark: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
  },
};

// Mapeamento para Tailwind CSS
export const tailwindColors = {
  primary: colors.primary,
  secondary: colors.secondary,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  neutral: colors.neutral,
  equipment: colors.equipment,
};

// Cores para modo escuro
export const darkModeColors = {
  background: {
    primary: '#0f172a',   // Azul escuro profundo
    secondary: '#1e293b', // Azul escuro médio
    tertiary: '#334155',  // Azul escuro claro
  },
  text: {
    primary: '#f8fafc',   // Branco quase puro
    secondary: '#cbd5e1', // Cinza claro
    muted: '#94a3b8',     // Cinza médio
  },
  border: {
    primary: '#334155',   // Borda principal
    secondary: '#475569', // Borda secundária
  },
};

export default colors;