export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
