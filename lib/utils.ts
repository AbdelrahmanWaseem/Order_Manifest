export function getCustomerInitials(name: string): string {
  if (!name || !name.trim()) return '—';
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = Array.from(parts[0])[0] || '';
    const second = Array.from(parts[1])[0] || '';
    return `${first}${second}`.toUpperCase();
  }
  return Array.from(clean).slice(0, 2).join('').toUpperCase();
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  if (isNaN(num)) return String(amount);
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
