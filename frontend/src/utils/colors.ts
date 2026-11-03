// Color palette for medical UI
export const COLORS = {
  primary: '#0f4c81',
  secondary: '#0891b2',
  accent: '#0ea5e9',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  benign: '#22d3ee',
  malignant: '#f97316',
  stages: {
    'I': '#22c55e',
    'II': '#eab308',
    'IIIa': '#f97316',
    'IIIb': '#ef4444',
    'IV': '#7c3aed',
  }
};

export const CHART_COLORS = [
  '#0891b2', '#0f4c81', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
];

export function formatNumber(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return 'N/A';
  return Number(n).toFixed(decimals);
}

export function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getStageColor(stage: string): string {
  return (COLORS.stages as Record<string, string>)[stage] || '#6b7280';
}

