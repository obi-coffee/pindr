export function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 4));
  if (digits.length > 4) parts.push(digits.slice(4, 8));
  return parts.join('-');
}

export function isoToDisplay(iso: string | null | undefined): string {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '';
  const [, y, m, d] = match;
  return `${m}-${d}-${y}`;
}

export function displayToIso(display: string): string | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(display);
  if (!match) return null;
  const [, m, d, y] = match;
  const monthNum = Number(m);
  const dayNum = Number(d);
  const yearNum = Number(y);
  if (monthNum < 1 || monthNum > 12) return null;
  if (dayNum < 1 || dayNum > 31) return null;
  if (yearNum < 1900 || yearNum > 2100) return null;
  const dt = new Date(yearNum, monthNum - 1, dayNum);
  if (
    dt.getFullYear() !== yearNum ||
    dt.getMonth() !== monthNum - 1 ||
    dt.getDate() !== dayNum
  ) {
    return null;
  }
  return `${y}-${m}-${d}`;
}

export function dateToDisplay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = d.getFullYear();
  return `${m}-${day}-${y}`;
}
