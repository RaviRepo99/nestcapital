export function formatNPR(amount: number | undefined | null, includeDecimals = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'NPR 0.00';
  }
  
  const formatted = includeDecimals
    ? amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(amount).toLocaleString('en-IN');
    
  return `NPR ${formatted}`;
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string | undefined | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function calculateProfit(amount: number, returnRate: number): number {
  return (amount * returnRate) / 100;
}

export function calculateTotalReturn(amount: number, returnRate: number): number {
  return amount + calculateProfit(amount, returnRate);
}

export function calculateDailyReturn(amount: number, returnRate: number, durationDays: number): number {
  if (durationDays <= 0) return 0;
  const totalProfit = calculateProfit(amount, returnRate);
  return totalProfit / durationDays;
}

export function getStatusBadgeClass(status: string | undefined | null): string {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'approved':
    case 'verified':
    case 'success':
      return 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20';
    case 'pending':
    case 'under_review':
      return 'bg-amber-500/15 text-amber-800 border border-amber-500/30';
    case 'rejected':
    case 'cancelled':
    case 'failed':
      return 'bg-rose-500/10 text-rose-700 border border-rose-500/20';
    case 'unverified':
      return 'bg-slate-100 text-slate-700 border border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch {
    return false;
  }
}
