import { format, isToday as dateIsToday, isSameDay as dateIsSameDay, parseISO, isValid } from 'date-fns';

export function formatDate(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }
    return format(parsedDate, 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }
    return format(parsedDate, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    return 'Invalid date';
  }
}

export function formatTime(date: string | Date): { hour: string; period: string; full: string } {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return { hour: '--', period: '--', full: 'Invalid time' };
    }
    
    const hour = format(parsedDate, 'h');
    const period = format(parsedDate, 'a');
    const full = format(parsedDate, 'h:mm a');
    
    return { hour, period, full };
  } catch (error) {
    return { hour: '--', period: '--', full: 'Invalid time' };
  }
}

export function formatRelativeDate(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - parsedDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (diffInMinutes < 10080) {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else {
      return formatDate(parsedDate);
    }
  } catch (error) {
    return 'Invalid date';
  }
}

export function isToday(date: string | Date): boolean {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsedDate) && dateIsToday(parsedDate);
  } catch (error) {
    return false;
  }
}

export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  try {
    const parsedDate1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const parsedDate2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    
    return isValid(parsedDate1) && isValid(parsedDate2) && dateIsSameDay(parsedDate1, parsedDate2);
  } catch (error) {
    return false;
  }
}

export function isOverdue(dueDate: string | Date): boolean {
  try {
    const parsedDate = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    return isValid(parsedDate) && parsedDate < new Date();
  } catch (error) {
    return false;
  }
}

export function getDaysUntilDate(date: string | Date): number {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 0;
    }
    
    const now = new Date();
    const diffInTime = parsedDate.getTime() - now.getTime();
    return Math.ceil(diffInTime / (1000 * 3600 * 24));
  } catch (error) {
    return 0;
  }
}

export function formatDateForInput(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return '';
    }
    return format(parsedDate, 'yyyy-MM-dd');
  } catch (error) {
    return '';
  }
}

export function formatDateTimeForInput(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return '';
    }
    return format(parsedDate, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    return '';
  }
}

export function getIndianDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getIndianTime(): string {
  return new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
