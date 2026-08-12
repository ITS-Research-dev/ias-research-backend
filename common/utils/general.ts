export function formatDuration(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`); // tampilkan "0s" kalau semuanya 0

  return parts.join(' ');
}

export function checkWeek(startDate: Date): string {
  const date = new Date(startDate);

  // Ambil hari dalam minggu (0 = Minggu, 1 = Senin, ..., 6 = Sabtu) versi UTC
  const day = date.getUTCDay();

  // Hitung selisih hari ke Senin di minggu yang sama
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const format = (d: Date): string => {
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}`;
  };

  return `${format(monday)} - ${format(sunday)}`;
}

export function checkMonth(startDate: Date): string {
  return startDate.toISOString().split('-')[1];
}
