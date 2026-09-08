export const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const formatDateIndo = (dateStr: string, withTime: boolean = false): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  };

  return new Intl.DateTimeFormat('id-ID', options).format(date);
};

export const getMonthName = (monthNumber: number, isShort: boolean = false): string => {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const shortMonths = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Ags',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  // Support both 1-based and 0-based
  const idx = monthNumber > 0 && monthNumber <= 12 ? monthNumber - 1 : monthNumber;
  return (isShort ? shortMonths[idx] : months[idx]) || '';
};

export const formatPercent = (val: number): string => {
  return `${(val || 0).toFixed(1)}%`;
};
