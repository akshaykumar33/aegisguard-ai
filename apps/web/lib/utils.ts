import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDate(dateString: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function formatDateTime(dateString: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

/**
 * Turn an entitlement feature code into a readable label.
 * MONTHLY_AI_REVIEWS -> "Monthly AI Reviews"
 */
export function formatFeatureCode(code: string): string {
  const acronyms = new Set(['AI', 'PR', 'API', 'GB', 'SSO', 'RBAC']);
  return code
    .split('_')
    .map((word) =>
      acronyms.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
}

export function truncate(str: string, length: number): string {
  if (!str || str.length <= length) return str;
  return str.slice(0, length) + '...';
}
